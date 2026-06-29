begin;

create extension if not exists pgcrypto;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  documento text,
  email_responsavel text,
  telefone text,
  plano text not null default 'trial',
  status text not null default 'ativa' check (status in ('ativa', 'bloqueada', 'trial', 'cancelada')),
  trial_inicio timestamptz not null default now(),
  trial_fim timestamptz,
  modulos text[] not null default '{}',
  configuracao jsonb not null default '{}'::jsonb,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create table if not exists public.fieldcheck_modulos (
  id text primary key,
  nome text not null,
  categoria text not null default 'operacional',
  descricao text,
  ativo boolean not null default true,
  ordem int not null default 100
);

create table if not exists public.empresa_modulos (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  modulo_id text not null references public.fieldcheck_modulos(id) on delete cascade,
  ativo boolean not null default true,
  contratado_em timestamptz not null default now(),
  configuracao jsonb not null default '{}'::jsonb,
  primary key (empresa_id, modulo_id)
);

insert into public.fieldcheck_modulos (id, nome, categoria, descricao, ordem) values
  ('entrega_tecnica', 'Entrega Técnica', 'campo', 'Ordens, checklists, assinatura, PDF e aprovação técnica.', 10),
  ('manutencao_preventiva', 'Manutenção Preventiva', 'campo', 'Rotinas programadas de inspeção e manutenção preventiva.', 20),
  ('manutencao_corretiva', 'Manutenção Corretiva', 'campo', 'Atendimento de falhas, ocorrências e correções em campo.', 30),
  ('auditorias', 'Auditorias', 'gestao', 'Auditorias internas, evidências, revisões e aprovações.', 40),
  ('seguranca_trabalho', 'Segurança do Trabalho', 'campo', 'Inspeções de segurança, conformidade e evidências.', 50),
  ('inspecoes', 'Inspeções', 'campo', 'Checklists de inspeção por equipamento, local ou processo.', 60),
  ('repositor_loja', 'Repositor de Loja', 'varejo', 'Rotinas de reposição, fotos, presença e conferências.', 70),
  ('construcao_civil', 'Construção Civil', 'obra', 'Vistorias, etapas de obra, ocorrências e relatórios.', 80),
  ('agricultura', 'Agricultura', 'campo', 'Controle técnico de equipamentos, visitas e operações agrícolas.', 90),
  ('inventario', 'Inventário', 'controle', 'Levantamento de peças, itens e materiais em campo.', 100),
  ('controle_patrimonio', 'Controle de Patrimônio', 'controle', 'Cadastro, inspeção e histórico de patrimônios.', 110),
  ('frota', 'Frota', 'controle', 'Checklists e ocorrências para veículos e máquinas.', 120),
  ('formularios_personalizados', 'Formulários Personalizados', 'plataforma', 'Formulários e campos configuráveis por empresa.', 130)
on conflict (id) do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  descricao = excluded.descricao,
  ordem = excluded.ordem,
  ativo = true;

create or replace function public.slugify_fieldcheck(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'empresa')), '[^a-z0-9]+', '-', 'g'));
$$;

insert into public.empresas (nome, slug, status, plano, modulos)
select distinct
  nullif(trim(empresa), '') as nome,
  public.slugify_fieldcheck(nullif(trim(empresa), '')) as slug,
  'ativa',
  'trial',
  array['entrega_tecnica','inspecoes','inventario']
from (
  select empresa from public.tecnicos where empresa is not null
  union select empresa from public.pedidos where empresa is not null
  union select empresa from public.clientes where empresa is not null
  union select empresa from public.visitas where empresa is not null
) fonte
where nullif(trim(empresa), '') is not null
on conflict (slug) do nothing;

insert into public.empresas (nome, slug, status, plano, modulos)
values ('FieldCheck', 'fieldcheck', 'ativa', 'trial', array['entrega_tecnica','inspecoes','inventario'])
on conflict (slug) do nothing;

insert into public.empresa_modulos (empresa_id, modulo_id, ativo)
select e.id, m.id, true
from public.empresas e
cross join public.fieldcheck_modulos m
where m.id = any(coalesce(e.modulos, array['entrega_tecnica','inspecoes','inventario']))
on conflict (empresa_id, modulo_id) do update set ativo = excluded.ativo;

