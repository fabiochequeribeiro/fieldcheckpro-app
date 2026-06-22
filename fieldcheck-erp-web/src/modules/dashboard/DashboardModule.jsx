import { CheckCircle2, ClipboardList, PackageCheck, Users } from 'lucide-react';
import { STATUS_LABELS, normalizeStatus } from '../../shared/status';

export default function DashboardModule({ activeOrders, orders, pendingApprovals, technicians, onOpenOrder }) {
  return (
    <section className="content">
      <div className="metrics">
        <article><ClipboardList /><div><strong>{activeOrders.length}</strong><span>Ordens abertas</span></div></article>
        <article><PackageCheck /><div><strong>{orders.filter((item) => item.tecnico_id).length}</strong><span>Ordens atribuídas</span></div></article>
        <article><CheckCircle2 /><div><strong>{pendingApprovals.length}</strong><span>Aguardando aprovação</span></div></article>
        <article><Users /><div><strong>{technicians.filter((item) => item.ativo).length}</strong><span>Usuários ativos</span></div></article>
      </div>
      <div className="section-header"><div><h2>Prioridades</h2><p>Serviços que exigem uma ação administrativa.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Técnico</th><th>Status</th><th>Ação</th></tr></thead><tbody>
        {activeOrders.slice(0, 8).map((order) => <tr key={order.id}><td>{order.numero_pedido}</td><td>{order.cliente}</td><td>{technicians.find((item) => item.id === order.tecnico_id)?.nome || 'Não atribuído'}</td><td><span className={`status ${normalizeStatus(order.status).replace(' ', '_')}`}>{STATUS_LABELS[normalizeStatus(order.status)] || order.status}</span></td><td><button className="text-button" onClick={() => onOpenOrder(order)}>Abrir</button></td></tr>)}
      </tbody></table></div>
    </section>
  );
}

