import { AlertTriangle, Bot, Building2, MapPinned, RadioTower, Sparkles, TimerReset } from 'lucide-react';
import { HubPanel, HubStatCard, HubTimeline, buildAlerts, buildOperationalTimeline } from '../../components/hub/HubComponents';
import { normalizeStatus } from '../../shared/status';
import { buildHubNotifications } from '../../services/NotificationCenterService';

export default function CommandCenterModule({
  orders = [],
  visits = [],
  occurrences = [],
  technicians = [],
  companies = [],
  activeCompanyName = '',
  pendingApprovals = [],
  onOpenOrder,
}) {
  const inProgress = orders.filter((item) => ['atribuido', 'em_andamento', 'em andamento', 'reaberto'].includes(normalizeStatus(item.status)));
  const today = new Date().toISOString().slice(0, 10);
  const visitsToday = visits.filter((visit) => String(visit.created_at || visit.enviado_em || '').slice(0, 10) === today);
  const nonConformities = visits.reduce((sum, visit) => sum + Number(visit.total_nao || 0), 0);
  const alerts = buildAlerts({ visits, orders, occurrences });
  const timeline = buildOperationalTimeline({ visits, orders, technicians });
  const notifications = buildHubNotifications({ pendingApprovals, orders, visits });
  const modulesActive = ['Execucao', 'Ordens', 'Checklists', 'Relatorios', 'Inventario', 'Ocorrencias', 'IA', 'Empresas'];

  return (
    <section className="content hub-page command-center-page">
      <div className="hub-hero">
        <div>
          <span className="eyebrow">FieldCheck Hub Enterprise</span>
          <h2>Centro Inteligente de Operacoes</h2>
          <p>Visao executiva de campo, pendencias, atividades criticas, aprovacoes e uso de IA em um unico painel.</p>
        </div>
        <div className="hub-hero-signal" aria-hidden="true">
          <RadioTower size={30} />
          <span>Operacao ao vivo</span>
        </div>
      </div>

      <div className="hub-stat-grid">
        <HubStatCard icon={Building2} label="Empresa ativa" value={activeCompanyName || companies.length || 'Todas'} detail="Escopo operacional atual" tone="navy" />
        <HubStatCard icon={MapPinned} label="Visitas hoje" value={visitsToday.length} detail="Registros movimentados no dia" tone="blue" />
        <HubStatCard icon={TimerReset} label="Servicos em andamento" value={inProgress.length} detail="Ordens abertas ou reabertas" tone="amber" />
        <HubStatCard icon={AlertTriangle} label="Nao conformidades" value={nonConformities} detail={`${pendingApprovals.length} aguardando aprovacao`} tone="red" />
        <HubStatCard icon={Bot} label="IA utilizada hoje" value={0} detail="Estrutura pronta para telemetria" tone="purple" />
        <HubStatCard icon={RadioTower} label="Status do sistema" value="OK" detail="Banco e portal operacionais" tone="green" />
        <HubStatCard icon={Building2} label="Empresas online" value={companies.length || 1} detail="Mock pronto para presence" tone="blue" />
        <HubStatCard icon={Sparkles} label="Modulos ativos" value={modulesActive.length} detail="Controlados por plano" tone="purple" />
        <HubStatCard icon={TimerReset} label="Licencas" value="Enterprise" detail="Plano contratado" tone="navy" />
      </div>

      <div className="command-grid">
        <HubPanel title="Mapa operacional" subtitle="Estrutura de operacao por empresas, equipes, pedidos e visitas." icon={MapPinned} className="operations-map-panel">
          <div className="operations-map">
            <div><strong>{companies.length || 1}</strong><span>Empresas</span></div>
            <i />
            <div><strong>{technicians.length}</strong><span>Tecnicos</span></div>
            <i />
            <div><strong>{orders.length}</strong><span>Ordens</span></div>
            <i />
            <div><strong>{visits.length}</strong><span>Visitas</span></div>
          </div>
          <div className="hub-note"><Sparkles size={16} /> IA como camada assistiva: quando indisponivel, a operacao manual continua funcionando.</div>
        </HubPanel>

        <HubPanel title="Timeline" subtitle="Eventos recentes do campo e do portal." icon={TimerReset}>
          <HubTimeline events={timeline} />
        </HubPanel>

        <HubPanel title="Alertas" subtitle="Pontos que merecem decisao do gestor." icon={AlertTriangle}>
          <div className="hub-alert-list">
            {alerts.map((alert) => (
              <article key={alert.id} className={`hub-alert ${alert.tone}`}>
                <strong>{alert.title}</strong>
                <span>{alert.description}</span>
              </article>
            ))}
            {!alerts.length ? <article className="hub-alert success"><strong>Sem alertas criticos</strong><span>Operacao sem bloqueios aparentes.</span></article> : null}
          </div>
        </HubPanel>

        <HubPanel title="Servicos criticos" subtitle="Ordens abertas, reabertas ou aguardando acao." icon={AlertTriangle}>
          <div className="critical-list">
            {inProgress.slice(0, 7).map((order) => (
              <button key={order.id} type="button" onClick={() => onOpenOrder?.(order)}>
                <strong>{order.numero_pedido || 'Sem numero'}</strong>
                <span>{order.cliente || 'Sem cliente'} - {order.status || 'pendente'}</span>
              </button>
            ))}
            {!inProgress.length ? <div className="hub-empty-inline">Nenhum servico critico no momento.</div> : null}
          </div>
        </HubPanel>

        <HubPanel title="Saude do banco" subtitle="Indicadores tecnicos preparados para observabilidade." icon={RadioTower}>
          <div className="hub-alert-list">
            <article className="hub-alert success"><strong>Conexao Supabase</strong><span>Operacional no ultimo carregamento.</span></article>
            <article className="hub-alert success"><strong>RLS e tenant</strong><span>Consultas continuam passando pelos filtros atuais.</span></article>
            <article className="hub-alert amber"><strong>Ultimos logins</strong><span>Estrutura pronta para auditoria de sessoes e acessos.</span></article>
          </div>
        </HubPanel>

        <HubPanel title="Notification Center" subtitle="Push, email, WhatsApp, alertas e eventos." icon={Sparkles}>
          <div className="hub-alert-list">
            {notifications.map((item) => (
              <article key={item.type} className={`hub-alert ${item.severity === 'warning' ? 'amber' : 'success'}`}>
                <strong>{item.title}: {item.value}</strong>
                <span>Evento modular preparado para canais futuros.</span>
              </article>
            ))}
          </div>
        </HubPanel>
      </div>
    </section>
  );
}