alter table public.tecnicos add column if not exists empresa_id uuid references public.empresas(id);
alter table public.tecnicos add column if not exists perfil text not null default 'tecnico';
alter table public.tecnicos add column if not exists bloqueado boolean not null default false;

update public.tecnicos t
set empresa_id = e.id
from public.empresas e
where t.empresa_id is null
  and lower(trim(t.empresa)) = lower(trim(e.nome));

update public.tecnicos
set perfil = case
  when papel = 'administrador' then 'admin_empresa'
  when papel = 'supervisor' then 'supervisor'
  when papel = 'super_admin' then 'super_admin'
  else 'tecnico'
end
where perfil is null or perfil = 'tecnico';

update public.tecnicos
set perfil = 'super_admin', papel = 'super_admin'
where lower(trim(email)) = lower(trim('fabiochequeribeiro@gmail.com'));

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'clientes',
    'pedidos',
    'equipamentos',
    'visitas',
    'modelos_checklist',
    'modelos_checklist_genericos',
    'modelos_checklist_genericos_itens',
    'levantamentos_pecas_obra',
    'levantamentos_pecas_obra_itens',
    'ocorrencias_obra',
    'rn_ocorrencias',
    'controle_entregas',
    'assinaturas_empresas',
    'auditoria_servicos',
    'empresas_configuracoes'
  ] loop
    if to_regclass('public.' || tabela) is not null then
      execute format('alter table public.%I add column if not exists empresa_id uuid references public.empresas(id)', tabela);
      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = tabela and column_name = 'empresa'
      ) then
        execute format(
          'update public.%I t set empresa_id = e.id from public.empresas e where t.empresa_id is null and lower(trim(t.empresa)) = lower(trim(e.nome))',
          tabela
        );
      end if;
    end if;
  end loop;
end $$;

update public.empresas_configuracoes c
set empresa_id = e.id
from public.empresas e
where c.empresa_id is null
  and lower(trim(c.empresa)) = lower(trim(e.nome));

alter table public.empresas_configuracoes add column if not exists plano text not null default 'trial';
create unique index if not exists empresas_configuracoes_empresa_id_unique
  on public.empresas_configuracoes(empresa_id)
  where empresa_id is not null;

create index if not exists empresas_slug_idx on public.empresas(slug);
create index if not exists tecnicos_user_empresa_idx on public.tecnicos(user_id, empresa_id);
create index if not exists tecnicos_empresa_perfil_idx on public.tecnicos(empresa_id, perfil);
create index if not exists empresa_modulos_empresa_idx on public.empresa_modulos(empresa_id, ativo);

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'clientes',
    'pedidos',
    'equipamentos',
    'visitas',
    'modelos_checklist',
    'modelos_checklist_genericos',
    'modelos_checklist_genericos_itens',
    'levantamentos_pecas_obra',
    'levantamentos_pecas_obra_itens',
    'ocorrencias_obra',
    'rn_ocorrencias',
    'controle_entregas',
    'assinaturas_empresas',
    'auditoria_servicos',
    'empresas_configuracoes'
  ] loop
    if to_regclass('public.' || tabela) is not null then
      execute format('create index if not exists %I on public.%I(empresa_id)', tabela || '_empresa_id_idx', tabela);
    end if;
  end loop;
end $$;

