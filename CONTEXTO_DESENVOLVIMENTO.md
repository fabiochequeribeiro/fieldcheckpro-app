# FieldCheck Pro — contexto de desenvolvimento

Atualizado em: 22/06/2026

## Conversa principal

- Nome: **FieldCheck Pro — Desenvolvimento**
- A conversa está fixada no Codex.
- A conversa anterior continua salva com o nome **Responder saudação**.
- Projeto principal: `C:\Users\BRS\Desktop\FieldCheck Pro`

## Versão atual

- Aplicativo: **1.0.6**
- Código Android: **7**
- O primeiro APK 1.0.6 local foi recusado pelo Android por usar uma assinatura de teste diferente.
- APK correto gerado pelo EAS em 22/06/2026: `FieldCheck-Pro-1.0.6-atualizacao-oficial.apk`
- Build EAS: `a208a824-1c84-4756-ae16-f7958ce91636`
- SHA-256: `298788B2C13B6A4264E89EF6762234FBB54C948839791D1858167518DA57A9CC`
- O APK oficial foi verificado e utiliza as credenciais remotas do projeto.
- Instalar por cima da versão anterior, sem desinstalar, para preservar os dados locais.

## Últimas correções aplicadas

- Campo de observações: correção do teclado que fechava após digitar uma letra.
- PDF/e-mail: leitura segura das imagens usadas no relatório.
- Finalização de visita: limpeza do rascunho local concluído.
- Atualização: remoção automática de rascunho antigo já salvo no celular.
- Ocorrências: item visível na área de Operações.
- Inventário: contador ignora linhas vazias.
- Perfis: técnica visualiza somente as áreas permitidas e ordens atribuídas.
- Compilação Android ajustada para `arm64` após falta de memória na montagem com quatro arquiteturas.

## Próximos testes no celular

1. Instalar o APK oficial por cima da versão atual e confirmar que não aparece conflito.
2. Digitar uma frase completa no campo de observações.
3. Gerar o PDF e tentar enviá-lo por e-mail.
4. Editar uma ocorrência e confirmar que não aparece tela preta.
5. Abrir um pedido finalizado e confirmar que não surge o alerta falso de visita em andamento.
6. Confirmar **Ocorrências de obra** na área de Operações.
7. Entrar com o perfil da Valeria e confirmar que ela vê apenas a ordem atribuída e os menus autorizados.

## Atenção

- Trocar a senha provisória da Valeria, pois ela apareceu em imagens da conversa anterior.
- O repositório possui diversas alterações ainda não registradas em um novo commit. Antes de qualquer limpeza ou publicação, revisar e criar um ponto de versão seguro.

## Regra de continuidade

Ao retomar o trabalho, abrir primeiro este arquivo e verificar o resultado dos seis testes acima. Atualizar este documento ao final de cada rodada importante.

## Direção modular definida em 22/06/2026

- O FieldCheck Pro será uma plataforma única e configurável, não aplicativos separados por setor.
- Setores iniciais: construção civil, manutenção industrial, repositor/varejo, instalação técnica, energia solar, vidraçarias, mecânicas e limpeza profissional.
- Resolução de acesso: núcleo + plano + preset do setor + configuração da empresa + permissão do perfil.
- Foi criado um catálogo compartilhado de módulos usado pelo aplicativo e pelo portal.
- O aplicativo agora filtra navegação e atalhos conforme módulos/perfil, mantendo o conjunto atual como fallback seguro.
- O portal ganhou a base da tela **Configuração**, com escolha de setor, módulos ativos e rótulos personalizados.
- As migrações `20260622000000_estrutura_modular_inicial.sql` e `20260622130000_seed_empresas_configuracoes.sql` foram aplicadas ao Supabase de produção.
- A tabela `empresas_configuracoes` está ativa com políticas por empresa e registros iniciais para as duas empresas existentes.
- O portal foi separado nos módulos: visão geral, ordens, modelos, equipe, aprovações, auditoria e configuração.
- A nova área **Configuração** permite ao administrador escolher setor, módulos e rótulos da própria empresa.
- Compilações de validação do Android e do portal passaram após a primeira etapa modular.
- Documento técnico principal: `ARQUITETURA_MODULAR.md`.
