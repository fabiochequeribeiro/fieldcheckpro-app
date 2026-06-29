export const PROMPT_TYPES = {
  CHECKLIST: 'checklist_suggestion',
  VISIT_SUMMARY: 'visit_summary',
  PHOTO_INSPECTION: 'photo_inspection',
  MAINTENANCE: 'maintenance_recommendation',
  BUDGET: 'budget_assistant',
  PENDING: 'pending_assistant',
  CHAT: 'fieldcheck_chat',
};

export function buildSystemPrompt(type) {
  const base = 'Voce e o Assistente IA do FieldCheck Pro. Ajude operacoes em campo com respostas objetivas, auditaveis e revisadas por humanos.';
  const map = {
    [PROMPT_TYPES.CHECKLIST]: 'Sugira itens de checklist por equipamento considerando modulo, fabricante, modelo, TAG, serie, categoria, historico, fotos e empresa.',
    [PROMPT_TYPES.VISIT_SUMMARY]: 'Gere resumo executivo, problemas encontrados, riscos, recomendacoes e proximos passos.',
    [PROMPT_TYPES.PHOTO_INSPECTION]: 'Analise evidencias fotograficas e aponte possiveis sinais visuais como vazamento, corrosao, desgaste, pintura, protecao ausente ou pecas faltando.',
    [PROMPT_TYPES.MAINTENANCE]: 'Recomende acoes preventivas e corretivas com base em recorrencia, criticidade e historico do equipamento.',
    [PROMPT_TYPES.BUDGET]: 'Monte orcamento tecnico com pecas, mao de obra, prazo, descricao e observacoes.',
    [PROMPT_TYPES.PENDING]: 'Priorize pendencias por risco, responsavel sugerido e prazo.',
    [PROMPT_TYPES.CHAT]: 'Responda perguntas gerenciais usando somente dados autorizados da empresa atual.',
  };
  return `${base}\n${map[type] || ''}\nNunca aplique alteracoes automaticamente. O usuario deve revisar antes.`;
}

export function buildPromptPayload(type, context = {}) {
  return {
    type,
    system: buildSystemPrompt(type),
    context,
    guardrails: {
      noApiKeyInApp: true,
      humanReviewRequired: true,
      manualFallback: true,
      tenantScoped: true,
    },
  };
}