create or replace function public.perfil_atual()
returns table (
  tecnico_id bigint,
  user_id uuid,
  empresa_id uuid,
  empresa text,
  perfil text,
  papel text,
  ativo boolean,
  bloqueado boolean
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    t.id,
    t.user_id,
    t.empresa_id,
    t.empresa,
    coalesce(t.perfil, case when t.papel = 'administrador' then 'admin_empresa' else coalesce(t.papel, 'tecnico') end),
    t.papel,
    coalesce(t.ativo, true),
    coalesce(t.bloqueado, false)
  from public.tecnicos t
  where coalesce(t.ativo, true) = true
    and coalesce(t.bloqueado, false) = false
    and (
      t.user_id = auth.uid()
      or lower(trim(t.email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  order by case when t.perfil = 'super_admin' or t.papel = 'super_admin' then 0 else 1 end
  limit 1;
$$;

create or replace function public.usuario_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.perfil_atual() p
    where p.perfil = 'super_admin'
  );
$$;

create or replace function public.empresa_atual_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p.empresa_id from public.perfil_atual() p limit 1;
$$;

create or replace function public.usuario_tem_empresa(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.usuario_super_admin()
    or exists (
      select 1 from public.perfil_atual() p
      where p.empresa_id = target_empresa_id
    );
$$;

create or replace function public.usuario_gestor_empresa(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.usuario_super_admin()
    or exists (
      select 1 from public.perfil_atual() p
      where p.empresa_id = target_empresa_id
        and p.perfil = 'admin_empresa'
    );
$$;

create or replace function public.usuario_supervisor_empresa(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.usuario_super_admin()
    or exists (
      select 1 from public.perfil_atual() p
      where p.empresa_id = target_empresa_id
        and p.perfil in ('admin_empresa', 'supervisor')
    );
$$;

create or replace function public.usuario_admin_empresa(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.usuario_super_admin()
    or exists (
      select 1 from public.perfil_atual() p
      where p.empresa_id = target_empresa_id
        and p.perfil = 'admin_empresa'
    );
$$;

create or replace function public.empresa_tem_modulo(target_empresa_id uuid, target_modulo text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.empresa_modulos em
    where em.empresa_id = target_empresa_id
      and em.modulo_id = target_modulo
      and em.ativo = true
  );
$$;

create or replace function public.preencher_empresa_id_padrao()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  empresa_nome text;
begin
  if new.empresa_id is null then
    new.empresa_id := public.empresa_atual_id();
  end if;

  if new.empresa_id is null then
    begin
      empresa_nome := new.empresa;
    exception when undefined_column then
      empresa_nome := null;
    end;

    if nullif(trim(coalesce(empresa_nome, '')), '') is not null then
      select e.id into new.empresa_id
      from public.empresas e
      where lower(trim(e.nome)) = lower(trim(empresa_nome))
      limit 1;
    end if;
  end if;

  return new;
end;
$$;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'clientes',
    'pedidos',
    'equipamentos',
    'visitas',
    'modelos_checklist',
    'modelos_checklist_genericos',
    'modelos_checklist_genericos_itens',
    'levantamentos_pecas_obra',
    'levantamentos_pecas_obra_itens',
    'ocorrencias_obra',
    'rn_ocorrencias',
    'controle_entregas',
    'assinaturas_empresas',
    'auditoria_servicos',
    'empresas_configuracoes'
  ] loop
    if to_regclass('public.' || tabela) is not null then
      execute format('drop trigger if exists %I on public.%I', tabela || '_preencher_empresa_id', tabela);
      execute format(
        'create trigger %I before insert or update on public.%I for each row execute function public.preencher_empresa_id_padrao()',
        tabela || '_preencher_empresa_id',
        tabela
      );
    end if;
  end loop;
end $$;

alter table public.empresas enable row level security;
alter table public.fieldcheck_modulos enable row level security;
alter table public.empresa_modulos enable row level security;
alter table public.tecnicos enable row level security;

drop policy if exists empresas_super_admin_all on public.empresas;
drop policy if exists empresas_membros_select on public.empresas;
create policy empresas_super_admin_all on public.empresas for all to authenticated
using (public.usuario_super_admin())
with check (public.usuario_super_admin());
create policy empresas_membros_select on public.empresas for select to authenticated
using (public.usuario_tem_empresa(id));

drop policy if exists modulos_authenticated_select on public.fieldcheck_modulos;
create policy modulos_authenticated_select on public.fieldcheck_modulos for select to authenticated
using (true);

drop policy if exists empresa_modulos_select on public.empresa_modulos;
drop policy if exists empresa_modulos_super_admin_all on public.empresa_modulos;
create policy empresa_modulos_select on public.empresa_modulos for select to authenticated
using (public.usuario_tem_empresa(empresa_id));
create policy empresa_modulos_super_admin_all on public.empresa_modulos for all to authenticated
using (public.usuario_super_admin())
with check (public.usuario_super_admin());

drop policy if exists tecnicos_select_empresa on public.tecnicos;
drop policy if exists tecnicos_admin_all on public.tecnicos;
create policy tecnicos_select_empresa on public.tecnicos for select to authenticated
using (public.usuario_tem_empresa(empresa_id) or user_id = auth.uid());
create policy tecnicos_admin_all on public.tecnicos for all to authenticated
using (public.usuario_admin_empresa(empresa_id))
with check (public.usuario_admin_empresa(empresa_id));

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'clientes',
    'pedidos',
    'equipamentos',
    'modelos_checklist',
    'modelos_checklist_genericos',
    'modelos_checklist_genericos_itens',
    'levantamentos_pecas_obra',
    'levantamentos_pecas_obra_itens',
    'ocorrencias_obra',
    'rn_ocorrencias',
    'controle_entregas',
    'assinaturas_empresas',
    'empresas_configuracoes'
  ] loop
    if to_regclass('public.' || tabela) is not null then
      execute format('alter table public.%I enable row level security', tabela);
      execute format('drop policy if exists %I on public.%I', tabela || '_select_empresa_id', tabela);
      execute format('drop policy if exists %I on public.%I', tabela || '_gestor_all_empresa_id', tabela);
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.usuario_tem_empresa(empresa_id))',
        tabela || '_select_empresa_id',
        tabela
      );
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.usuario_gestor_empresa(empresa_id)) with check (public.usuario_gestor_empresa(empresa_id))',
        tabela || '_gestor_all_empresa_id',
        tabela
      );
    end if;
  end loop;
end $$;

alter table public.visitas enable row level security;
drop policy if exists visitas_select_empresa_id on public.visitas;
drop policy if exists visitas_insert_update_empresa_id on public.visitas;
create policy visitas_select_empresa_id on public.visitas for select to authenticated
using (public.usuario_tem_empresa(empresa_id));
create policy visitas_insert_update_empresa_id on public.visitas for all to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = visitas.empresa_id
      and p.perfil = 'tecnico'
      and (visitas.tecnico_id is null or visitas.tecnico_id = p.tecnico_id)
  )
)
with check (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = visitas.empresa_id
      and p.perfil = 'tecnico'
      and (visitas.tecnico_id is null or visitas.tecnico_id = p.tecnico_id)
  )
);

