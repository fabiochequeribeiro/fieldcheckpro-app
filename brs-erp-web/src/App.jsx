import {
  Monitor,
  BriefcaseBusiness,
  ClipboardList,
  ShieldAlert,
  BarChart3,
  PieChart as PieIcon,
  Trophy,
  Clock3,
  RefreshCcw,
  Inbox,
  ListChecks,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function App() {
  const [visitas, setVisitas] = useState([]);
  const [totalVisitas, setTotalVisitas] = useState(0);
  const [totalEquipamentos, setTotalEquipamentos] = useState(0);
  const [totalPendencias, setTotalPendencias] = useState(0);
  const [totalNao, setTotalNao] = useState(0);
  const [equipamentosVendidos, setEquipamentosVendidos] = useState([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('');
  const [telaAtual, setTelaAtual] = useState('empresas');
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [mostrarPedidos, setMostrarPedidos] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [equipamentosPedido, setEquipamentosPedido] = useState([]);
  const [percentualPedido, setPercentualPedido] = useState(0);  
  const [pedidos, setPedidos] = useState([]);
  const [resumoEquipamentos, setResumoEquipamentos] = useState([]);
  const dadosGraficos = [
  {
    nome: 'Pendências',
    valor: totalPendencias,
  },
  {
    nome: 'Não Conformes',
    valor: totalNao,
  },

];  

const empresas = [
  { nome: 'BRS Equipamentos', codigo: 'BRS' },
  { nome: 'Semear', codigo: 'SEMEAR' },
  { nome: '2H', codigo: '2H' }
];

const cores = ['#f59e0b', '#dc2626'];

  useEffect(() => {
  carregarDashboard();

  const intervalo = setInterval(() => {
    carregarDashboard();
  }, 60000);

  return () => clearInterval(intervalo);
}, []);;

  async function carregarPedido(numeroPedido) {
  setPedidoSelecionado(numeroPedido);

  const { data: equipamentos } = await supabase
    .from('equipamentos')
    .select('*')
    .eq('numero_pedido', numeroPedido);

  console.log('EQUIPAMENTOS PEDIDO:', equipamentos);

  setEquipamentosPedido(equipamentos || []);

  if (!equipamentos?.length) {
    setPercentualPedido(0);
    return;
  }

  let totalItens = 0;
  let totalConcluidos = 0;

  for (const equipamento of equipamentos) {
    const { data: checklist } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('equipamento_id', equipamento.id);

    totalItens += checklist?.length || 0;

    totalConcluidos += checklist?.filter(
      item => item.status === 'OK'
    ).length || 0;
  }

  const percentual =
    totalItens > 0
      ? Math.round((totalConcluidos / totalItens) * 100)
      : 0;

  setPercentualPedido(percentual);
}

 async function carregarDashboard() {
  const { data: pedidosDados, error: erroPedidos } = await supabase
    .from('pedidos')
    .select('*')
    .order('numero_pedido', { ascending: false });

  console.log('PEDIDOS CARREGADOS:', pedidosDados);
  console.log('ERRO PEDIDOS:', erroPedidos);

  setPedidos(pedidosDados || []);

  const { data: equipamentosDados, error: erroEquipamentos } = await supabase
    .from('equipamentos')
    .select('*');

  console.log('EQUIPAMENTOS CARREGADOS:', equipamentosDados);
  console.log('ERRO EQUIPAMENTOS:', erroEquipamentos);

  const { data: visitasDados } = await supabase
    .from('visitas')
    .select('*')
    .order('id', { ascending: false });

  console.log('DADOS DO SUPABASE:', visitasDados);

  setVisitas(visitasDados || []);
  setTotalVisitas(visitasDados?.length || 0);

  const totalQtdEquipamentos = equipamentosDados?.reduce((soma, eq) => {
    return soma + (Number(eq.quantidade) || 1);
  }, 0);

  setTotalEquipamentos(totalQtdEquipamentos || 0);

  const pendencias = equipamentosDados?.reduce((soma, eq) => {
  return soma + (Number(eq.pendencias) || Number(eq.total_pendentes) || 0);
}, 0);

const nao = equipamentosDados?.reduce((soma, eq) => {
  return soma + (Number(eq.nao_conformes) || Number(eq.total_nao) || 0);
}, 0);

setTotalPendencias(pendencias || 0);
setTotalNao(nao || 0);

  const equipamentosRanking = {};

 equipamentosDados?.forEach((eq) => {
  const tag = eq.tag || eq.Tag || eq.codigo || 'Sem tag';

  const nome =
    eq.nome ||
    eq.modelo ||
    eq.descritivo ||
    'Sem identificação';

  const qtd = Number(eq.quantidade) || 1;

  equipamentosRanking[tag] = {
    tag,
    nome,
    quantidade: (equipamentosRanking[tag]?.quantidade || 0) + qtd
  };
});

const rankingFinal = Object.values(equipamentosRanking)
  .sort((a, b) => b.quantidade - a.quantidade)
  .slice(0, 20);

setEquipamentosVendidos(rankingFinal);

  setUltimaAtualizacao(
    new Date().toLocaleString('pt-BR')
  );
}

async function abrirPedido(pedido) {
  setPedidoSelecionado(pedido);

  const { data, error } = await supabase
    .from('equipamentos')
    .select('*')
    .eq('numero_pedido', pedido.numero_pedido);

  console.log('EQUIPAMENTOS DO PEDIDO:', data);
  console.log('ERRO EQUIPAMENTOS DO PEDIDO:', error);

  const agrupado = {};

  data?.forEach((eq) => {
    const tag = eq.tag || eq.Tag || eq.codigo || eq.descritivo || 'Sem tag';

const nome =
  eq.nome ||
  eq.modelo ||
  eq.descritivo ||
  'Sem identificação';

const qtd = Number(eq.quantidade) || 1;

if (!agrupado[tag]) {
  agrupado[tag] = {
    tag,
    nome,
    quantidade: 0,
    pendencias: 0,
    naoConformes: 0
  };
}

agrupado[tag].quantidade += qtd;
agrupado[tag].pendencias += Number(eq.pendencias || eq.total_pendentes || 0);
agrupado[tag].naoConformes += Number(eq.nao_conformes || eq.total_nao || 0);
  });

  const resumo = Object.values(agrupado);

  const totalPendenciasPedido = resumo.reduce(
  (soma, item) => soma + (item.pendencias || 0),
  0
);

const totalNaoPedido = resumo.reduce(
  (soma, item) => soma + (item.naoConformes || 0),
  0
);

setTotalPendencias(totalPendenciasPedido);
setTotalNao(totalNaoPedido);

  setEquipamentosPedido(resumo);
}

const totalPedidos = pedidos.length;

const totalEquipamentosGeral = pedidos.reduce((total, pedido) => {
  return total + (pedido.equipamentos?.length || 0);
}, 0);

const pedidosPorMes = pedidos.reduce((acc, pedido) => {
  const dataTexto = pedido.Data || pedido.data;

if (!dataTexto) return;

const partes = dataTexto.split('/');
const data = new Date(`20${partes[2]}-${partes[1]}-${partes[0]}`);
  const mesesAno = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

const mes = mesesAno[data.getMonth()];

  acc[mes] = (acc[mes] || 0) + 1;
  return acc;
}, {});

const graficoPedidosAno = Object.entries(pedidosPorMes).map(([mes, quantidade]) => ({
  mes,
  quantidade
}));

const mesesAno = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

const graficoAnualEmpresas = mesesAno.map((mes) => ({
  mes,
  BRS: 0,
  Semear: 0,
  '2H': 0
}));

pedidos.forEach((pedido) => {
  const dataTexto = pedido.data;

   if (!dataTexto || typeof dataTexto !== 'string') return;

const partes = dataTexto.split('/');

   if (partes.length < 3) return;

  const ano = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
const data = new Date(`${ano}-${partes[1]}-${partes[0]}`);

if (isNaN(data.getTime())) return;

  const mesIndex = data.getMonth(); 

  const empresa =
  pedido.cliente?.includes('Semear')
    ? 'Semear'
    : pedido.cliente?.includes('2H')
    ? '2H'
    : 'BRS';

  if (graficoAnualEmpresas[mesIndex]) {
    graficoAnualEmpresas[mesIndex][empresa] =
      (graficoAnualEmpresas[mesIndex][empresa] || 0) + 1;
  }
});

if (telaAtual === 'empresas') {
  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img src="/logo.png" alt="BRS" style={styles.logo} />

          <div>
            <h1 style={styles.titulo}>DASHBOARD INDUSTRIAL BRS</h1>

            <p style={styles.subHeader}>
              Monitoramento em tempo real • Entregas Técnicas
            </p>
          </div>
        </div>
      </div>

      <div style={styles.empresasGrid}>
        {empresas.map((empresa) => (
          <div
            key={empresa.codigo}
            style={styles.empresaCard}
            onClick={() => {
              setEmpresaSelecionada(empresa);
              setTelaAtual('pedidos');
            }}
          >
            <h2 style={{ fontSize: 46, marginBottom: 12 }}>
  {empresa.nome}
</h2>

            <p style={{ fontSize: 22, fontWeight: 500 }}>
  Clique para ver os pedidos
</p>
          </div>
        ))}
      </div>

      <div style={styles.resumoGrid}>

  <div style={styles.cardResumo}>
    <h2 style={{ fontSize: 52 }}>
  {totalPedidos}
</h2>
    <p style={{ fontSize: 24 }}>
  Total de Pedidos
</p>
  </div>

  <div style={styles.cardResumo}>
    <h2 style={{ fontSize: 52 }}>
  {totalEquipamentosGeral}
</h2>
    <p style={{ fontSize: 24 }}>
  Equipamentos Entregues
</p>
  </div>

</div>

<div style={styles.graficosHomeGrid}>

  <div style={styles.graficoHomeCard}>
    <h2 style={styles.graficoTitulo}>📊 Pedidos por Mês</h2>

    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={graficoAnualEmpresas}>
  <XAxis dataKey="mes" stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 28 }} />
  <YAxis
  stroke="#ffffff"
  tick={{ fill: '#ffffff', fontSize: 28 }}
/>
  <Tooltip
  contentStyle={{
    backgroundColor: '#0f172a',
    border: '1px solid #38bdf8',
    borderRadius: 12,
    padding: 14,
    fontSize: 30,
    color: '#ffffff',
    fontWeight: 700,
  }}
  itemStyle={{
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 700,
  }}
  labelStyle={{
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 800,
  }}
/>

  <Bar
    dataKey="BRS"
    stackId="a"
    fill="#2f8cff"
  />

  <Bar
    dataKey="Semear"
    stackId="a"
    fill="#f59e0b"
  />

  <Bar
    dataKey="2H"
    stackId="a"
    fill="#94a3b8"
  />
</BarChart>
    </ResponsiveContainer>
  </div>

  <div style={styles.graficoHomeCard}>
    <h2 style={styles.graficoTitulo}>🏆 Equipamentos Mais Vendidos</h2>

    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={equipamentosVendidos}>
        <XAxis dataKey="tag" stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 26 }} />
        <YAxis stroke="#ffffff" />
        <Tooltip
  contentStyle={{
    backgroundColor: '#0f172a',
    border: '1px solid #38bdf8',
    borderRadius: 12,
    padding: 14,
    fontSize: 30,
    color: '#ffffff',
    fontWeight: 700,
  }}
  itemStyle={{
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 700,
  }}
  labelStyle={{
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 800,
  }}
  formatter={(value, name, props) => [
    `${value} equipamentos`,
    props.payload.nome
  ]}
/>
        <Bar dataKey="quantidade" fill="#f59e0b" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>

</div>

    </div>
  );
}

