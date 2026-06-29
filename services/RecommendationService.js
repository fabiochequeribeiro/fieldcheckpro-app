import { callFieldCheckAI } from './AIService';
import { PROMPT_TYPES } from './PromptService';
import { suggestPendingActions } from './fieldCheckAiService';

export async function recommendMaintenanceActions({ equipamento = {}, historico = [], visitas = [] } = {}) {
  return callFieldCheckAI(PROMPT_TYPES.MAINTENANCE, { equipamento, historico, visitas }, () => {
    const corretivas = historico.filter((item) => String(item.modulo || item.tipo || '').toLowerCase().includes('corretiva')).length;
    const criticidade = corretivas >= 3 ? 'alta' : corretivas >= 1 ? 'media' : 'baixa';
    return [{
      titulo: corretivas >= 3 ? 'Criar plano preventivo' : 'Manter monitoramento preventivo',
      criticidade,
      motivo: corretivas >= 3
        ? 'Equipamento possui muitas corretivas no historico.'
        : 'Nao ha recorrencia critica suficiente para recomendar intervencao pesada.',
      acao: 'Revisar periodicidade, itens obrigatorios, fotos antes/depois e responsavel tecnico.',
    }];
  });
}

export async function recommendPendingActions(visita = {}) {
  return callFieldCheckAI(PROMPT_TYPES.PENDING, visita, () => suggestPendingActions(visita));
}

export async function answerManagerQuestion(question = '', context = {}) {
  return callFieldCheckAI(PROMPT_TYPES.CHAT, { question, context }, () => ({
    answer: `Resposta mockada: para responder "${question}", conecte o Chat IA a uma Edge Function com consultas filtradas por empresa_id.`,
    source: 'mock_local',
  }));
}
