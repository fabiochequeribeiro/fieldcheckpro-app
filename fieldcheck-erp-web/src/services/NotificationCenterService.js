export function buildHubNotifications({ pendingApprovals = [], orders = [], visits = [] } = {}) {
  return [
    { type: 'approval', title: 'Aprovações pendentes', value: pendingApprovals.length, severity: pendingApprovals.length ? 'warning' : 'ok' },
    { type: 'orders', title: 'Ordens abertas', value: orders.filter((item) => !['aprovado', 'cancelado'].includes(String(item.status || '').toLowerCase())).length, severity: 'info' },
    { type: 'sync', title: 'Visitas sincronizadas', value: visits.length, severity: 'ok' },
    { type: 'ai', title: 'Recomendações IA', value: 0, severity: 'info' },
  ];
}