const totalVisitasExibido = totalVisitas;

const totalEquipamentosExibido = pedidoSelecionado
  ? equipamentosPedido.reduce((soma, eq) => soma + (Number(eq.quantidade) || 1), 0)
  : totalEquipamentos;

const totalPendenciasExibido = pedidoSelecionado
  ? equipamentosPedido.reduce((soma, eq) => {
      return soma + (Number(eq.pendencias) || Number(eq.total_pendentes) || 0);
    }, 0)
  : totalPendencias;

  const totalNaoExibido = pedidoSelecionado
  ? equipamentosPedido.reduce((soma, eq) => {
      return soma + (Number(eq.naoConformes) || Number(eq.nao_conformes) || Number(eq.total_nao) || 0);
    }, 0)
  : totalNao;

return (  
  <div style={{ ...styles.container, zoom: 0.99 }}>
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <img src="/logo.png" alt="BRS" style={styles.logo} />

        <div>
          <h1 style={styles.titulo}>DASHBOARD INDUSTRIAL BRS</h1>
          <p style={styles.subHeader}>Monitoramento em tempo real • Entregas Técnicas</p>
          <p style={styles.atualizacao}>
            <RefreshCcw size={18} /> Última atualização: {ultimaAtualizacao}
          </p>
        </div>
      </div>

  {telaAtual === 'pedidos' && (
<button
  onClick={() => setTelaAtual('empresas')}
  style={{
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.18)',
    padding: '0 42px',
    borderRadius: 16,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minWidth: 360,
    height: 78,
    flexShrink: 0,
    boxShadow: '0 10px 28px rgba(37,99,235,0.45)',
    transition: '0.3s'
  }}
>
  ← Voltar para Empresas
</button>
)}
  {telaAtual === 'empresas' && (
  <div style={styles.empresasGrid}>
    {empresas.map((empresa) => (
      <div
        key={empresa.codigo}
        style={styles.empresaCard}
        onClick={() => {  
          setEmpresaSelecionada(empresa);
          setTelaAtual('pedidos');
        }}
      >
        <h2 style={{ fontSize: 34, marginBottom: 12 }}>
  {empresa.nome}
</h2>
        <p style={{ fontSize: 22, fontWeight: 500 }}>
  Clique para ver os pedidos
</p>
      </div>
    ))}
  </div>
)}

      <div style={styles.relogioBox}>
        <Clock3 size={62} color="#2f8cff" />
        <div>
          <div style={styles.relogioHora}>
            {new Date().toLocaleTimeString('pt-BR')}
          </div>
          <div style={styles.relogioData}>
            {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>

    <div style={styles.grid}>
      <div style={styles.cardAzul}>
        <div style={styles.iconBoxAzul}><Monitor size={54} /></div>
        <div>
          <h2 style={styles.numero}>{totalVisitasExibido}</h2>
          <p style={styles.texto}>Visitas Técnicas</p>
          <span style={styles.cardSubtexto}>Realizadas</span>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.iconBox}><BriefcaseBusiness size={54} /></div>
        <div>
          <h2 style={styles.numero}>{totalEquipamentosExibido}</h2>
          <p style={styles.texto}>Equipamentos</p>
          <span style={styles.cardSubtexto}>Entregues</span>
        </div>
      </div>

      <div style={styles.cardAmarelo}>
        <div style={styles.iconBoxAmarelo}><ClipboardList size={54} /></div>
        <div>
          <h2 style={styles.numero}>{totalPendenciasExibido }</h2>
          <p style={styles.texto}>Pendências</p>
          <span style={styles.cardSubtexto}>Em aberto</span>
        </div>
      </div>

      <div style={styles.cardVermelho}>
        <div style={styles.iconBoxVermelho}><ShieldAlert size={58} /></div>
        <div>
          <h2 style={styles.numero}>{totalNaoExibido}</h2>
          <p style={styles.texto}>Não conformidades</p>
          <span style={styles.cardSubtexto}>Registradas</span>
        </div>
      </div>
    </div>

    <table style={styles.tabela}>
      <thead>
        <tr>
          <th style={styles.th}>Cliente</th>
          <th style={styles.th}>Pendências</th>
          <th style={styles.th}>Não Conformes</th>
        </tr>
      </thead>
    </table>

    <div style={styles.graficosGrid}>
      <div style={styles.graficoCard}>
        <h2 style={styles.graficoTitulo}>
          <BarChart3 size={34} color="#2f8cff" /> Indicadores Gerais
        </h2>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dadosGraficos}>
            <XAxis dataKey="nome" stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 20 }} />
            <YAxis stroke="#ffffff" tick={{ fontSize: 28 }} />
            <Tooltip
  contentStyle={{
    backgroundColor: '#0f172a',
    border: '1px solid #38bdf8',
    borderRadius: 12,
    padding: 14,
    fontSize: 30,
    color: '#ffffff',
    fontWeight: 700,
  }}
  itemStyle={{
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 700,
  }}
  labelStyle={{
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 800,
  }}
