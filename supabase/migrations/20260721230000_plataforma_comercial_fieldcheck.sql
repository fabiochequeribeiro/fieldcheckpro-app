begin;

-- Fundacao comercial compartilhada pelo Portal e pelo aplicativo.
-- Esta migracao e aditiva: nao remove nem renomeia estruturas existentes.

alter table public.empresas
  add column if not exists plano_status text not null default 'trial',
  add column if not exists assinatura_inicio timestamptz,
  add column if not exists assinatura_fim timestamptz,
  add column if not exists limite_usuarios integer,
  add column if not exists limite_dispositivos integer,
  add column if not exists grace_period_fim timestamptz;

create table if not exists public.fieldcheck_app_versoes (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null default 'android' check (plataforma in ('android', 'ios', 'web')),
  canal text not null default 'stable' check (canal in ('demo', 'pilot', 'stable')),
  versao text not null,
  version_code integer,
  obrigatoria boolean not null default false,
  download_url text,
  portal_url text,
  notas text,
  checksum_sha256 text,
  publicada_em timestamptz not null default now(),
  ativa boolean not null default true,
  unique (plataforma, canal, versao)
);

create table if not exists public.fieldcheck_dispositivos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  plataforma text not null default 'android',
  app_versao text,
  app_version_code integer,
  modelo text,
  ultimo_acesso_em timestamptz not null default now(),
  ativo boolean not null default true,
  unique (empresa_id, device_id)
);

create index if not exists fieldcheck_dispositivos_empresa_idx
  on public.fieldcheck_dispositivos(empresa_id, ativo);
create index if not exists fieldcheck_app_versoes_ativa_idx
  on public.fieldcheck_app_versoes(plataforma, canal, ativa, publicada_em desc);

alter table public.fieldcheck_app_versoes enable row level security;
alter table public.fieldcheck_dispositivos enable row level security;

drop policy if exists app_versoes_authenticated_select on public.fieldcheck_app_versoes;
create policy app_versoes_authenticated_select
  on public.fieldcheck_app_versoes for select to authenticated
  using (ativa = true);

drop policy if exists app_versoes_super_admin_all on public.fieldcheck_app_versoes;
create policy app_versoes_super_admin_all
  on public.fieldcheck_app_versoes for all to authenticated
  using (public.usuario_super_admin())
  with check (public.usuario_super_admin());

drop policy if exists dispositivos_empresa_select on public.fieldcheck_dispositivos;
create policy dispositivos_empresa_select
  on public.fieldcheck_dispositivos for select to authenticated
  using (public.usuario_tem_empresa(empresa_id));

drop policy if exists dispositivos_proprio_insert on public.fieldcheck_dispositivos;
create policy dispositivos_proprio_insert
  on public.fieldcheck_dispositivos for insert to authenticated
  with check (user_id = auth.uid() and public.usuario_tem_empresa(empresa_id));

drop policy if exists dispositivos_proprio_update on public.fieldcheck_dispositivos;
create policy dispositivos_proprio_update
  on public.fieldcheck_dispositivos for update to authenticated
  using (user_id = auth.uid() and public.usuario_tem_empresa(empresa_id))
  with check (user_id = auth.uid() and public.usuario_tem_empresa(empresa_id));

-- As funcoes auxiliares antigas sao SECURITY DEFINER porque precisam consultar o
-- perfil protegido por RLS. Retiramos o EXECUTE implicito de anon/PUBLIC e
-- liberamos apenas para sessoes autenticadas.
revoke all on function public.perfil_atual() from public, anon;
revoke all on function public.usuario_super_admin() from public, anon;
revoke all on function public.empresa_atual_id() from public, anon;
revoke all on function public.usuario_tem_empresa(uuid) from public, anon;
revoke all on function public.usuario_gestor_empresa(uuid) from public, anon;
revoke all on function public.usuario_supervisor_empresa(uuid) from public, anon;
revoke all on function public.usuario_admin_empresa(uuid) from public, anon;
revoke all on function public.empresa_tem_modulo(uuid, text) from public, anon;

grant execute on function public.perfil_atual() to authenticated;
grant execute on function public.usuario_super_admin() to authenticated;
grant execute on function public.empresa_atual_id() to authenticated;
grant execute on function public.usuario_tem_empresa(uuid) to authenticated;
grant execute on function public.usuario_gestor_empresa(uuid) to authenticated;
grant execute on function public.usuario_supervisor_empresa(uuid) to authenticated;
grant execute on function public.usuario_admin_empresa(uuid) to authenticated;
grant execute on function public.empresa_tem_modulo(uuid, text) to authenticated;

grant select on public.fieldcheck_app_versoes to authenticated;
grant select, insert, update on public.fieldcheck_dispositivos to authenticated;

commit;
