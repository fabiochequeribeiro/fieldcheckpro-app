import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { formatDate, normalizeStatus, STATUS_LABELS } from '../../shared/status';

export function HubStatCard({ icon: Icon, label, value, tone = 'blue', detail }) {
  return (
    <article className={`hub-stat-card ${tone}`}>
      <div className="hub-stat-icon">{Icon ? <Icon size={20} /> : null}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {detail ? <small>{detail}</small> : null}
      </div>
    </article>
  );
}

export function HubPanel({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <article className={`hub-panel ${className}`}>
      <header className="hub-panel-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {Icon ? <Icon size={21} /> : null}
      </header>
      {children}
    </article>
  );
}

export function HubEmptyState({ title = 'Nada para exibir', description = 'Os dados aparecerao aqui assim que houver movimentacao.' }) {
  return (
    <div className="hub-empty-state">
      <CheckCircle2 size={22} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

export function HubLoadingState({ label = 'Carregando dados...' }) {
  return <div className="hub-loading-state"><Loader2 className="spin" size={18} /> {label}</div>;
}

export function HubStatusBadge({ status }) {
  const key = normalizeStatus(status);
  return <span className={`status ${key.replace(' ', '_')}`}>{STATUS_LABELS[key] || status || 'Pendente'}</span>;
}

export function HubTimeline({ events = [] }) {
  if (!events.length) return <HubEmptyState title="Sem eventos recentes" description="A timeline sera alimentada por visitas, PDFs, assinaturas, IA e sincronizacoes." />;
  return (
    <div className="hub-timeline">
      {events.map((event, index) => (
        <div className="hub-timeline-row" key={`${event.time}-${event.title}-${index}`}>
          <time className="hub-timeline-time">{event.time}</time>
          <span className="hub-timeline-dot" />
          <div className="hub-timeline-body">
            <strong>{event.title}</strong>
            <span>{event.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function buildOperationalTimeline({ visits = [], orders = [], technicians = [] }) {
  const rows = [];
  visits.slice(0, 8).forEach((visit) => {
    const date = new Date(visit.enviado_em || visit.finalizado_em || visit.created_at);
    const time = Number.isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    rows.push({
      time,
      title: visit.resumo_inteligente ? 'IA gerou resumo de visita' : 'Visita enviada para o portal',
      description: `${visit.cliente || 'Cliente'} - ${visit.tecnico || 'Tecnico'} - ${formatDate(visit.created_at)}`,
      date: date.getTime() || 0,
    });
  });
  orders.slice(0, 6).forEach((order) => {
    const date = new Date(order.created_at);
    const tech = technicians.find((item) => Number(item.id) === Number(order.tecnico_id));
    rows.push({
      time: Number.isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: 'Ordem criada ou atualizada',
      description: `${order.numero_pedido || 'OS'} - ${order.cliente || 'Cliente'} - ${tech?.nome || 'sem tecnico'}`,
      date: date.getTime() || 0,
    });
  });
  return rows.sort((a, b) => b.date - a.date).slice(0, 10);
}

export function buildAlerts({ visits = [], orders = [], occurrences = [] }) {
  const totalPendencias = visits.reduce((sum, visit) => sum + Number(visit.total_pendentes || 0), 0);
  const totalNc = visits.reduce((sum, visit) => sum + Number(visit.total_nao || 0), 0);
  const abertas = orders.filter((order) => !['aprovado', 'cancelado'].includes(normalizeStatus(order.status))).length;
  return [
    { icon: AlertTriangle, tone: 'amber', title: 'Pendencias abertas', value: totalPendencias, description: `${totalPendencias} itens aguardando acao ou revisao.` },
    { icon: AlertTriangle, tone: 'red', title: 'Nao conformidades', value: totalNc, description: `${totalNc} pontos criticos nos checklists enviados.` },
    { icon: Clock3, tone: 'blue', title: 'Servicos em andamento', value: abertas, description: `${abertas} ordens ainda nao encerradas.` },
    { icon: AlertTriangle, tone: 'purple', title: 'Ocorrencias', value: occurrences.length, description: `${occurrences.length} registros operacionais recebidos.` },
  ];
}