/>
            <Bar dataKey="valor" fill="#d9d9d9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.graficoCard}>
        <h2 style={styles.graficoTitulo}>
          <PieIcon size={34} color="#2f8cff" /> Distribuição
        </h2>

        <div style={styles.donutFake}>
          <div style={styles.donutCentro}>
            <strong>{totalPendencias + totalNao}</strong>
            <span>Total</span>
          </div>
        </div>

        <div style={styles.legenda}>
          <div><span style={styles.bolinhaAzul}></span> Pendências<br />0 (0%)</div>
          <div><span style={styles.bolinhaVermelha}></span> Não conformes<br />0 (0%)</div>
        </div>
      </div>

      <div style={styles.graficoCard}>
        <h2 style={styles.graficoTitulo}>
          <Trophy size={34} color="#2f8cff" /> Equipamentos Mais Vendidos
        </h2>

        <div style={styles.tabelaEquipamentos}>

  <table style={styles.tabela}>

    <tbody>
      {resumoEquipamentos.map((item, index) => (
        <tr key={index}>
          <td style={styles.td}>{item.nome}</td>
          <td style={styles.td}>{item.quantidade}</td>
          <td style={styles.td}>{item.percentual}%</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        {equipamentosVendidos.length === 0 ? (
          <div style={styles.semDados}>Sem dados disponíveis</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pedidoSelecionado ? equipamentosPedido : equipamentosVendidos}>
              <XAxis dataKey="tag" stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 20 }} />
              <YAxis stroke="#ffffff" tick={{ fontSize: 26 }} />
              <Tooltip
  cursor={{ fill: 'rgba(255,255,255,0.08)' }}
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;

      return (
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #38bdf8',
            borderRadius: 12,
            padding: 14,
            color: '#ffffff', 
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          <div>{item.nome || 'Sem identificação'}</div>
          <div>quantidade: {item.quantidade}</div>
        </div>
      );
    }

    return null;
  }}
