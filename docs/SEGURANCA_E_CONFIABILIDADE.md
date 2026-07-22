# FieldCheck Pro — Segurança e Confiabilidade

Este documento registra as correções necessárias antes de ampliar o uso comercial do aplicativo.

## 1. Identidade do usuário

A tabela `tecnicos` deve usar `user_id` como vínculo principal com `auth.users.id`.

Ordem de consulta recomendada:

1. procurar `tecnicos.user_id = auth.users.id`;
2. usar e-mail apenas como compatibilidade temporária para contas antigas;
3. preencher `user_id` quando uma conta antiga for localizada por e-mail;
4. impedir mais de um técnico ativo para o mesmo `user_id`.

## 2. Separação multiempresa

Todas as tabelas operacionais devem possuir `empresa_id` obrigatório e políticas RLS que confirmem que o usuário pertence à mesma empresa.

Tabelas prioritárias para auditoria:

- tecnicos;
- empresas;
- clientes;
- pedidos;
- pedidos_equipamentos;
- visitas;
- historico_visitas;
- ocorrencias;
- levantamentos e seus itens;
- checklists e respostas;
- arquivos e metadados de fotos;
- assinaturas;
- planos, assinaturas e configurações modulares.

## 3. Persistência offline

Cada alteração operacional deve ser salva localmente antes de tentar sincronizar.

Cada registro da fila deve conter:

- `id_local` UUID;
- `empresa_id`;
- `usuario_id`;
- tipo da operação;
- payload;
- data de criação;
- número de tentativas;
- estado: `pendente`, `sincronizando`, `sincronizado` ou `erro`;
- mensagem do último erro;
- identificador remoto após confirmação.

A sincronização deve ser idempotente: repetir a mesma operação não pode criar registros duplicados.

## 4. Cache de perfil

O cache permite abrir o aplicativo temporariamente sem internet, mas não deve liberar ações sensíveis indefinidamente.

Regras recomendadas:

- perfil armazenado por usuário;
- prazo máximo de 24 horas para uso operacional comum;
- prazo menor para ações administrativas;
- invalidar cache ao sair;
- validar `ativo`, `bloqueado`, `empresa_id` e papel ao recuperar conexão;
- impedir sincronização quando o perfil estiver bloqueado.

## 5. Testes mínimos

Fluxos obrigatórios antes de publicar:

1. login online;
2. abertura offline com sessão válida;
3. criação de visita sem internet;
4. fechamento forçado do aplicativo durante preenchimento;
5. recuperação integral dos dados;
6. inclusão de fotos e assinatura;
7. retorno da internet e sincronização;
8. ausência de duplicidade após repetir sincronização;
9. geração de PDF;
10. bloqueio de acesso entre empresas diferentes.

## 6. Distribuição

- `preview`: APK interno para teste real;
- `production`: AAB para Play Store;
- nunca publicar diretamente após alterações de banco;
- testar primeiro em uma empresa piloto e em pelo menos dois aparelhos Android.

## 7. Critério de aprovação

Uma versão só deve ser unida à `main` quando:

- Expo Doctor estiver sem erros críticos;
- APK preview instalar e abrir;
- login funcionar;
- dados offline sobreviverem ao fechamento forçado;
- sincronização não duplicar registros;
- RLS impedir leitura e escrita de outra empresa;
- PDF, câmera, assinatura e localização forem validados no aparelho.
