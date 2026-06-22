insert into public.empresas_configuracoes (
  empresa,
  setor,
  modulos_ativos,
  rotulos,
  permissoes,
  recursos,
  ativo
)
select distinct
  trim(t.empresa),
  'servicos_tecnicos',
  '["dashboard","ordens","execucao_campo","checklists","ocorrencias","inventario","clientes","relatorios","equipe","aprovacoes","auditoria","assinatura"]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  true
from public.tecnicos t
where nullif(trim(t.empresa), '') is not null
on conflict (empresa) do nothing;

