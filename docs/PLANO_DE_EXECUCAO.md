# Plano de execução da auditoria

## Concluído nesta branch

- branch isolada criada para não alterar a versão atual;
- remoção de permissões Android legadas;
- bloqueio explícito de armazenamento externo antigo;
- comandos de verificação do Expo adicionados;
- modelo de migração para vínculo por `user_id` e RLS criado;
- critérios de teste offline, multiempresa e publicação documentados.

## Próxima etapa — exige leitura completa dos fluxos e teste

1. substituir a consulta principal de técnico por `user_id`, mantendo fallback temporário por e-mail;
2. migrar contas antigas para preencher `tecnicos.user_id`;
3. inventariar todas as tabelas com dados de empresa;
4. aplicar e testar RLS tabela por tabela;
5. mapear todos os pontos que gravam checklists, fotos, ocorrências e levantamentos;
6. criar uma fila offline idempotente;
7. garantir salvamento após cada alteração relevante;
8. adicionar status visual de sincronização;
9. impedir perda de dados ao fechar o aplicativo;
10. controlar o assistente de IA por módulo/plano;
11. dividir responsabilidades do `App.js` sem reescrever o aplicativo;
12. gerar APK preview e executar teste real em aparelho.

## Regra de segurança

A migração SQL presente nesta branch é um modelo. Ela não deve ser aplicada cegamente no banco. Primeiro é necessário confirmar nomes, tipos, políticas atuais e registros existentes no Supabase.
