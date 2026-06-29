import { Bell, Bot, RefreshCw, Wrench } from 'lucide-react';
import { HubPanel, HubStatCard } from '../../components/hub/HubComponents';
import { normalizeStatus } from '../../shared/status';

export default function NotificationsModule({ orders = [], visits = [], occurrences = [] }) {
  const syncIssues = visits.filter((visit) => normalizeStatus(visit.status) === 'reaberto').length;
  const pending = orders.filter((order) => !['aprovado', 'cancelado'].includes(normalizeStatus(order.status))).length;
  const items = [
    { icon: RefreshCw, title: 'Sincronizacao', text: syncIssues ? `${syncIssues} servico(s) reaberto(s) precisam acompanhamento.` : 'Sem erro de sincronizacao identificado.' },
    { icon: Wrench, title: 'Servicos', text: `${pending} ordem(ns) abertas ou em andamento.` },
    { icon: Bot, title: 'IA', text: 'Monitoramento de uso e falhas preparado para integracao futura.' },
    { icon: Bell, title: 'Ocorrencias', text: `${occurrences.length} ocorrencia(s) registradas.` },
  ];
  return (
    <section className="content hub-page">
      <div className="section-header"><div><span className="eyebrow">Central operacional</span><h2>Notificacoes</h2><p>Pendencias, sincronizacao, IA, servicos e alertas de gestao.</p></div></div>
      <div className="hub-stat-grid">
        <HubStatCard icon={Bell} label="Notificacoes" value={items.length} detail="Categorias ativas" />
        <HubStatCard icon={RefreshCw} label="Sincronizacao" value={syncIssues} detail="Pontos para revisar" tone="amber" />
        <HubStatCard icon={Wrench} label="Servicos pendentes" value={pending} detail="Ordens nao encerradas" tone="red" />
        <HubStatCard icon={Bot} label="IA" value="Pronta" detail="Alertas de consumo futuros" tone="purple" />
      </div>
      <HubPanel title="Inbox do Hub" subtitle="Eventos importantes para supervisao." icon={Bell}>
        <div className="notification-hub-list">
          {items.map(({ icon: Icon, title, text }) => (
            <article key={title}><Icon size={20} /><div><strong>{title}</strong><span>{text}</span></div></article>
          ))}
        </div>
      </HubPanel>
    </section>
  );
}
