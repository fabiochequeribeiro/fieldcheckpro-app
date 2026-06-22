# FieldCheck Pro - Checklist de lanÃ§amento Play Store

## Antes de publicar
- Gerar build de teste APK e testar em celular real.
- Gerar build de produÃ§Ã£o em AAB para Play Store.
- Criar ou confirmar a chave de assinatura de produÃ§Ã£o.
- Ativar Play App Signing no Play Console.
- Conferir se o pacote Android Ã© com.fabio.fieldcheckpro.
- Conferir se versionCode Ã© maior que qualquer versÃ£o jÃ¡ enviada.
- Preencher polÃ­tica de privacidade e URL pÃºblica no Play Console.
- Testar login, cadastro de cliente, pedido/obra, checklist, levantamento de peÃ§as, ocorrÃªncias, PDF, Excel e compartilhamento.
- Testar uso sem internet e sincronizaÃ§Ã£o quando a internet voltar.

## Comandos Ãºteis

APK de teste:

```powershell
cd "C:\Users\BRS\Desktop\FieldCheck Pro\android"
.\gradlew.bat :app:assembleDebug
```

AAB de produÃ§Ã£o local, com chave configurada:

```powershell
cd "C:\Users\BRS\Desktop\FieldCheck Pro\android"
.\gradlew.bat :app:bundleRelease
```

AAB de produÃ§Ã£o com EAS:

```powershell
cd "C:\Users\BRS\Desktop\FieldCheck Pro"
eas build -p android --profile production
```
