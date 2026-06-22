create table if not exists public.assinaturas_empresas (
  id uuid primary key default gen_random_uuid(),
  empresa text not null unique,
  status_assinatura text not null default 'trial',
  plano text not null default 'trial_30_dias',
  trial_inicio timestamptz not null default now(),
  trial_fim timestamptz not null default (now() + interval '30 days'),
  assinatura_expira_em timestamptz,
  limite_tecnicos integer not null default 1,
  google_product_id text,
  google_purchase_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assinaturas_empresas enable row level security;

drop policy if exists "Tecnicos podem ler assinatura da propria empresa" on public.assinaturas_empresas;
create policy "Tecnicos podem ler assinatura da propria empresa"
on public.assinaturas_empresas
for select
to authenticated
using (
  exists (
    select 1
    from public.tecnicos t
    where lower(t.email) = lower(auth.jwt() ->> 'email')
      and lower(t.empresa) = lower(assinaturas_empresas.empresa)
      and t.ativo = true
  )
);

drop policy if exists "Tecnicos podem criar trial da propria empresa" on public.assinaturas_empresas;
create policy "Tecnicos podem criar trial da propria empresa"
on public.assinaturas_empresas
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tecnicos t
    where lower(t.email) = lower(auth.jwt() ->> 'email')
      and lower(t.empresa) = lower(assinaturas_empresas.empresa)
      and t.ativo = true
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assinaturas_empresas_set_updated_at on public.assinaturas_empresas;
create trigger assinaturas_empresas_set_updated_at
before update on public.assinaturas_empresas
for each row execute function public.set_updated_at();
