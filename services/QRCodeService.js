export function buildEquipmentQRCodePayload({ equipamento = {}, empresa_id = null }) {
  return JSON.stringify({
    type: 'fieldcheck_equipment',
    version: 1,
    empresa_id,
    equipamento_id: equipamento.id || equipamento.local_id || null,
    tag: equipamento.tag || equipamento.codigo_tag || '',
    nome: equipamento.nome || equipamento.tipo || '',
    generated_at: new Date().toISOString(),
  });
}

export function parseEquipmentQRCodePayload(value) {
  try {
    const payload = JSON.parse(String(value || ''));
    return payload?.type === 'fieldcheck_equipment' ? payload : null;
  } catch (_error) {
    return null;
  }
}
