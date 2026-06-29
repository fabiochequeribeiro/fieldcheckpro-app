export function buildEquipmentQrPayload(equipment = {}, companyId = null) {
  return JSON.stringify({
    type: 'fieldcheck_equipment',
    version: 1,
    companyId,
    equipmentId: equipment.id || null,
    tag: equipment.tag || '',
    name: equipment.nome || equipment.name || '',
  });
}
