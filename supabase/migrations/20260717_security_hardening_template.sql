-- MODELO DE MIGRAÇÃO — NÃO APLICAR SEM VALIDAR O ESQUEMA ATUAL
-- FieldCheck Pro: vínculo seguro auth.users -> tecnicos e base para isolamento multiempresa.

begin;

-- 1) Garanta que o técnico possa ser vinculado ao usuário autenticado.
alter table if exists public.tecnicos
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 2) Evita dois perfis ativos vinculados ao mesmo usuário.
create unique index if not exists tecnicos_user_id_ativo_uidx
  on public.tecnicos (user_id)
  where user_id is not null and ativo is true;

-- 3) Índices usados com frequência nas políticas e consultas.
create index if not exists tecnicos_empresa_id_idx on public.tecnicos (empresa_id);
create index if not exists tecnicos_email_lower_idx on public.tecnicos (lower(email));

-- 4) Funções auxiliares. SECURITY DEFINER exige search_path fixo.
create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.empresa_id
  from public.tecnicos t
  where t.user_id = auth.uid()
    and t.ativo is true
    and coalesce(t.bloqueado, false) is false
  limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(t.perfil, t.papel, 'tecnico')
  from public.tecnicos t
  where t.user_id = auth.uid()
    and t.ativo is true
    and coalesce(t.bloqueado, false) is false
  limit 1;
$$;

revoke all on function public.current_empresa_id() from public;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_empresa_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;

-- 5) Exemplo para a própria tabela de técnicos.
-- Antes de habilitar, confirme se administradores precisam cadastrar usuários pelo cliente
-- ou se essa operação será feita por Edge Function/backend com service role.
alter table if exists public.tecnicos enable row level security;

-- Remova políticas antigas conflitantes manualmente após auditoria.
drop policy if exists "tecnicos_select_mesma_empresa" on public.tecnicos;
create policy "tecnicos_select_mesma_empresa"
on public.tecnicos
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    empresa_id = public.current_empresa_id()
    and public.current_user_role() in ('super_admin', 'admin_empresa', 'administrador', 'supervisor')
  )
);

-- 6) MODELO para tabelas operacionais com empresa_id.
-- Repita e adapte para pedidos, visitas, ocorrencias, levantamentos, clientes etc.
--
-- alter table public.NOME_DA_TABELA enable row level security;
--
-- create policy "NOME_select_mesma_empresa"
-- on public.NOME_DA_TABELA for select to authenticated
-- using (empresa_id = public.current_empresa_id());
--
-- create policy "NOME_insert_mesma_empresa"
-- on public.NOME_DA_TABELA for insert to authenticated
-- with check (empresa_id = public.current_empresa_id());
--
-- create policy "NOME_update_mesma_empresa"
-- on public.NOME_DA_TABELA for update to authenticated
-- using (empresa_id = public.current_empresa_id())
-- with check (empresa_id = public.current_empresa_id());
--
-- create policy "NOME_delete_gestores"
-- on public.NOME_DA_TABELA for delete to authenticated
-- using (
--   empresa_id = public.current_empresa_id()
--   and public.current_user_role() in ('super_admin', 'admin_empresa', 'administrador')
-- );

commit;
