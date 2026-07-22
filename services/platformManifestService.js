const MANIFEST_URL = process.env.EXPO_PUBLIC_FIELDCHECK_MANIFEST_URL
  || 'https://fieldcheckpro.com.br/downloads/app-manifest.json';

export const PLATFORM_FALLBACK = {
  product: 'FieldCheck Pro',
  channel: 'demo',
  version: '1.0.7',
  version_code: 8,
  mandatory: false,
  download_page_url: 'https://fieldcheckpro.com.br/demo-apk/',
  platform_page_url: 'https://fieldcheckpro.com.br/plataforma/',
  portal_url: '',
  expedition_url: 'https://brs-expedicao-inteligente.vercel.app',
  support_url: 'https://wa.me/5543984594216?text=Ola%2C%20preciso%20de%20ajuda%20com%20o%20FieldCheck%20Pro',
  privacy_url: 'https://fieldcheckpro.com.br/privacidade/',
  release_notes: [],
};

export async function carregarManifestoPlataforma() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Manifesto indisponivel (${response.status})`);
    const data = await response.json();
    return { ...PLATFORM_FALLBACK, ...data, source: 'remote' };
  } catch (error) {
    return { ...PLATFORM_FALLBACK, source: 'fallback', error: error?.message || 'indisponivel' };
  } finally {
    clearTimeout(timeout);
  }
}

export function compararVersaoInstalada(manifest, versionCode = 8) {
  const latestCode = Number(manifest?.version_code || 0);
  const currentCode = Number(versionCode || 0);
  return {
    currentCode,
    latestCode,
    updateAvailable: latestCode > currentCode,
    mandatory: latestCode > currentCode && manifest?.mandatory === true,
  };
}
