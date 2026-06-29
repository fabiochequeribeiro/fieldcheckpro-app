import {
  buildChecklistSuggestionPayload,
  buildVisitSummaryPayload,
  generateChecklistSuggestions,
  generateFallbackChecklistSuggestions,
  generateFallbackSummary,
  generateVisitSummary,
} from './visitSummaryService';

export const FIELD_CHECK_AI_CAPABILITIES = [
  {
    id: 'checklist',
    title: 'Sugestao de checklist',
    description: 'Pergunta se existe foto do equipamento e sugere itens para revisao manual.',
    icon: 'list-circle',
  },
  {
    id: 'summary',
    title: 'Resumo inteligente',
    description: 'Gera resumo tecnico, executivo, pendencias e texto para relatorio.',
    icon: 'document-text',
  },
  {
    id: 'pending',
    title: 'Assistente de pendencias',
    description: 'Classifica criticidade, recomenda acao, responsavel e prazo sugerido.',
    icon: 'warning',
  },
  {
    id: 'copilot',
    title: 'Copiloto tecnico',
    description: 'Estrutura para perguntar a IA, explicar itens e sugerir proximos passos.',
    icon: 'chatbubbles',
  },
];

export function buildAiReadiness() {
  return {
    mode: 'mock_local',
    safeForProduction: true,
    manualFallback: true,
    requiresBackend: 'Supabase Edge Function ou API propria para IA real',
    storesApiKeyInApp: false,
  };
}

export async function suggestChecklistForEquipment({ equipamento = {}, modulo = '', itensAtuais = [], possuiFoto = false } = {}) {
  const payload = buildChecklistSuggestionPayload({ equipamento, modulo, itensAtuais, possuiFoto });
  try {
    return await generateChecklistSuggestions(payload);
  } catch (_error) {
    return generateFallbackChecklistSuggestions(payload);
  }
}

export async function generateIntelligentVisitSummary(visita = {}) {
  const payload = buildVisitSummaryPayload(visita);
  try {
    const resumo = await generateVisitSummary(payload);
    return normalizeSummaryOutput(resumo, payload);
  } catch (_error) {
    return normalizeSummaryOutput(generateFallbackSummary(payload), payload);
  }
}

export function suggestPendingActions(visita = {}) {
  const payload = buildVisitSummaryPayload(visita);
  const pendencias = [...(payload.naoConformidades || []), ...(payload.pendencias || [])].slice(0, 8);
  if (!pendencias.length) {
    return [{
      item: 'Sem pendencias criticas detectadas',
      gravidade: 'baixa',
      recomendacao: 'Manter acompanhamento preventivo e registrar evidencias quando houver alteracao.',
      responsavel: 'Supervisor',
      prazo: 'Proxima visita',
    }];
  }

  return pendencias.map((item, index) => ({
    item,
    gravidade: index < 2 ? 'alta' : 'media',
    recomendacao: `Avaliar "${item}", registrar evidencia e definir acao corretiva antes do fechamento definitivo.`,
    responsavel: index < 2 ? 'Supervisor' : 'Tecnico responsavel',
    prazo: index < 2 ? '24 horas' : '7 dias',
  }));
}

export function answerTechnicalCopilot(question = '') {
  const text = String(question || '').trim();
  if (!text) {
    return 'Descreva o item, equipamento ou pendencia. O copiloto vai sugerir proximos passos, mas a decisao final continua com o tecnico.';
  }
  return `Sugestao assistida: revise o contexto de "${text}", registre evidencia, classifique OK/Nao OK/N/A e descreva a acao recomendada. Em caso de risco operacional, sinalize ao supervisor antes de finalizar.`;
}

function normalizeSummaryOutput(resumo, payload) {
  const texto = String(resumo || '').trim();
  return {
    resumoTecnico: texto,
    resumoExecutivo: texto.length > 220 ? `${texto.slice(0, 220)}...` : texto,
    pendencias: payload.pendencias || [],
    naoConformidades: payload.naoConformidades || [],
    acoesRecomendadas: suggestPendingActions({ equipamentos: [] }).map((item) => item.recomendacao).slice(0, 3),
    textoWhatsApp: `Resumo FieldCheck: ${texto.slice(0, 500)}`,
    textoEmail: `Segue resumo inteligente da visita:\n\n${texto}`,
    conclusaoPdf: texto,
    origem: 'ia_mock_local',
  };
}
