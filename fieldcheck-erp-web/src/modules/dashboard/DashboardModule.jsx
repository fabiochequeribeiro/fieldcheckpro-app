import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STATUS_LABELS, formatDate, normalizeStatus } from '../../shared/status';

const STATUS_COLORS = {
  rascunho: '#94a3b8',
  atribuido: '#1f7ae0',
  pendente: '#f59e0b',
  em_andamento: '#f59e0b',
  'em andamento': '#f59e0b',
  enviado: '#7c3aed',
  finalizado: '#7c3aed',
  aprovado: '#087f3a',
  reaberto: '#dc2626',
  cancelado: '#64748b',
};

function json(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function dataCurta(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function dataKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return date.toISOString().slice(0, 10);
}

function statusLabel(status) {
  const key = normalizeStatus(status);
  return STATUS_LABELS[key] || status || 'Pendente';
}

function respostaKey(item) {
  const value = String(item?.resposta || '').trim().toUpperCase();
  if (value === 'OK' || item?.ok === true) return 'OK';
  if (['NAO', 'NÃO', 'NOK'].includes(value) || item?.nao === true) return 'Nao conforme';
  if (['NA', 'N/A'].includes(value)) return 'Nao aplicavel';
  return 'Pendente';
}

function extrairItens(visits) {
  const itens = [];
  visits.forEach((visit) => {
    const equipamentos = json(visit.equipamentos, []);
    if (!Array.isArray(equipamentos)) return;
    equipamentos.forEach((equipamento) => {
      const lista = Array.isArray(equipamento?.itens) ? equipamento.itens : [];
      lista.filter((item) => item?.ativo !== false).forEach((item) => {
        itens.push({
          texto: item.texto || item.item || item.nome || 'Item sem descricao',
          resposta: respostaKey(item),
          tag: equipamento.tag || equipamento.tipo || equipamento.nome || '',
          cliente: visit.cliente || 'Sem cliente',
        });
      });
    });
  });
  return itens;
}

function ordenarPorValor(lista, chave = 'total') {
  return [...lista].sort((a, b) => Number(b[chave] || 0) - Number(a[chave] || 0));
}

function agruparPorCliente(orders, visits, occurrences) {
  const mapa = new Map();
  function linha(cliente) {
    const nome = String(cliente || 'Sem cliente').trim() || 'Sem cliente';
    if (!mapa.has(nome)) {
      mapa.set(nome, { cliente: nome, pedidos: 0, abertos: 0, visitas: 0, naoConformes: 0, ocorrencias: 0 });
    }
    return mapa.get(nome);
  }

  orders.forEach((order) => {
    const item = linha(order.cliente);
    item.pedidos += 1;
    if (!['aprovado', 'cancelado'].includes(normalizeStatus(order.status))) item.abertos += 1;
  });

  visits.forEach((visit) => {
    const item = linha(visit.cliente);
    item.visitas += 1;
    item.naoConformes += Number(visit.total_nao || 0);
  });

  occurrences.forEach((occurrence) => {
    const item = linha(occurrence.cliente || occurrence.nome_cliente || occurrence.obra);
    item.ocorrencias += 1;
  });

  return ordenarPorValor([...mapa.values()].slice(0, 12), 'pedidos');
}

function montarSerieVisitas(visits) {
  const mapa = new Map();
  visits.forEach((visit) => {
    const key = dataKey(visit.enviado_em || visit.finalizado_em || visit.created_at);
    if (!mapa.has(key)) mapa.set(key, { data: key, label: key === 'Sem data' ? key : dataCurta(key), visitas: 0, aprovadas: 0 });
    const item = mapa.get(key);
    item.visitas += 1;
    if (normalizeStatus(visit.status) === 'aprovado') item.aprovadas += 1;
  });
  return [...mapa.values()].filter((item) => item.data !== 'Sem data').sort((a, b) => a.data.localeCompare(b.data)).slice(-14);
}

export default function DashboardModule({
  activeOrders,
  orders,
  visits = [],
  occurrences = [],
  pendingApprovals,
  technicians,
  onOpenOrder,
}) {
  const itensChecklist = extrairItens(visits);
  const totalOk = visits.reduce((sum, visit) => sum + Number(visit.total_ok || 0), 0);
  const totalNao = visits.reduce((sum, visit) => sum + Number(visit.total_nao || 0), 0);
  const totalPendentes = visits.reduce((sum, visit) => sum + Number(visit.total_pendentes || 0), 0);
  const pedidosAbertos = activeOrders.length;
  const visitasMes = visits.filter((visit) => {
    const date = new Date(visit.enviado_em || visit.finalizado_em || visit.created_at);
    const now = new Date();
    return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const statusPedidos = ordenarPorValor(Object.values(orders.reduce((map, order) => {
    const key = normalizeStatus(order.status);
    map[key] = map[key] || { name: statusLabel(key), value: 0, key };
    map[key].value += 1;
    return map;
  }, {})), 'value');

  const clientes = agruparPorCliente(orders, visits, occurrences);
  const serieVisitas = montarSerieVisitas(visits);
  const resultadoChecklist = [
    { name: 'OK', value: totalOk, fill: '#087f3a' },
    { name: 'Nao conforme', value: totalNao, fill: '#dc2626' },
    { name: 'Pendentes', value: totalPendentes, fill: '#f59e0b' },
  ];

  const topItens = ordenarPorValor(Object.values(itensChecklist.reduce((map, item) => {
    const key = item.texto;
    map[key] = map[key] || { item: key, total: 0, naoConformes: 0 };
    map[key].total += 1;
    if (item.resposta === 'Nao conforme') map[key].naoConformes += 1;
    return map;
  }, {})), 'total').slice(0, 8);

  const pedidosCriticos = [...activeOrders]
    .sort((a, b) => {
      const aStatus = ['reaberto', 'em_andamento', 'em andamento'].includes(normalizeStatus(a.status)) ? 0 : 1;
      const bStatus = ['reaberto', 'em_andamento', 'em andamento'].includes(normalizeStatus(b.status)) ? 0 : 1;
      return aStatus - bStatus || new Date(b.created_at || 0) - new Date(a.created_at || 0);
    })
    .slice(0, 8);

  return (
    <section className="content dashboard-page">
      <div className="metrics dashboard-metrics">
        <article><ClipboardList /><div><strong>{pedidosAbertos}</strong><span>Pedidos em aberto</span></div></article>
        <article><PackageCheck /><div><strong>{orders.filter((item) => item.tecnico_id).length}</strong><span>Pedidos atribuídos</span></div></article>
        <article><CheckCircle2 /><div><strong>{pendingApprovals.length}</strong><span>Aguardando aprovação</span></div></article>
        <article><AlertTriangle /><div><strong>{totalNao}</strong><span>Itens não conformes</span></div></article>
        <article><TrendingUp /><div><strong>{visitasMes}</strong><span>Visitas no mês</span></div></article>
        <article><Users /><div><strong>{technicians.filter((item) => item.ativo).length}</strong><span>Usuários ativos</span></div></article>
      </div>

      <div className="dashboard-grid">
        <article className="chart-card chart-card-wide">
          <header><div><h3>Pedidos por cliente</h3><p>Volume de pedidos, abertos, visitas, ocorrências e não conformidades por cliente.</p></div><BarChart3 size={20} /></header>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={clientes} margin={{ top: 8, right: 18, left: -12, bottom: 54 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="cliente" angle={-35} textAnchor="end" interval={0} height={72} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="pedidos" name="Pedidos" fill="#1f7ae0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="abertos" name="Abertos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="naoConformes" name="Não conformes" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <header><div><h3>Status dos pedidos</h3><p>Distribuição atual dos pedidos cadastrados.</p></div></header>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusPedidos} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                {statusPedidos.map((entry) => <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#1f7ae0'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend-list">
            {statusPedidos.map((item) => <span key={item.key}><i style={{ background: STATUS_COLORS[item.key] || '#1f7ae0' }} />{item.name}: {item.value}</span>)}
          </div>
        </article>

        <article className="chart-card">
          <header><div><h3>Resultado dos checklists</h3><p>Soma de todos os itens enviados nos relatórios.</p></div></header>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={resultadoChecklist} margin={{ top: 8, right: 14, left: -18, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Itens" radius={[5, 5, 0, 0]}>
                {resultadoChecklist.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card chart-card-wide">
          <header><div><h3>Visitas e aprovações</h3><p>Evolução dos relatórios enviados nos últimos dias com movimentação.</p></div></header>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={serieVisitas} margin={{ top: 8, right: 20, left: -18, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visitas" name="Visitas" stroke="#1f7ae0" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="aprovadas" name="Aprovadas" stroke="#087f3a" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <header><div><h3>Itens mais verificados</h3><p>Itens mais recorrentes nos checklists executados.</p></div></header>
          {topItens.length ? (
            <div className="rank-list">
              {topItens.map((item, index) => (
                <div key={item.item} className="rank-row">
                  <strong>{index + 1}</strong>
                  <div><span>{item.item}</span><small>{item.total} verificações · {item.naoConformes} não conformes</small></div>
                  <b>{item.total}</b>
                </div>
              ))}
            </div>
          ) : <div className="empty-chart">Os itens aparecerão aqui após os primeiros relatórios com checklist detalhado.</div>}
        </article>

        <article className="chart-card">
          <header><div><h3>Clientes com atenção</h3><p>Clientes com maior volume de pedidos abertos e não conformidades.</p></div></header>
          {clientes.length ? (
            <div className="client-attention-list">
              {ordenarPorValor(clientes.map((item) => ({ ...item, risco: item.abertos + item.naoConformes + item.ocorrencias })), 'risco').slice(0, 6).map((item) => (
                <div key={item.cliente}>
                  <strong>{item.cliente}</strong>
                  <span>{item.abertos} abertos · {item.naoConformes} NC · {item.ocorrencias} ocorrências</span>
                </div>
              ))}
            </div>
          ) : <div className="empty-chart">Nenhum cliente com dados para exibir.</div>}
        </article>
      </div>

      <div className="section-header"><div><h2>Pedidos que precisam de atenção</h2><p>Serviços em aberto, reabertos ou em andamento para acompanhamento rápido.</p></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Técnico</th><th>Status</th><th>Criado em</th><th>Ação</th></tr></thead>
          <tbody>
            {pedidosCriticos.map((order) => (
              <tr key={order.id}>
                <td>{order.numero_pedido}</td>
                <td>{order.cliente}</td>
                <td>{technicians.find((item) => item.id === order.tecnico_id)?.nome || 'Não atribuído'}</td>
                <td><span className={`status ${normalizeStatus(order.status).replace(' ', '_')}`}>{statusLabel(order.status)}</span></td>
                <td>{formatDate(order.created_at)}</td>
                <td><button className="text-button" onClick={() => onOpenOrder(order)}>Abrir</button></td>
              </tr>
            ))}
            {!pedidosCriticos.length ? <tr><td colSpan="6">Nenhum pedido crítico no momento.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
