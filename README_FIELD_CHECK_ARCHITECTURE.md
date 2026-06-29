# FieldCheck Pro / FieldCheck Hub - Arquitetura SaaS

## Visao geral

O FieldCheck Pro e composto por:

- Aplicativo React Native/Expo para tecnicos em campo.
- Portal Web FieldCheck Hub para gestores e Super Admin.
- Supabase existente para autenticacao, dados, storage e funcoes.
- Camada offline-first no app com AsyncStorage, historico local e fila de sincronizacao.
- Camada de IA assistida mockada/local, preparada para Supabase Edge Function ou backend proprio.

## Regras preservadas

- `app.json`, package name, slug e configuracoes EAS nao foram alterados.
- A autenticacao Supabase existente foi preservada.
- Nenhuma chave OpenAI foi adicionada ao app ou ao portal.
- Fluxos manuais continuam funcionando sem IA.
- Sugestoes de IA exigem revisao humana antes de aplicar.

## Design System

App mobile:

- `theme/fieldCheckTheme.js`: cores, espacamentos, radius, sombras e status.
- `components/fieldcheck/AppComponents.js`: AppHeader, AppButton, AppCard, MetricCard, ModuleCard, StatusBadge, SyncStatusBadge, EmptyState, LoadingState, ErrorState, SectionTitle e AiCard.

Portal:

- `fieldcheck-erp-web/src/theme/fieldCheckHubTheme.js`
- `fieldcheck-erp-web/src/components/hub/HubComponents.jsx`

## IA

Servicos do app:

- `services/AIService.js`: fachada central para chamadas futuras de IA.
- `services/PromptService.js`: prompts e payloads padronizados.
- `services/RecommendationService.js`: recomendacoes de manutencao, pendencias e chat gerencial.
- `services/PhotoInspectionService.js`: estrutura para analise de fotos.
- `services/BudgetAssistant.js`: rascunho de orcamentos.
- `services/aiChecklistService.js`: fachada para sugestoes de checklist.
- `services/fieldCheckAiService.js`: capacidades da Central IA e mocks operacionais.

Servicos do portal:

- `fieldcheck-erp-web/src/services/AIService.js`
- `fieldcheck-erp-web/src/services/PromptService.js`
- `fieldcheck-erp-web/src/services/RecommendationService.js`
- `fieldcheck-erp-web/src/services/PhotoInspectionService.js`
- `fieldcheck-erp-web/src/services/BudgetAssistant.js`

Backend futuro recomendado:

- Supabase Edge Function com chave OpenAI em segredo de servidor.
- Validacao de `empresa_id`, perfil, permissoes e auditoria antes de consultar ou responder.

## Modulos preparados

- Assistente IA
- Resumo inteligente da visita
- Sugestao de checklist por equipamento
- Analise de fotos
- Assistente de pendencias
- Recomendacoes de manutencao
- Orcamentos
- Chat IA para gestores
- Timeline inteligente
- Notification Center
- QR Code por equipamento

## Portal FieldCheck Hub

O Command Center inclui:

- Resumo geral
- Atividades recentes
- Alertas
- Pendencias
- Eventos e timeline
- Indicadores rapidos
- Status do sistema
- Saude do banco
- Empresas online
- Modulos ativos
- Uso da IA
- Licencas/plano

## Multiempresa e seguranca

A arquitetura atual preserva os filtros existentes por empresa e perfil. Para escala:

- Todo backend novo deve validar `empresa_id`.
- Super Admin acessa visao global.
- Admin Empresa acessa dados da empresa.
- Supervisor acessa operacao da empresa.
- Tecnico acessa execucao de campo.

## Como rodar o app

```bash
npm install
npx expo start
```

## Validar export Android

```bash
npx expo export --platform android --output-dir dist-validacao
```

## APK preview

```bash
eas build --profile preview --platform android
```

## Como rodar o portal

```bash
cd fieldcheck-erp-web
npm install
npm run dev
```

## Build do portal

```bash
cd fieldcheck-erp-web
npm run build
```

## Pontos externos pendentes

- Criar Supabase Edge Function para IA real.
- Definir tabelas futuras de auditoria, notificacoes, consumo de IA e logs.
- Configurar push notification se desejado.
- Definir leitura QR Code quando o modulo de scanner for priorizado.
