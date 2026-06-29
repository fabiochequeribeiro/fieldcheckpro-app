import { callFieldCheckAI } from './AIService';
import { PROMPT_TYPES } from './PromptService';

export async function inspectEquipmentPhoto({ foto = null, equipamento = {}, modulo = '', checklist = [] } = {}) {
  return callFieldCheckAI(PROMPT_TYPES.PHOTO_INSPECTION, { foto, equipamento, modulo, checklist }, () => ({
    source: 'mock_local',
    findings: [
      { label: 'Possivel vazamento', detected: false, confidence: 'baixa' },
      { label: 'Ausencia de protecao', detected: false, confidence: 'baixa' },
      { label: 'Corrosao', detected: false, confidence: 'baixa' },
      { label: 'Desgaste', detected: false, confidence: 'baixa' },
      { label: 'Pintura danificada', detected: false, confidence: 'baixa' },
      { label: 'Pecas faltando', detected: false, confidence: 'baixa' },
    ],
    recommendation: 'Analisar visualmente a foto, registrar observacao e manter fluxo manual ate a IA visual real estar configurada.',
  }));
}