drop policy if exists pedidos_select_empresa_id on public.pedidos;
drop policy if exists pedidos_select_atribuido on public.pedidos;
create policy pedidos_select_atribuido on public.pedidos for select to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = pedidos.empresa_id
      and p.perfil = 'tecnico'
      and pedidos.tecnico_id = p.tecnico_id
  )
);

drop policy if exists equipamentos_select_empresa_id on public.equipamentos;
drop policy if exists equipamentos_select_atribuido on public.equipamentos;
create policy equipamentos_select_atribuido on public.equipamentos for select to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1
    from public.pedidos p
    join public.perfil_atual() perfil on perfil.empresa_id = equipamentos.empresa_id
    where p.empresa_id = equipamentos.empresa_id
      and p.numero_pedido = equipamentos.numero_pedido
      and perfil.perfil = 'tecnico'
      and p.tecnico_id = perfil.tecnico_id
  )
);

drop policy if exists ocorrencias_obra_select_empresa_id on public.ocorrencias_obra;
drop policy if exists ocorrencias_obra_gestor_all_empresa_id on public.ocorrencias_obra;
drop policy if exists ocorrencias_obra_select_restrito on public.ocorrencias_obra;
drop policy if exists ocorrencias_obra_insert_restrito on public.ocorrencias_obra;
drop policy if exists ocorrencias_obra_update_restrito on public.ocorrencias_obra;
create policy ocorrencias_obra_select_restrito on public.ocorrencias_obra for select to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = ocorrencias_obra.empresa_id
      and p.perfil = 'tecnico'
      and (ocorrencias_obra.tecnico_id = p.tecnico_id or ocorrencias_obra.criado_por = p.user_id)
  )
);
create policy ocorrencias_obra_insert_restrito on public.ocorrencias_obra for insert to authenticated
with check (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = ocorrencias_obra.empresa_id
      and p.perfil = 'tecnico'
      and (ocorrencias_obra.tecnico_id = p.tecnico_id or ocorrencias_obra.criado_por = p.user_id)
  )
);
create policy ocorrencias_obra_update_restrito on public.ocorrencias_obra for update to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = ocorrencias_obra.empresa_id
      and p.perfil = 'tecnico'
      and (ocorrencias_obra.tecnico_id = p.tecnico_id or ocorrencias_obra.criado_por = p.user_id)
  )
)
with check (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = ocorrencias_obra.empresa_id
      and p.perfil = 'tecnico'
      and (ocorrencias_obra.tecnico_id = p.tecnico_id or ocorrencias_obra.criado_por = p.user_id)
  )
);

