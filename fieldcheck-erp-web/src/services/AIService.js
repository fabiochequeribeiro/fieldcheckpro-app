import { buildPromptPayload } from './PromptService';

const AI_BACKEND_ENDPOINT = null;

export async function callFieldCheckAI(type, context = {}, fallback) {
  const payload = buildPromptPayload(type, context);
  if (!AI_BACKEND_ENDPOINT) return typeof fallback === 'function' ? fallback(payload) : fallback;

  const response = await fetch(AI_BACKEND_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha na IA do FieldCheck Hub.');
  return response.json();
}

export function getAIServiceStatus() {
  return {
    mode: AI_BACKEND_ENDPOINT ? 'backend' : 'mock_local',
    apiKeyInPortal: false,
    recommendedBackend: 'Supabase Edge Function',
    humanReviewRequired: true,
  };
}
