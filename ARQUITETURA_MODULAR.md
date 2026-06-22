# Arquitetura modular do FieldCheck Pro

## Objetivo

Uma única plataforma deve atender construção civil, manutenção industrial, varejo, instalação técnica, energia solar, vidraçarias, mecânicas, limpeza profissional e novos setores. Setor não significa aplicativo separado: ele oferece uma configuração inicial que cada empresa pode ajustar.

## Camadas

1. **Núcleo comum:** autenticação, empresa, usuários, sincronização, anexos, relatórios, auditoria e assinatura.
2. **Catálogo de módulos:** ordens, execução em campo, checklists, ocorrências, inventário, clientes, relatórios, equipe, aprovações e auditoria.
3. **Preset de setor:** conjunto inicial de módulos, nomes e modelos recomendado para cada segmento.
4. **Configuração da empresa:** ativa/desativa módulos, altera rótulos e define recursos próprios.
5. **Permissão por perfil:** administrador, supervisor, técnico e futuros perfis personalizados.
6. **Fluxos configuráveis:** etapas, campos, checklists, evidências, aprovações e relatórios sem duplicar telas.

## Regra de resolução

`núcleo + plano contratado + preset do setor + configuração da empresa + permissão do perfil`

O acesso só é liberado quando todas as camadas aplicáveis permitem o módulo. A interface não deve ser a única proteção: as mesmas regras precisam existir no banco com políticas de acesso.

## Identidade da empresa

O estado atual usa o nome da empresa como vínculo. A estrutura definitiva deve usar `empresa_id` imutável (UUID). O nome passa a ser apenas um dado editável. A migração será gradual para não interromper os clientes existentes.

## Modelo de dados planejado

- `empresas`: cadastro central do cliente/tenant.
- `setores_catalogo`: setores disponíveis.
- `modulos_catalogo`: módulos existentes e dependências.
- `empresas_configuracoes`: setor, identidade visual, rótulos e recursos.
- `empresa_modulos`: módulos contratados/ativados por empresa.
- `perfis`: perfis padrão e personalizados.
- `perfil_modulos`: permissões de visualizar, criar, editar, aprovar e administrar.
- `fluxos`: tipos de operação configuráveis.
- `fluxo_etapas`: sequência e regras de execução.
- `formularios_modelos` e `formularios_campos`: campos dinâmicos.
- `checklists_modelos` e `checklists_itens`: verificações e evidências.

## Estratégia de migração

1. Introduzir o catálogo compartilhado e manter o comportamento atual como padrão seguro.
2. Criar as tabelas modulares e migrar a empresa atual sem remover colunas existentes.
3. Fazer aplicativo e portal carregarem a mesma configuração remota.
4. Transformar menus fixos em menus derivados de módulos e permissões.
5. Separar o portal atual em páginas/componentes por módulo.
6. Migrar ordens e checklists para fluxos configuráveis.
7. Aplicar políticas de segurança por `empresa_id` e validar isolamento entre clientes.
8. Remover gradualmente as regras antigas somente após regressão completa.

## Compatibilidade

Se a configuração remota ainda não existir ou a internet falhar, o cliente atual recebe o preset `servicos_tecnicos`, equivalente ao conjunto de funções já disponível. Isso evita telas vazias e permite uma implantação progressiva.

## Estado implantado em 22/06/2026

- Tabela `empresas_configuracoes` publicada no Supabase com RLS por empresa.
- Somente administradores podem alterar a configuração da própria empresa.
- As duas empresas existentes receberam o preset compatível `servicos_tecnicos`.
- Portal separado fisicamente nos módulos `dashboard`, `orders`, `models`, `team`, `approvals`, `audit` e `configuration`.
- Catálogo modular compartilhado entre portal e aplicativo.
- Portal e exportação Android validados após a implantação.
