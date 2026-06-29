export const PROMPT_TYPES = {
  CHECKLIST: 'checklist_suggestion',
  VISIT_SUMMARY: 'visit_summary',
  PHOTO_INSPECTION: 'photo_inspection',
  MAINTENANCE: 'maintenance_recommendation',
  BUDGET: 'budget_assistant',
  PENDING: 'pending_assistant',
  CHAT: 'fieldcheck_chat',
};

export function buildPromptPayload(type, context = {}) {
  return {
    type,
    context,
    system: 'Assistente IA do FieldCheck Hub. Use apenas dados autorizados do tenant e exija revisao humana antes de aplicar sugestoes.',
    guardrails: {
      noApiKeyInFrontend: true,
      futureBackend: 'Supabase Edge Function ou API propria',
      tenantScoped: true,
      humanReviewRequired: true,
    },
  };
}
