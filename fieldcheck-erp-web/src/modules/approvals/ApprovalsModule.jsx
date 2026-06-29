import { CheckCircle2, ClipboardCheck, Wrench } from 'lucide-react';
import { STATUS_LABELS, formatDate, normalizeStatus } from '../../shared/status';

export default function ApprovalsModule({ visits, onSelect, onApprove, onReopen, actionVisitId }) {
  const visibleVisits = visits.filter((visit) => ['enviado', 'finalizado', 'aprovado'].includes(normalizeStatus(visit.status)));

  return (
    <section className="content">
      <div className="section-header">
        <div>
          <h2>Aprovações</h2>
          <p>Após o envio, o técnico não poderá modificar o serviço sem reabertura.</p>
        </div>
      </div>

      <div className="approval-list">
        {visibleVisits.map((visit) => {
          const isBusy = String(actionVisitId || '') === String(visit.id || '');
          const status = normalizeStatus(visit.status);

          return (
            <article key={visit.id}>
              <div>
                <span className={`status ${status}`}>{STATUS_LABELS[status] || visit.status}</span>
                <h3>{visit.numero_pedido || visit.numero_os}</h3>
                <p>{visit.cliente} · {visit.tecnico} · {formatDate(visit.created_at)}</p>
                <small>{visit.total_ok || 0} OK · {visit.total_nao || 0} não conformes · {visit.total_pendentes || 0} pendentes</small>
              </div>

              <div className="row-actions">
                <button className="secondary-button" type="button" disabled={isBusy} onClick={() => onSelect(visit)}>
                  <ClipboardCheck size={17} /> Ver relatório
                </button>

                {status !== 'aprovado' ? (
                  <button className="primary-button" type="button" disabled={isBusy} onClick={() => onApprove(visit)}>
                    <CheckCircle2 size={17} /> {isBusy ? 'Aprovando...' : 'Aprovar'}
                  </button>
                ) : null}

                <button className="secondary-button" type="button" disabled={isBusy} onClick={() => onReopen(visit)}>
                  <Wrench size={17} /> Reabrir
                </button>
              </div>
            </article>
          );
        })}

        {!visibleVisits.length ? <div className="empty-chart">Nenhuma visita aguardando aprovação.</div> : null}
      </div>
    </section>
  );
}
