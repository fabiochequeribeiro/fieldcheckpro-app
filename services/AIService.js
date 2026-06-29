import { buildPromptPayload } from './PromptService';

const AI_BACKEND_ENDPOINT = null;

export async function callFieldCheckAI(type, context = {}, fallback) {
  const payload = buildPromptPayload(type, context);

  if (!AI_BACKEND_ENDPOINT) {
    return typeof fallback === 'function' ? fallback(payload) : fallback;
  }

  const response = await fetch(AI_BACKEND_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (typeof fallback === 'function') return fallback(payload);
    throw new Error('Falha ao chamar IA do FieldCheck.');
  }

  return response.json();
}

export function getAIBackendReadiness() {
  return {
    endpointConfigured: Boolean(AI_BACKEND_ENDPOINT),
    recommendedBackend: 'Supabase Edge Function ou API propria',
    apiKeyInApp: false,
    mode: AI_BACKEND_ENDPOINT ? 'backend' : 'mock_local',
  };
}
