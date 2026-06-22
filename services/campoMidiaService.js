import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../supabase';

const BUCKET = 'fieldcheck-media';

function segmentoSeguro(valor, fallback = 'registro') {
  const texto = String(valor || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return texto || fallback;
}

function origemDaMidia(referencia) {
  if (!referencia) return '';
  if (typeof referencia === 'string') return referencia;
  return referencia.dataUri || referencia.uri || referencia.uriOriginal || referencia.fotoBase64 || '';
}

function mimeDaMidia(origem = '', referencia = {}) {
  if (referencia?.mime_type) return referencia.mime_type;
  const texto = String(origem).toLowerCase();
  if (texto.startsWith('data:image/png') || texto.endsWith('.png')) return 'image/png';
  if (texto.startsWith('data:image/webp') || texto.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function extensaoDoMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

async function lerBase64(origem) {
  if (!origem) return '';
  const texto = String(origem);
  if (texto.startsWith('data:')) return texto.split(',')[1] || '';
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(texto) && texto.length > 500) return texto.replace(/\s/g, '');
  return new File(texto).base64();
}

async function enviarMidia(referencia, { empresa, grupo, registro, nome }) {
  if (!referencia) return null;
  if (referencia?.storage_path) return referencia;

  const origem = origemDaMidia(referencia);
  if (!origem) return null;
  const mime = mimeDaMidia(origem, referencia);
  const base64 = await lerBase64(origem);
  if (!base64) throw new Error('Nao foi possivel ler uma das imagens.');

  const caminho = [
    segmentoSeguro(empresa, 'empresa'),
    segmentoSeguro(grupo),
    segmentoSeguro(registro),
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${segmentoSeguro(nome)}.${extensaoDoMime(mime)}`,
  ].join('/');

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, decode(base64), {
    contentType: mime,
    upsert: false,
    cacheControl: '3600',
  });
  if (error) throw error;

  return {
    storage_path: caminho,
    mime_type: mime,
    data: referencia?.data || new Date().toISOString(),
  };
}

export async function enviarMidiasVisita({ equipamentos = [], assinatura = null, empresa, numeroOs }) {
  const equipamentosRemotos = [];
  for (let equipamentoIndex = 0; equipamentoIndex < equipamentos.length; equipamentoIndex += 1) {
    const equipamento = equipamentos[equipamentoIndex] || {};
    const fotoEquipamento = await enviarMidia(equipamento.foto || equipamento.fotoBase64 || equipamento.foto_path, {
      empresa,
      grupo: 'visitas',
      registro: numeroOs,
      nome: `equipamento-${equipamentoIndex + 1}`,
    });
    const itensRemotos = [];
    for (let itemIndex = 0; itemIndex < (equipamento.itens || []).length; itemIndex += 1) {
      const item = equipamento.itens[itemIndex] || {};
      const fotoItem = await enviarMidia(item.foto || item.fotoBase64 || item.foto_path, {
        empresa,
        grupo: 'visitas',
        registro: numeroOs,
        nome: `equipamento-${equipamentoIndex + 1}-item-${itemIndex + 1}`,
      });
      itensRemotos.push({ ...item, foto: null, fotoBase64: null, foto_path: fotoItem?.storage_path || item.foto_path || null });
    }
    equipamentosRemotos.push({
      ...equipamento,
      foto: null,
      fotoBase64: null,
      foto_path: fotoEquipamento?.storage_path || equipamento.foto_path || null,
      itens: itensRemotos,
    });
  }

  const assinaturaRemota = await enviarMidia(assinatura, {
    empresa,
    grupo: 'visitas',
    registro: numeroOs,
    nome: 'assinatura',
  });

  return {
    equipamentos: equipamentosRemotos,
    assinaturaPath: assinaturaRemota?.storage_path || null,
  };
}

export async function enviarFotosOcorrencia({ fotos = [], empresa, ocorrenciaId }) {
  const remotas = [];
  for (let index = 0; index < fotos.length; index += 1) {
    const foto = await enviarMidia(fotos[index], {
      empresa,
      grupo: 'ocorrencias',
      registro: ocorrenciaId,
      nome: `foto-${index + 1}`,
    });
    if (foto) remotas.push(foto);
  }
  return remotas;
}