/>
              <Bar dataKey="quantidade" fill="#2f8cff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>

<div style={styles.listaPendencias}>

  <div style={{
    marginTop: 20,
    background: '#081225',
    borderRadius: 16,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.08)'
  }}>

    <h2 style={{
      color: 'white',
      marginBottom: 20,
      fontSize: 42,
      fontWeight: '900'
    }}>
      📦 Pedidos de Entrega Técnica
    </h2>

    <button
      onClick={() => setMostrarPedidos(!mostrarPedidos)}
      style={{
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.18)',
        padding: '12px 22px',
        borderRadius: 12,
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: 30,
        marginBottom: 16
      }}
    >
      {mostrarPedidos ? '▲ Fechar Pedidos' : '▼ Selecionar Pedido'}
    </button>

    {mostrarPedidos && (
  <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: 760,
    maxHeight: 430,
    overflowY: 'auto',
  }}
>
    {pedidos?.map((pedido) => (
      <div
        key={pedido.id}
        onClick={() => abrirPedido(pedido)}
       style={{
  background:
    pedidoSelecionado?.id === pedido.id
      ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
      : '#13203a',

  padding: 24,
  borderRadius: 18,
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.14)',
  transition: '0.3s',
  minHeight: 125,
  minWidth: 700,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  boxShadow:
    pedidoSelecionado?.id === pedido.id
      ? '0 0 25px rgba(37,99,235,0.35)'
      : '0 0 12px rgba(0,0,0,0.25)',
}}
      >
        <div
          style={{
            color: 'white',
            fontSize: 30,
            fontWeight: 'bold'
          }}
        >
          Pedido #{pedido.numero_pedido}
        </div>

        <div
          style={{
            color: '#94a3b8',
            marginTop: 10,
            fontSize: 21
          }}
        >
          {pedido.cliente}
        </div>

        <div
          style={{
            color:
              pedido.status === 'concluido'
                ? '#22c55e'
                : '#f59e0b',

            marginTop: 12,
            fontWeight: 'bold',
            fontSize: 20
          }}
        >
          ● {pedido.status}
        </div>
      </div>
    ))}
  </div>
)}

  </div>

  <h2 style={styles.graficoTitulo}>
    <ListChecks size={34} color="#00b7ff" /> Lista de Pendências
  </h2>

  {totalPendenciasExibido > 0 && (
    <table style={styles.tabelaPendencias}>
      <thead>
        <tr>
          <th style={styles.thPend}>ID</th>
          <th style={styles.thPend}>Cliente</th>
          <th style={styles.thPend}>Equipamento</th>
          <th style={styles.thPend}>Problema</th>
          <th style={styles.thPend}>Status</th>
          <th style={styles.thPend}>Data de Abertura</th>
          <th style={styles.thPend}>Ações</th>
        </tr>
      </thead>
    </table>
  )}

  <div style={styles.vazioBox}>
    <Inbox size={44} color="#94a3b8" />
    <p>Nenhuma pendência encontrada.</p>
  </div>
