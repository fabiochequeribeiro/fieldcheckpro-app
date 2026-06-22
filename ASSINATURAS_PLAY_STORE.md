# FieldCheck Pro - Assinaturas e teste grátis

## Modelo sugerido no Play Console

Crie uma assinatura:

- Product ID: fieldcheck_pro
- Nome: FieldCheck Pro
- Base plan mensal: mensal
- Base plan anual: anual
- Oferta para novos clientes: trial_30_dias
- Fase da oferta: teste grátis de 30 dias

## Como o app ficou preparado

- O app calcula teste grátis de 30 dias por empresa.
- O acesso é validado após o login.
- Se o teste estiver ativo, o app libera todas as telas.
- Se o teste terminar, o app mostra a tela de assinatura e bloqueia o restante.
- Se a tabela assinaturas_empresas existir no Supabase, o controle fica centralizado no banco.
- Se a tabela ainda não existir, o app usa um controle local temporário para não travar os testes.

## Próximo passo obrigatório antes da venda real

Conectar Google Play Billing no app para concluir a compra dentro da Play Store.

Enquanto isso não estiver integrado, não use links externos de pagamento dentro do app publicado na Play Store.
