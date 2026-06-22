import { CheckCircle2, ClipboardCheck, Wrench } from 'lucide-react';
import { STATUS_LABELS, formatDate, normalizeStatus } from '../../shared/status';

export default function ApprovalsModule({ visits, onSelect, onApprove, onReopen }) {
  const visibleVisits = visits.filter((visit) => ['enviado', 'finalizado', 'aprovado'].includes(normalizeStatus(visit.status)));
  return (
    <section className="content">
      <div className="section-header"><div><h2>Aprovações</h2><p>Após o envio, o técnico não poderá modificar o serviço sem reabertura.</p></div></div>
      <div className="approval-list">{visibleVisits.map((visit) => <article key={visit.id}><div><span className={`status ${normalizeStatus(visit.status)}`}>{STATUS_LABELS[normalizeStatus(visit.status)] || visit.status}</span><h3>{visit.numero_pedido || visit.numero_os}</h3><p>{visit.cliente} · {visit.tecnico} · {formatDate(visit.created_at)}</p><small>{visit.total_ok || 0} OK · {visit.total_nao || 0} não conformes · {visit.total_pendentes || 0} pendentes</small></div><div className="row-actions"><button className="secondary-button" onClick={() => onSelect(visit)}><ClipboardCheck size={17} /> Ver relatório</button>{normalizeStatus(visit.status) !== 'aprovado' ? <button className="primary-button" onClick={() => onApprove(visit)}><CheckCircle2 size={17} /> Aprovar</button> : null}<button className="secondary-button" onClick={() => onReopen(visit)}><Wrench size={17} /> Reabrir</button></div></article>)}</div>
    </section>
  );
}

