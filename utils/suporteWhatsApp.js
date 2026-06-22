import { Alert, Linking } from 'react-native';

export const WHATSAPP_SUPORTE = '5543984594216';

export async function abrirSuporteWhatsApp(mensagem = 'Olá, preciso de suporte do FieldCheck Pro.') {
  const texto = encodeURIComponent(mensagem);
  const url = `https://wa.me/${WHATSAPP_SUPORTE}?text=${texto}`;

  try {
    await Linking.openURL(url);
  } catch (erro) {
    console.log('Erro ao abrir WhatsApp:', erro);
    Alert.alert(
      'Suporte',
      'Não foi possível abrir o WhatsApp agora. Entre em contato pelo número +55 43 98459-4216.',
    );
  }
}
