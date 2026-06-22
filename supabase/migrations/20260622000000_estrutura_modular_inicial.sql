-- Primeira etapa compatível da arquitetura modular.
-- Mantém o vínculo legado por nome da empresa até a migração para empresa_id (UUID).

create table if not exists public.empresas_configuracoes (
  id uuid primary key default gen_random_uuid(),
  empresa text not null unique,
  setor text not null default 'servicos_tecnicos',
  modulos_ativos jsonb not null default '[]'::jsonb,
  rotulos jsonb not null default '{}'::jsonb,
  permissoes jsonb not null default '{}'::jsonb,
  recursos jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.empresas_configuracoes enable row level security;

drop policy if exists "empresa lê sua configuração modular" on public.empresas_configuracoes;
create policy "empresa lê sua configuração modular"
on public.empresas_configuracoes for select
to authenticated
using (
  exists (
    select 1 from public.tecnicos t
    where t.user_id = auth.uid()
      and t.ativo = true
      and lower(trim(t.empresa)) = lower(trim(empresas_configuracoes.empresa))
  )
);

drop policy if exists "administrador configura módulos da empresa" on public.empresas_configuracoes;
create policy "administrador configura módulos da empresa"
on public.empresas_configuracoes for all
to authenticated
using (
  exists (
    select 1 from public.tecnicos t
    where t.user_id = auth.uid()
      and t.ativo = true
      and t.papel = 'administrador'
      and lower(trim(t.empresa)) = lower(trim(empresas_configuracoes.empresa))
  )
)
with check (
  exists (
    select 1 from public.tecnicos t
    where t.user_id = auth.uid()
      and t.ativo = true
      and t.papel = 'administrador'
      and lower(trim(t.empresa)) = lower(trim(empresas_configuracoes.empresa))
  )
);

create index if not exists empresas_configuracoes_empresa_lower_idx
  on public.empresas_configuracoes (lower(trim(empresa)));
