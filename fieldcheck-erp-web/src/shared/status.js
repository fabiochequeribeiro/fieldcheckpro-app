export const STATUS_LABELS = {
  rascunho: 'Rascunho',
  atribuido: 'Atribuído',
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  'em andamento': 'Em andamento',
  enviado: 'Aguardando aprovação',
  finalizado: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  reaberto: 'Reaberto',
  cancelado: 'Cancelado',
};

export function normalizeStatus(status) {
  return String(status || 'pendente').trim().toLowerCase();
}

export function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR');
}

