import { callFieldCheckAI } from './AIService';
import { PROMPT_TYPES } from './PromptService';

export function buildManagerAiInsights({ companies = [], orders = [], visits = [], technicians = [], occurrences = [] } = {}) {
  const clients = new Set(orders.map((item) => item.cliente).filter(Boolean));
  return [
    { label: 'Equipamentos críticos', value: visits.reduce((sum, item) => sum + Number(item.total_nao || 0), 0), tone: 'red' },
    { label: 'Técnicos produtivos', value: technicians.filter((item) => item.ativo).length, tone: 'green' },
    { label: 'Visitas atrasadas', value: orders.filter((item) => ['pendente', 'reaberto'].includes(String(item.status || '').toLowerCase())).length, tone: 'amber' },
    { label: 'Clientes com chamados', value: clients.size, tone: 'blue' },
    { label: 'Módulos utilizados', value: 10, tone: 'purple' },
    { label: 'Riscos encontrados', value: occurrences.length, tone: 'red' },
    { label: 'Empresas online', value: companies.length || 1, tone: 'green' },
    { label: 'Uso da IA hoje', value: 0, tone: 'purple' },
  ];
}

export async function answerHubQuestion(question, context = {}) {
  return callFieldCheckAI(PROMPT_TYPES.CHAT, { question, context }, () => ({
    answer: `Resposta mockada: "${question}". Conecte este fluxo a uma Edge Function para consultar dados por empresa_id.`,
  }));
}
