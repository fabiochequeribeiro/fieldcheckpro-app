import { ClipboardList, MapPin, TrendingUp, Users } from 'lucide-react';
import { HubPanel, HubStatCard } from '../../components/hub/HubComponents';
import { normalizeStatus } from '../../shared/status';

function clientRows(orders, visits, occurrences) {
  const map = new Map();
  const row = (name) => {
    const key = String(name || 'Sem cliente').trim() || 'Sem cliente';
    if (!map.has(key)) map.set(key, { cliente: key, ordens: 0, abertas: 0, visitas: 0, pendencias: 0, nao: 0, cidade: '' });
    return map.get(key);
  };
  orders.forEach((order) => {
    const item = row(order.cliente);
    item.ordens += 1;
    item.cidade ||= [order.cidade, order.estado].filter(Boolean).join('/');
    if (!['aprovado', 'cancelado'].includes(normalizeStatus(order.status))) item.abertas += 1;
  });
  visits.forEach((visit) => {
    const item = row(visit.cliente);
    item.visitas += 1;
    item.pendencias += Number(visit.total_pendentes || 0);
    item.nao += Number(visit.total_nao || 0);
  });
  occurrences.forEach((occurrence) => {
    row(occurrence.cliente || occurrence.nome_cliente || occurrence.obra).pendencias += 1;
  });
  return [...map.values()].sort((a, b) => (b.abertas + b.nao + b.pendencias) - (a.abertas + a.nao + a.pendencias));
}

export default function ClientsModule({ orders = [], visits = [], occurrences = [] }) {
  const rows = clientRows(orders, visits, occurrences);
  return (
    <section className="content hub-page">
      <div className="section-header"><div><span className="eyebrow">Relacionamento operacional</span><h2>Clientes</h2><p>Historico, equipamentos, ordens, pendencias e indicadores por cliente.</p></div></div>
      <div className="hub-stat-grid">
        <HubStatCard icon={Users} label="Clientes" value={rows.length} detail="Base consolidada por nome" />
        <HubStatCard icon={ClipboardList} label="Ordens abertas" value={rows.reduce((sum, item) => sum + item.abertas, 0)} detail="Demandas em andamento" tone="amber" />
        <HubStatCard icon={TrendingUp} label="Nao conformidades" value={rows.reduce((sum, item) => sum + item.nao, 0)} detail="Soma em visitas" tone="red" />
        <HubStatCard icon={MapPin} label="Com visitas" value={rows.filter((item) => item.visitas).length} detail="Clientes com historico em campo" tone="green" />
      </div>
      <HubPanel title="Carteira de clientes" subtitle="Priorizacao por risco operacional." icon={Users}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Cidade</th><th>Ordens</th><th>Visitas</th><th>Pendencias</th><th>NC</th></tr></thead>
            <tbody>
              {rows.map((item) => <tr key={item.cliente}><td>{item.cliente}</td><td>{item.cidade || 'Nao informado'}</td><td>{item.ordens}</td><td>{item.visitas}</td><td>{item.pendencias}</td><td>{item.nao}</td></tr>)}
              {!rows.length ? <tr><td colSpan="6">Nenhum cliente encontrado.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </HubPanel>
    </section>
  );
}
