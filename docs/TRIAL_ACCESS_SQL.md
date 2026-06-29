# Controle de Trial FieldCheck Pro

SQL sugerido para habilitar o controle pelo Supabase sem depender da data do celular.

```sql
alter table public.empresas
  add column if not exists trial_start date,
  add column if not exists trial_end date,
  add column if not exists trial_status text default 'active_trial',
  add column if not exists plan_status text default 'trial',
  add column if not exists modules_enabled jsonb default '[]'::jsonb,
  add column if not exists trial_extension_requested boolean default false,
  add column if not exists trial_extension_days integer,
  add column if not exists trial_extension_reason text;

create table if not exists public.beta_extension_requests (
  id text primary key,
  empresa_id uuid,
  usuario_id uuid,
  usuario text,
  empresa text,
  trial_extension_requested boolean default true,
  trial_extension_days integer not null,
  trial_extension_reason text,
  status text default 'pendente',
  created_at timestamptz default now()
);

create table if not exists public.beta_feedback (
  id text primary key,
  empresa_id uuid,
  usuario_id uuid,
  nota integer,
  modulo text,
  comentario text,
  dificuldade text,
  sugestao text,
  tags jsonb,
  empresa text,
  usuario text,
  versao_app text,
  trial_status text,
  created_at timestamptz default now(),
  sync_status text default 'pendente'
);

create or replace function public.get_server_time()
returns timestamptz
language sql
stable
as $$
  select now();
$$;
```

Estados esperados:

- `active_trial`
- `trial_expiring`
- `trial_expired`
- `extended_trial`
- `active_paid`
- `suspended`
- `cancelled`

Quando uma empresa contratar, defina `plan_status = 'active_paid'` e mantenha `modules_enabled` com os modulos liberados.
