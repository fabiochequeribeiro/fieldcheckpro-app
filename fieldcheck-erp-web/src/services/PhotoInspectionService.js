import { callFieldCheckAI } from './AIService';
import { PROMPT_TYPES } from './PromptService';

export async function inspectPhotoEvidence({ photo, equipment, module, checklist } = {}) {
  return callFieldCheckAI(PROMPT_TYPES.PHOTO_INSPECTION, { photo, equipment, module, checklist }, () => ({
    source: 'mock_local',
    findings: ['vazamento', 'ausencia de protecao', 'corrosao', 'desgaste', 'pintura', 'pecas faltando'].map((item) => ({
      label: item,
      detected: false,
      confidence: 'baixa',
    })),
  }));
}
