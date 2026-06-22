import * as Location from 'expo-location';

export async function capturarLocalizacaoCampo() {
  try {
    const permissaoAtual = await Location.getForegroundPermissionsAsync();
    const permissao = permissaoAtual.granted
      ? permissaoAtual
      : await Location.requestForegroundPermissionsAsync();

    if (!permissao.granted) {
      return { disponivel: false, motivo: 'permissao_negada', capturado_em: new Date().toISOString() };
    }

    const posicao = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('tempo_esgotado')), 15000)),
    ]);

    return {
      disponivel: true,
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
      precisao_metros: posicao.coords.accuracy,
      altitude: posicao.coords.altitude,
      capturado_em: new Date(posicao.timestamp || Date.now()).toISOString(),
    };
  } catch (erro) {
    return {
      disponivel: false,
      motivo: erro?.message || 'localizacao_indisponivel',
      capturado_em: new Date().toISOString(),
    };
  }
}