</div>
</div>
);
}

const styles = {
  container: {
  background: 'linear-gradient(135deg, #020617, #07142a)',
  minHeight: '100vh',
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: '#020617',
  padding: '28px',
  fontFamily: 'Arial',
  color: '#fff',
  boxSizing: 'border-box',
},
  header: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 40,
  paddingBottom: 18,
  borderBottom: '1px solid rgba(0,180,255,0.15)',
},

  pedidoDetalhes: {
  marginTop: 24,
  padding: 24,
  borderRadius: 18,
  background: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(148,163,184,0.25)',
},

equipamentosGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
  marginTop: 20,
},

equipamentoCard: {
  background: '#111c34',
  borderRadius: 14,
  padding: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
},

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 36,
  },

  logo: {
    width: 150,
    height: 125,
    objectFit: 'contain',
  },

  titulo: {
    fontSize: 42,
    fontWeight: '900',
    margin: 0,
    letterSpacing: 1,
  },

  subHeader: {
    color: '#22d3ee',
    fontSize: 30,
    marginTop: 8,
    fontWeight: 'bold',
  },

  atualizacao: {
    color: '#00b7ff',
    fontSize: 26,
    marginTop: 12,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  relogioBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 22,
    padding: '22px 32px',
    borderRadius: 18,
    border: '1px solid rgba(47,140,255,0.45)',
    background: 'rgba(15,23,42,0.65)',
  },

  relogioHora: {
    fontSize: 50,
    fontWeight: '900',
  },

  relogioData: {
    fontSize: 30,
    color: '#00b7ff',
    fontWeight: 'bold',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',  
    gap: 16,
    marginBottom: 18,
  },

  card: {
  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
  padding: 22,
  borderRadius: 22,
  display: 'flex',
  alignItems: 'center',
  gap: 28,
  border: '1px solid rgba(0,180,255,0.25)',
  boxShadow: '0 0 25px rgba(0,120,255,0.15)',
  transition: '0.3s',
},

  cardAzul: {
  background: 'linear-gradient(135deg, #0066ff, #003db1)',
  padding: 20,
  borderRadius: 26,
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  boxShadow: '0 0 35px rgba(0,102,255,0.35)',
  border: '1px solid rgba(255,255,255,0.12)',
},

  cardAmarelo: {
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  padding: 20,
  borderRadius: 22,
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  boxShadow: '0 0 35px rgba(245,158,11,0.30)',
  border: '1px solid rgba(255,255,255,0.12)',
},

  cardVermelho: {
  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
  padding: 20,
  borderRadius: 22,
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  boxShadow: '0 0 35px rgba(239,68,68,0.30)',
  border: '1px solid rgba(255,255,255,0.12)',
},

  iconBox: {
    background: 'rgba(255,255,255,0.10)',
    padding: 18,
    borderRadius: 14,
  },

  iconBoxAzul: {
    background: 'rgba(255,255,255,0.14)',
    padding: 18,
    borderRadius: 14,
  },

  iconBoxAmarelo: {
    background: 'rgba(255,255,255,0.14)',
    padding: 18,
    borderRadius: 14,
  },

  iconBoxVermelho: {
    background: 'rgba(255,255,255,0.14)',
    padding: 18,
    borderRadius: 14,
  },

  numero: {
  fontSize: 50,
  fontWeight: '900',
  color: '#ffffff',
  lineHeight: 1,
},  

  texto: {
  fontSize: 34,
  fontWeight: '700',
  color: '#ffffff',
},

  cardSubtexto: {
  fontSize: 22,
  color: '#dbeafe',
  marginTop: 8,
},

  tabela: {
    width: '100%',
    background: 'rgba(30,41,59,0.9)',
    borderRadius: 12,
    overflow: 'hidden',
    borderCollapse: 'collapse',
    marginBottom: 18,
  },

  th: {
    padding: 16,
    fontSize: 28,
    textAlign: 'left',
  },

  graficosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 18,
    marginBottom: 18,
  },

  graficoCard: {
    background: 'linear-gradient(135deg, #0f172a, #07111f)',
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 16,
    padding: 22,
    minHeight: 260,
    boxShadow: '0 12px 35px rgba(0,0,0,0.35)',
  },

  graficoTitulo: {
  fontSize: 32,
  fontWeight: '700',
  marginBottom: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: '#ffffff',
},

  donutFake: {
    width: 140,
    height: 140,
    borderRadius: '50%',
    margin: '35px auto 25px auto',
    background: 'conic-gradient(#334155 0deg, #334155 360deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  donutCentro: {
    width: 115,
    height: 115,
    borderRadius: '50%',
    background: '#07111f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
  },

  legenda: {
    display: 'flex',
    justifyContent: 'space-around',
    fontSize: 30,
  },

  bolinhaAzul: {
    display: 'inline-block',
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#2f8cff',
    marginRight: 8,
  },

  bolinhaVermelha: {
    display: 'inline-block',
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#ef4444',
    marginRight: 8,
  },

  semDados: {
    height: 270,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    color: '#cbd5e1',
  },

  listaPendencias: {
    background: 'linear-gradient(135deg, #0f172a, #07111f)',
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 16,
    padding: 28,
  },

  tabelaPendencias: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 20,
  },

  thPend: {
  fontSize: 22,
  padding: 18,
  color: '#ffffff',
  fontWeight: '800',
},

  vazioBox: {
    textAlign: 'center',
    padding: 28,
    fontSize: 24,
    color: '#e2e8f0',
  },

tabelaEquipamentos: {
  marginTop: 30,
  background: 'rgba(10,18,40,0.92)',
  borderRadius: 20,
  padding: 25,
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
},

empresasGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 24,
  marginTop: 40
},

empresaCard: {
  background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
  padding: 38,
  borderRadius: 22,
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 0 30px rgba(37,99,235,0.25)',
  transition: '0.3s',
},

resumoGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 20,
  marginTop: 40
},

cardResumo: {
  background: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
  padding: 34,
  borderRadius: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  minHeight: 180,
  border: '1px solid rgba(0,180,255,0.25)',
  boxShadow: '0 0 25px rgba(37,99,235,0.25)',
},

graficosHomeGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: 24,
  marginTop: 32
},

graficoHomeCard: {
  background: '#081225',
  borderRadius: 22,
  padding: 24,
  border: '1px solid rgba(56,189,248,0.25)',
  boxShadow: '0 18px 40px rgba(0,0,0,0.35)'
}

};