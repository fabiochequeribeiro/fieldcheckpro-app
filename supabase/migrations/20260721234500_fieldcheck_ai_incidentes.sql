-- FieldCheck AI, feedback operacional e fila de engenharia.
-- Todas as entidades autenticadas permanecem isoladas por empresa via RLS.

create table if not exists public.fieldcheck_incidentes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('FCP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  criado_por uuid not null default auth.uid(),
  origem text not null default 'portal' check (origem in ('portal', 'app', 'site', 'expedicao', 'interno')),
  tipo text not null default 'feedback' check (tipo in ('feedback', 'incidente', 'duvida', 'sugestao')),
  categoria text not null default 'geral',
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta', 'critica')),
  status text not null default 'novo' check (status in ('novo', 'triagem', 'planejado', 'em_andamento', 'aguardando_usuario', 'resolvido', 'arquivado')),
  titulo text not null,
  descricao text not null,
  modulo text,
  versao_app text,
  contexto jsonb not null default '{}'::jsonb,
  triagem_ia jsonb not null default '{}'::jsonb,
  responsavel text,
  resolucao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.fieldcheck_ai_interacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null default auth.uid(),
  origem text not null default 'portal' check (origem in ('portal', 'app', 'expedicao', 'interno')),
  pergunta text not null,
  resposta text not null,
  modelo text,
  incidente_id uuid references public.fieldcheck_incidentes(id) on delete set null,
  avaliacao smallint check (avaliacao between 1 and 5),
  criado_em timestamptz not null default now()
);

create table if not exists public.fieldcheck_relatorios_operacionais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  periodo text not null check (periodo in ('diario', 'semanal', 'mensal')),
  inicio date not null,
  fim date not null,
  conteudo jsonb not null default '{}'::jsonb,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);

create index if not exists fieldcheck_incidentes_empresa_status_idx on public.fieldcheck_incidentes(empresa_id, status, criado_em desc);
create index if not exists fieldcheck_ai_interacoes_empresa_idx on public.fieldcheck_ai_interacoes(empresa_id, criado_em desc);
create index if not exists fieldcheck_relatorios_empresa_idx on public.fieldcheck_relatorios_operacionais(empresa_id, inicio desc);

alter table public.fieldcheck_incidentes enable row level security;
alter table public.fieldcheck_ai_interacoes enable row level security;
alter table public.fieldcheck_relatorios_operacionais enable row level security;

drop policy if exists fieldcheck_incidentes_select on public.fieldcheck_incidentes;
create policy fieldcheck_incidentes_select on public.fieldcheck_incidentes for select to authenticated
using (public.usuario_super_admin() or public.usuario_tem_empresa(empresa_id));
drop policy if exists fieldcheck_incidentes_insert on public.fieldcheck_incidentes;
create policy fieldcheck_incidentes_insert on public.fieldcheck_incidentes for insert to authenticated
with check (criado_por = auth.uid() and public.usuario_tem_empresa(empresa_id));
drop policy if exists fieldcheck_incidentes_update on public.fieldcheck_incidentes;
create policy fieldcheck_incidentes_update on public.fieldcheck_incidentes for update to authenticated
using (public.usuario_super_admin() or public.usuario_supervisor_empresa(empresa_id))
with check (public.usuario_super_admin() or public.usuario_supervisor_empresa(empresa_id));

drop policy if exists fieldcheck_ai_interacoes_select on public.fieldcheck_ai_interacoes;
create policy fieldcheck_ai_interacoes_select on public.fieldcheck_ai_interacoes for select to authenticated
using (public.usuario_super_admin() or (public.usuario_tem_empresa(empresa_id) and usuario_id = auth.uid()));
drop policy if exists fieldcheck_ai_interacoes_insert on public.fieldcheck_ai_interacoes;
create policy fieldcheck_ai_interacoes_insert on public.fieldcheck_ai_interacoes for insert to authenticated
with check (usuario_id = auth.uid() and public.usuario_tem_empresa(empresa_id));
drop policy if exists fieldcheck_ai_interacoes_update on public.fieldcheck_ai_interacoes;
create policy fieldcheck_ai_interacoes_update on public.fieldcheck_ai_interacoes for update to authenticated
using (usuario_id = auth.uid() and public.usuario_tem_empresa(empresa_id))
with check (usuario_id = auth.uid() and public.usuario_tem_empresa(empresa_id));

drop policy if exists fieldcheck_relatorios_select on public.fieldcheck_relatorios_operacionais;
create policy fieldcheck_relatorios_select on public.fieldcheck_relatorios_operacionais for select to authenticated
using (public.usuario_super_admin() or (empresa_id is not null and public.usuario_supervisor_empresa(empresa_id)));
drop policy if exists fieldcheck_relatorios_write on public.fieldcheck_relatorios_operacionais;
create policy fieldcheck_relatorios_write on public.fieldcheck_relatorios_operacionais for all to authenticated
using (public.usuario_super_admin() or (empresa_id is not null and public.usuario_admin_empresa(empresa_id)))
with check (public.usuario_super_admin() or (empresa_id is not null and public.usuario_admin_empresa(empresa_id)));

grant select, insert, update on public.fieldcheck_incidentes to authenticated;
grant select, insert, update on public.fieldcheck_ai_interacoes to authenticated;
grant select, insert, update, delete on public.fieldcheck_relatorios_operacionais to authenticated;
revoke all on public.fieldcheck_incidentes, public.fieldcheck_ai_interacoes, public.fieldcheck_relatorios_operacionais from anon;

