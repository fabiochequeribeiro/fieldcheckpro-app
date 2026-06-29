import { callFieldCheckAI } from './AIService';
import { PROMPT_TYPES } from './PromptService';

export async function generateBudgetDraft({ cliente = '', equipamento = {}, pendencias = [], pecas = [], maoDeObraHoras = 0 } = {}) {
  return callFieldCheckAI(PROMPT_TYPES.BUDGET, { cliente, equipamento, pendencias, pecas, maoDeObraHoras }, () => ({
    source: 'mock_local',
    cliente,
    equipamento: equipamento.nome || equipamento.tag || 'Equipamento',
    descricaoTecnica: 'Orcamento preliminar gerado pelo assistente. Revisar escopo, pecas, impostos e condicoes comerciais antes de enviar.',
    pecas: pecas.length ? pecas : [{ item: 'Peca/material a definir', quantidade: 1, valorEstimado: 0 }],
    maoDeObra: {
      horas: maoDeObraHoras || 1,
      descricao: 'Atendimento tecnico em campo',
    },
    prazo: 'A definir apos validacao do gestor',
    observacoes: pendencias.length ? pendencias.join('; ') : 'Sem pendencias informadas.',
  }));
}
