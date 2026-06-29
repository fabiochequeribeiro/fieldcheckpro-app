import { callFieldCheckAI } from './AIService';
import { PROMPT_TYPES } from './PromptService';

export async function buildBudgetDraft(context = {}) {
  return callFieldCheckAI(PROMPT_TYPES.BUDGET, context, () => ({
    source: 'mock_local',
    descricao: 'Rascunho de orçamento preparado para revisão comercial.',
    pecas: [],
    maoDeObra: 'A definir',
    prazo: 'A definir',
    observacoes: 'Validar escopo, impostos e condições antes de enviar.',
  }));
}
