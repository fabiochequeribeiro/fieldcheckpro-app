import { suggestChecklistForEquipment } from './fieldCheckAiService';

export async function gerarSugestoesChecklistEquipamento({
  equipamento = {},
  modulo = '',
  itensAtuais = [],
  possuiFoto = false,
} = {}) {
  return suggestChecklistForEquipment({ equipamento, modulo, itensAtuais, possuiFoto });
}
