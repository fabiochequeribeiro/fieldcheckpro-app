import { Plus, Search } from 'lucide-react';
import { STATUS_LABELS, normalizeStatus } from '../../shared/status';

export default function OrdersModule({ orders, search, onSearch, technicians, onNew, onOpen }) {
  return (
    <section className="content">
      <div className="section-header"><div><h2>Ordens de serviço</h2><p>Cadastre a demanda, os equipamentos e o técnico responsável.</p></div><button className="primary-button" onClick={onNew}><Plus size={18} /> Nova ordem</button></div>
      <div className="toolbar"><Search size={18} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar pedido, cliente, cidade ou status" /></div>
      <div className="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Cidade</th><th>Técnico</th><th>Status</th><th></th></tr></thead><tbody>
        {orders.map((order) => <tr key={order.id}><td><strong>{order.numero_pedido}</strong></td><td>{order.cliente}</td><td>{order.cidade || '-'}</td><td>{technicians.find((item) => item.id === order.tecnico_id)?.nome || 'Não atribuído'}</td><td><span className={`status ${normalizeStatus(order.status).replace(' ', '_')}`}>{STATUS_LABELS[normalizeStatus(order.status)] || order.status}</span></td><td><button className="text-button" onClick={() => onOpen(order)}>Editar</button></td></tr>)}
      </tbody></table></div>
    </section>
  );
}