drop policy if exists levantamentos_pecas_obra_select_empresa_id on public.levantamentos_pecas_obra;
drop policy if exists levantamentos_pecas_obra_gestor_all_empresa_id on public.levantamentos_pecas_obra;
drop policy if exists levantamentos_select_restrito on public.levantamentos_pecas_obra;
drop policy if exists levantamentos_insert_restrito on public.levantamentos_pecas_obra;
drop policy if exists levantamentos_update_restrito on public.levantamentos_pecas_obra;
create policy levantamentos_select_restrito on public.levantamentos_pecas_obra for select to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = levantamentos_pecas_obra.empresa_id
      and p.perfil = 'tecnico'
      and (levantamentos_pecas_obra.tecnico_id = p.tecnico_id or levantamentos_pecas_obra.criado_por = p.user_id)
  )
);
create policy levantamentos_insert_restrito on public.levantamentos_pecas_obra for insert to authenticated
with check (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = levantamentos_pecas_obra.empresa_id
      and p.perfil = 'tecnico'
      and (levantamentos_pecas_obra.tecnico_id = p.tecnico_id or levantamentos_pecas_obra.criado_por = p.user_id)
  )
);
create policy levantamentos_update_restrito on public.levantamentos_pecas_obra for update to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = levantamentos_pecas_obra.empresa_id
      and p.perfil = 'tecnico'
      and (levantamentos_pecas_obra.tecnico_id = p.tecnico_id or levantamentos_pecas_obra.criado_por = p.user_id)
  )
)
with check (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1 from public.perfil_atual() p
    where p.empresa_id = levantamentos_pecas_obra.empresa_id
      and p.perfil = 'tecnico'
      and (levantamentos_pecas_obra.tecnico_id = p.tecnico_id or levantamentos_pecas_obra.criado_por = p.user_id)
  )
);

drop policy if exists levantamentos_pecas_obra_itens_select_empresa_id on public.levantamentos_pecas_obra_itens;
drop policy if exists levantamentos_pecas_obra_itens_gestor_all_empresa_id on public.levantamentos_pecas_obra_itens;
drop policy if exists levantamento_itens_select_restrito on public.levantamentos_pecas_obra_itens;
drop policy if exists levantamento_itens_all_restrito on public.levantamentos_pecas_obra_itens;
create policy levantamento_itens_select_restrito on public.levantamentos_pecas_obra_itens for select to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1
    from public.levantamentos_pecas_obra l
    join public.perfil_atual() p on p.empresa_id = levantamentos_pecas_obra_itens.empresa_id
    where l.id = levantamentos_pecas_obra_itens.levantamento_id
      and l.empresa_id = levantamentos_pecas_obra_itens.empresa_id
      and p.perfil = 'tecnico'
      and (l.tecnico_id = p.tecnico_id or l.criado_por = p.user_id)
  )
);
create policy levantamento_itens_all_restrito on public.levantamentos_pecas_obra_itens for all to authenticated
using (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1
    from public.levantamentos_pecas_obra l
    join public.perfil_atual() p on p.empresa_id = levantamentos_pecas_obra_itens.empresa_id
    where l.id = levantamentos_pecas_obra_itens.levantamento_id
      and l.empresa_id = levantamentos_pecas_obra_itens.empresa_id
      and p.perfil = 'tecnico'
      and (l.tecnico_id = p.tecnico_id or l.criado_por = p.user_id)
  )
)
with check (
  public.usuario_supervisor_empresa(empresa_id)
  or exists (
    select 1
    from public.levantamentos_pecas_obra l
    join public.perfil_atual() p on p.empresa_id = levantamentos_pecas_obra_itens.empresa_id
    where l.id = levantamentos_pecas_obra_itens.levantamento_id
      and l.empresa_id = levantamentos_pecas_obra_itens.empresa_id
      and p.perfil = 'tecnico'
      and (l.tecnico_id = p.tecnico_id or l.criado_por = p.user_id)
  )
);

commit;
