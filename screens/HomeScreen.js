import QRCode from 'qrcode';
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { supabase } from '../supabase';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignatureScreen from 'react-native-signature-canvas';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';
import CardPedido from '../components/CardPedido';

const LOGO_FIXO = require('../assets/logo.png');
const STORAGE_MODELOS = '@brs_modelos_checklist';
const STORAGE_VISITAS = '@brs_historico_visitas';

const MODELOS_INICIAIS = {
  'Elevador de Sementes': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura fixada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Parafusos estruturais apertados',
  },
  {
    categoria: 'CABECEIRA',
    texto: 'Cabeçote superior conferido',
  },
  {
    categoria: 'PÉ DO ELEVADOR',
    texto: 'Pé inferior conferido',
  },
  {
    categoria: 'CORREIA',
    texto: 'Correia centralizada',
  },
  {
    categoria: 'CANECAS',
    texto: 'Canecas plásticas fixadas',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Motor fixado corretamente',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Sentido de rotação testado',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções instaladas',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste sem carga realizado',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste com produto realizado',
  },
],
  'Correia Transportadora': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Fixações e parafusos conferidos',
  },
  {
    categoria: 'TAMBORES',
    texto: 'Tambor motriz conferido',
  },
  {
    categoria: 'TAMBORES',
    texto: 'Tambor de retorno conferido',
  },
  {
    categoria: 'CORREIA',
    texto: 'Correia transportadora centralizada',
  },
  {
    categoria: 'CORREIA',
    texto: 'Correia tensionada corretamente',
  },
  {
    categoria: 'CORREIA',
    texto: 'Emenda da correia conferida',
  },
  {
    categoria: 'ROLETES',
    texto: 'Roletes girando livremente',
  },
  {
    categoria: 'ROLETES',
    texto: 'Roletes de carga e retorno conferidos',
  },
  {
    categoria: 'RASPADORES',
    texto: 'Raspadores instalados e regulados',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Motor fixado corretamente',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Redutor conferido e sem vazamentos',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções mecânicas instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos e sinalizações conferidos',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste em vazio realizado',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste com produto realizado',
  },
],
  'Rosca Transportadora': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Fixações e parafusos conferidos',
  },
  {
    categoria: 'CALHA',
    texto: 'Calha conferida internamente',
  },
  {
    categoria: 'CALHA',
    texto: 'Tampas de inspeção fixadas',
  },
  {
    categoria: 'HELICOIDE',
    texto: 'Helicoide sem avarias',
  },
  {
    categoria: 'HELICOIDE',
    texto: 'Helicoide centralizado',
  },
  {
    categoria: 'MANCAL',
    texto: 'Mancais lubrificados',
  },
  {
    categoria: 'MANCAL',
    texto: 'Rolamentos sem ruídos',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Motor fixado corretamente',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Acoplamento conferido',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Sentido de rotação testado',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções mecânicas instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos e sinalizações conferidos',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste em vazio realizado',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste com produto realizado',
  },
],
  'Mesa Densimétrica': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Fixações e parafusos conferidos',
  },
  {
    categoria: 'TAMPO',
    texto: 'Tampo da mesa conferido',
  },
  {
    categoria: 'TAMPO',
    texto: 'Tela da mesa sem avarias',
  },
  {
    categoria: 'VIBRAÇÃO',
    texto: 'Sistema vibratório conferido',
  },
  {
    categoria: 'VIBRAÇÃO',
    texto: 'Molas e coxins conferidos',
  },
  {
    categoria: 'AR',
    texto: 'Caixa de ar vedada',
  },
  {
    categoria: 'AR',
    texto: 'Ventilador funcionando corretamente',
  },
  {
    categoria: 'AR',
    texto: 'Registro de ar ajustado',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Motor fixado corretamente',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Correias alinhadas e tensionadas',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Polias conferidas',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Sentido de rotação testado',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Painel elétrico conferido',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos de segurança conferidos',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste sem carga realizado',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste com produto realizado',
  },
],
  'Peneira Classificadora': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Fixações e parafusos conferidos',
  },
  {
    categoria: 'CORPO',
    texto: 'Corpo da peneira conferido',
  },
  {
    categoria: 'CORPO',
    texto: 'Tampas e acessos fixados',
  },
  {
    categoria: 'PENEIRAS',
    texto: 'Peneiras instaladas corretamente',
  },
  {
    categoria: 'PENEIRAS',
    texto: 'Peneiras sem avarias',
  },
  {
    categoria: 'PENEIRAS',
    texto: 'Fixação das peneiras conferida',
  },
  {
    categoria: 'VIBRAÇÃO',
    texto: 'Sistema vibratório conferido',
  },
  {
    categoria: 'VIBRAÇÃO',
    texto: 'Molas e coxins conferidos',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Motor fixado corretamente',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Correias alinhadas e tensionadas',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Polias conferidas',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Sentido de rotação testado',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Painel elétrico conferido',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos de segurança conferidos',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste sem carga realizado',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste com produto realizado',
  },
],
  'Elevador Combinado': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Fixações e parafusos conferidos',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Chaparias e portas de inspeção conferidas',
  },
  {
    categoria: 'PÉ DO ELEVADOR',
    texto: 'Tambor inferior conferido',
  },
  {
    categoria: 'PÉ DO ELEVADOR',
    texto: 'Sistema de esticamento conferido',
  },
  {
    categoria: 'CABECEIRA',
    texto: 'Tambor superior conferido',
  },
  {
    categoria: 'CABECEIRA',
    texto: 'Sistema de descarga conferido',
  },
  {
    categoria: 'CORREIA',
    texto: 'Correia centralizada',
  },
  {
    categoria: 'CORREIA',
    texto: 'Correia tensionada corretamente',
  },
  {
    categoria: 'CANECAS',
    texto: 'Canecas fixadas corretamente',
  },
  {
    categoria: 'CANECAS',
    texto: 'Canecas sem avarias',
  },
  {
    categoria: 'TRANSPORTE',
    texto: 'Sistema de transporte interno conferido',
  },
  {
    categoria: 'TRANSPORTE',
    texto: 'Fluxo interno sem obstruções',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Motor fixado corretamente',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Redutor conferido',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Acoplamentos conferidos',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Sentido de rotação testado',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Painel elétrico conferido',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções mecânicas instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos e sinalizações conferidos',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste em vazio realizado',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste com produto realizado',
  },
],
  'Elevador de Corrente': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Fixações e parafusos conferidos',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Chaparias e portas de inspeção conferidas',
  },
  {
    categoria: 'PÉ DO ELEVADOR',
    texto: 'Tambor inferior conferido',
  },
  {
    categoria: 'PÉ DO ELEVADOR',
    texto: 'Sistema de esticamento conferido',
  },
  {
    categoria: 'CABECEIRA',
    texto: 'Roda dentada superior conferida',
  },
  {
    categoria: 'CABECEIRA',
    texto: 'Sistema de descarga conferido',
  },
  {
    categoria: 'CORRENTES',
    texto: 'Correntes alinhadas corretamente',
  },
  {
    categoria: 'CORRENTES',
    texto: 'Tensão das correntes conferida',
  },
  {
    categoria: 'CORRENTES',
    texto: 'Emendas das correntes conferidas',
  },
  {
    categoria: 'CANECAS',
    texto: 'Canecas fixadas corretamente',
  },
  {
    categoria: 'CANECAS',
    texto: 'Canecas sem avarias',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Motor fixado corretamente',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Redutor conferido',
  },
  {
    categoria: 'TRANSMISSÃO',
    texto: 'Acoplamentos conferidos',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Sentido de rotação testado',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Painel elétrico conferido',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções mecânicas instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos e sinalizações conferidos',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste em vazio realizado',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste com produto realizado',
  },
],
  'Caixa': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e nivelada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Fixações e parafusos conferidos',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Chaparias sem avarias',
  },
  {
    categoria: 'VEDAÇÃO',
    texto: 'Vedação das tampas conferida',
  },
  {
    categoria: 'VEDAÇÃO',
    texto: 'Portas de inspeção conferidas',
  },
  {
    categoria: 'FLUXO',
    texto: 'Fluxo interno sem obstruções',
  },
  {
    categoria: 'FLUXO',
    texto: 'Descarga funcionando corretamente',
  },
  {
    categoria: 'DESCARGA',
    texto: 'Registro de descarga conferido',
  },
  {
    categoria: 'DESCARGA',
    texto: 'Acionamentos funcionando corretamente',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Sensores instalados corretamente',
  },
  {
    categoria: 'ELÉTRICA',
    texto: 'Cabos e conexões conferidos',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos e sinalizações conferidos',
  },
  {
    categoria: 'LIMPEZA',
    texto: 'Interior limpo e sem resíduos',
  },
  {
    categoria: 'LIMPEZA',
    texto: 'Acabamento final conferido',
  },
  {
    categoria: 'TESTE OPERACIONAL',
    texto: 'Teste operacional realizado',
  },
],
  'Torre Metálica': [
  {
    categoria: 'ESTRUTURA',
    texto: 'Estrutura alinhada e aprumada',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Nivelamento da base conferido',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Parafusos estruturais apertados',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Soldas estruturais conferidas',
  },
  {
    categoria: 'ESTRUTURA',
    texto: 'Chaparias sem avarias',
  },
  {
    categoria: 'FIXAÇÃO',
    texto: 'Chumbadores conferidos',
  },
  {
    categoria: 'FIXAÇÃO',
    texto: 'Bases e apoios fixados corretamente',
  },
  {
    categoria: 'PLATAFORMAS',
    texto: 'Plataformas instaladas corretamente',
  },
  {
    categoria: 'PLATAFORMAS',
    texto: 'Corrimãos conferidos',
  },
  {
    categoria: 'PLATAFORMAS',
    texto: 'Escadas fixadas corretamente',
  },
  {
    categoria: 'ACESSO',
    texto: 'Acessos seguros e liberados',
  },
  {
    categoria: 'ACESSO',
    texto: 'Pontos de inspeção conferidos',
  },
  {
    categoria: 'PINTURA',
    texto: 'Pintura e acabamento conferidos',
  },
  {
    categoria: 'PINTURA',
    texto: 'Ausência de corrosão',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Proteções instaladas',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Adesivos e sinalizações conferidos',
  },
  {
    categoria: 'SEGURANÇA',
    texto: 'Itens NR-12 conferidos',
  },
  {
    categoria: 'FINALIZAÇÃO',
    texto: 'Limpeza final realizada',
  },
  {
    categoria: 'FINALIZAÇÃO',
    texto: 'Inspeção final aprovada',
  },
],
  'Painel Elétrico': [
    'Disjuntores identificados',
    'Fiação organizada',
    'Botão de emergência funcionando',
    'Inversor parametrizado',
    'Teste elétrico realizado',
  ],
  'Moega': [
    'Estrutura nivelada',
    'Grade instalada',
    'Sistema de descarga conferido',
    'Fixações apertadas',
    'Teste operacional realizado',
  ],
};

async function carregarModeloChecklist(nomeEquipamento) {

  try {

    const { data, error } = await supabase
      .from('modelos_checklist')
      .select('*')
      .eq('equipamento', nomeEquipamento)
      .order('ordem');

    if (error) {
      console.log(error);
      return [];
    }

    return data.map(item => ({
      item: item.item,
      resposta: '',
      observacao: '',
      foto: null,
    }));

  } catch (err) {

    console.log(err);
    return [];
  }
}

function criarItem(item) {
  return {
    categoria:
      typeof item === 'object'
        ? item.categoria || 'GERAL'
        : 'GERAL',

    texto:
      typeof item === 'object'
        ? item.texto || ''
        : item,

    ativo: true,
    resposta: null,
    obs: '',
    foto: null,
  };
}

function criarChecklist(modelos, tipo = 'Elevador de Sementes') {
  const lista = modelos[tipo] || modelos['Elevador de Sementes'] || [];
  return lista.map(criarItem);
}

async function carregarChecklistDoSupabase(tipo) {
  try {
    const { data, error } = await supabase
      .from('modelos_checklist')
      .select('*')
      .eq('tag', tipo)
      .order('ordem');

    if (error) {
      console.log('Erro ao carregar modelo:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

   return data.map((linha) => ({
  texto: linha.item,
  categoria: linha.categoria || 'GERAL',
  ativo: true,
  resposta: null,
  obs: '',
  foto: null,
}));
  } catch (erro) {
    console.log('Erro Supabase checklist:', erro);
    return null;
  }
}

async function selecionarImagem(eqIndex) {

  const permissao =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissao.granted) {
    Alert.alert(
      'Permissão necessária',
      'Permita acesso às fotos.'
    );
    return;
  }

  const resultado =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

  if (!resultado.canceled) {

    const novaLista = [...equipamentos];

    novaLista[eqIndex].foto =
      resultado.assets[0].uri;

    novaLista[eqIndex].fotoBase64 =
      resultado.assets[0].base64;

    setEquipamentos(novaLista);
  }
}

function criarEquipamento(modelos, numero = 1, tipo = 'Elevador de Sementes') {
  return {
    tipo,
    nome: numero === 1 ? tipo : `Equipamento ${numero}`,
    descricao: '',
    modelo: '',
    serie: '',
    foto: null,
    itens: criarChecklist(modelos, tipo),
  };
}

export default function HomeScreen({ route }) {
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalVisitas, setTotalVisitas] = useState(0);  
  const [totalEquipamentos, setTotalEquipamentos] = useState(0);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [totalNao, setTotalNao] = useState(0);
  const [ultimoCliente, setUltimoCliente] = useState('');
  const assinaturaRef = useRef(null);
  const [tela, setTela] = useState(route?.params?.telaInicial || 'pedido');
  useEffect(() => {
  if (route?.params?.telaInicial) {
    setTela(route.params.telaInicial);
  }
}, [route?.params?.telaInicial]);
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [equipamentoAtual, setEquipamentoAtual] = useState(0);
  const [assinaturaAberta, setAssinaturaAberta] = useState(false);
  const [listaPedidos, setListaPedidos] = useState([]);
  const [modelos, setModelos] = useState(MODELOS_INICIAIS);
  const [historico, setHistorico] = useState([]);
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [tipoBanco, setTipoBanco] = useState('Elevador de Sementes');   
  const [novoTipo, setNovoTipo] = useState('');
  const [novoItemBanco, setNovoItemBanco] = useState('');
  const [editandoBancoIndex, setEditandoBancoIndex] = useState(null);
  const [textoEditandoBanco, setTextoEditandoBanco] = useState('');
  const [ultimoAtendimentoCliente, setUltimoAtendimentoCliente] = useState('Sem atendimento');
  const [novoItemVisita, setNovoItemVisita] = useState('');
  const [editandoItemVisita, setEditandoItemVisita] = useState(null);
  const [textoEditandoVisita, setTextoEditandoVisita] = useState('');
  const [categoriasAbertas, setCategoriasAbertas] = useState({}); 
  const [dados, setDados] = useState({
    numeroPedido: '',
    cliente: '',
    endereco: '',
    cidade: '',
    estado: '',
    telefone: '',
    emailCliente: '',
    responsavel: '',
    tecnico: '',
    data: new Date().toLocaleDateString('pt-BR'),
    observacoes: '',
  });

  const [equipamentos, setEquipamentos] = useState([criarEquipamento(MODELOS_INICIAIS, 1)]);
  const [assinatura, setAssinatura] = useState(null);

  const [listaClientes, setListaClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [numeroPedido, setNumeroPedido] = useState('');
  const [pedidoEncontrado, setPedidoEncontrado] = useState(null);
  const [buscandoPedido, setBuscandoPedido] = useState(false);
  const clientesUnicos = listaClientes.filter(
  (cliente, index, self) =>
    index === self.findIndex(
      (c) =>
        String(c.nome || '').trim().toLowerCase() === String(cliente.nome || '').trim().toLowerCase() &&
        String(c.cidade || '').trim().toLowerCase() === String(cliente.cidade || '').trim().toLowerCase() &&
        String(c.telefone || '').trim() === String(cliente.telefone || '').trim()
    )
);

  function toggleCategoria(categoria) {
  setCategoriasAbertas((prev) => ({
    ...prev,
    [categoria]: !prev[categoria],
  }));
}

  async function buscarUltimaVisitaCliente(nomeCliente) {
  if (!nomeCliente) {
    setUltimoAtendimentoCliente('Sem atendimento');
    return;
  }

  const { data, error } = await supabase
    .from('visitas')
    .select('id, cliente, data_visita, data, numero_os')
    .eq('cliente', nomeCliente)
    .order('id', { ascending: false })
    .limit(1);

  if (error) {
    console.log('ERRO ÚLTIMA VISITA CLIENTE:', error);
    setUltimoAtendimentoCliente('Sem atendimento');
    return;
  }

  const ultima = data?.[0];

  if (!ultima) {
    setUltimoAtendimentoCliente('Sem atendimento');
    return;
  }

  setUltimoAtendimentoCliente(ultima.data_visita || ultima.data || 'Data não informada');
}

  function abrirMaps(pedido) {
  const enderecoCompleto = `${pedido.endereco || ''}, ${pedido.cidade || ''} - ${pedido.estado || ''}`;

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`;

  Linking.openURL(url);
}

  async function buscarPedido(pedidoSelecionado = null) {
  const pedidoDigitado = String(
    pedidoSelecionado || numeroPedido
  ).trim();

  if (!pedidoDigitado) {
    Alert.alert('Atenção', 'Digite o número do pedido.');
    return;
  }

  setBuscandoPedido(true);

  setEquipamentos([]);
  setEquipamentoAtual(0); 
  
  const { data: pedido, error: erroPedido } = await supabase
    .from('pedidos')
    .select('*')
    .eq('numero_pedido', pedidoDigitado)
    .maybeSingle();

  //console.log('PEDIDO:', pedido);
  //console.log('ERRO PEDIDO:', erroPedido);

  if (erroPedido || !pedido) {
    setBuscandoPedido(false);
    Alert.alert('Pedido não encontrado', 'Verifique o número digitado.');
    return;
  }

  setPedidoEncontrado(pedido);

  buscarUltimaVisitaCliente(pedido.cliente);

  setDados({
    ...dados,
    numeroPedido: pedido.numero_pedido || pedidoDigitado,
    cliente: pedido.cliente || '',
    endereco: pedido.endereco || '',
    cidade: pedido.cidade || '',
    estado: pedido.estado || '',
    telefone: pedido.telefone || '',
    emailCliente: pedido.email || '',
    responsavel: pedido.responsavel || '',
  });

  console.time('BUSCA EQUIPAMENTOS');

const { data: equipamentosPedido, error: erroEquipamentos } = await supabase
  .from('equipamentos')
  .select('*')
  .eq('numero_pedido', pedidoDigitado)

console.timeEnd('BUSCA EQUIPAMENTOS');

  //console.log('EQUIPAMENTOS:', equipamentosPedido);
  //console.log('ERRO EQUIPAMENTOS:', erroEquipamentos);

  const equipamentosFiltrados = equipamentosPedido || [];

  const { data: visitaAnterior, error: erroVisitaAnterior } = await supabase
  .from('visitas')
  .select('*')
  .eq('numero_pedido', pedidoDigitado)
  .not('equipamentos', 'is', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (erroVisitaAnterior) {
  console.log('ERRO AO BUSCAR VISITA ANTERIOR:', erroVisitaAnterior);
}

if (visitaAnterior?.equipamentos?.length > 0) {
  console.log('VISITA ANTERIOR ENCONTRADA:', visitaAnterior);
  
  setPedidoEncontrado(pedido);
  setEquipamentos(visitaAnterior.equipamentos);
  setBuscandoPedido(false);
  setTela('visita');
  return;
}

  console.log('EQUIPAMENTOS FILTRADOS:', equipamentosFiltrados);
  console.log('TOTAL FILTRADO:', equipamentosFiltrados.length);

  const equipamentosFormatados = await Promise.all(
  equipamentosFiltrados.map(async (eq) => {
  if (!eq) return null;
    const tag = String(
      eq.tag ||
      eq.TAG ||
      eq.codigo_tag ||
      eq.tag_equipamento ||
      eq.nome ||
      ''
    ).trim();

    const checklistOnline = tag
      ? await carregarChecklistDoSupabase(tag)
      : null;

    const checklistLocal =
      MODELOS_INICIAIS[tag] ||
      MODELOS_INICIAIS[eq.nome] ||
      [];

    const itensBase =
      checklistOnline && checklistOnline.length > 0
        ? checklistOnline
        : checklistLocal.map(criarItem);

    return {
      tipo: eq.nome || tag || '',
      nome: eq.nome || '',
      tag,
      modelo: eq.modelo || '',
      serie: eq.serie || '',
      codigo: eq.codigo || '',
      descritivo: eq.descritivo || '',
      quantidade: eq.quantidade || 1,
      foto: null,
      itens: itensBase.map((item) => ({
        categoria: item.categoria || 'GERAL',
        texto: item.texto || item.item || '',
        resposta: item.resposta || null,
        obs: item.obs || item.observacao || '',
        foto: null,
        ativo: item.ativo !== false,
      })),
    };
  })
);

  setEquipamentos(
  equipamentosFormatados.filter(Boolean)
);

  setBuscandoPedido(false);

  }

async function carregarDashboard() {

  try {

    const { count: clientes } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    const { count: visitas } = await supabase
      .from('visitas')
      .select('*', { count: 'exact', head: true });

    const { count: equipamentos } = await supabase
  .from('equipamentos')
  .select('*', { count: 'exact', head: true });

const { data: visitasDados } = await supabase
  .from('visitas')
  .select('*')
  .order('id', { ascending: false });

const pendentes = visitasDados?.reduce(
  (soma, visita) => soma + (visita.total_pendentes || 0),
  0
);

const nao = visitasDados?.reduce(
  (soma, visita) => soma + (visita.total_nao || 0),
  0
);

setTotalPendentes(pendentes || 0);
setTotalNao(nao || 0);
setUltimoCliente(visitasDados?.[0]?.cliente || 'Nenhum');

setTotalClientes(clientes || 0);
setTotalVisitas(visitas || 0);
setTotalEquipamentos(equipamentos || 0);

  } catch (erro) {

    console.log(erro);
  }
}
async function buscarListaPedidos() {
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('id, numero_pedido, cliente, status, cidade')
    .order('id', { ascending: false });

  if (error) {
    console.log('ERRO LISTA PEDIDOS:', error);
    return;
  }

  const { data: visitas, error: erroVisitas } = await supabase
    .from('visitas')
    .select('numero_pedido, status, finalizado, total_pendentes, total_equipamentos, created_at')
    .order('created_at', { ascending: false });

  if (erroVisitas) {
    console.log('ERRO STATUS VISITAS:', erroVisitas);
  }

  const pedidosComStatus = (pedidos || []).map((pedido) => {
    const visita = (visitas || []).find(
      (v) => String(v.numero_pedido) === String(pedido.numero_pedido)
    );

    const visitaFinalizada =
  visita?.finalizado === true ||
  (
    Number(visita?.total_pendentes || 0) === 0 &&
    Number(visita?.total_equipamentos || 0) > 0
  );

return {
  ...pedido,
  status: visitaFinalizada
    ? 'finalizado'
    : visita?.status || pedido.status || 'pendente',
  finalizado: visitaFinalizada,
};
  });

  console.log('TOTAL PEDIDOS:', pedidosComStatus.length);
  setListaPedidos(pedidosComStatus);
}

useEffect(() => {
  verificarLogin();
  buscarListaPedidos();
  //buscarClientes();
  //carregarBanco();
  carregarHistorico();
  //carregarDashboard();
}, []);

  async function buscarClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });

  console.log('CLIENTES BUSCADOS:', data);
  console.log('ERRO CLIENTES:', error);

  if (!error) {
    setListaClientes(data || []);
  }
}

  async function carregarBanco() {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_MODELOS);
      if (salvo) {
        const banco = JSON.parse(salvo);
        setModelos(banco);
        const primeiroTipo = Object.keys(banco)[0] || 'Elevador de Sementes';
        setTipoBanco(primeiroTipo);
        setEquipamentos([criarEquipamento(banco, 1, primeiroTipo)]);
      }
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar o Banco de Checklists BRS.');
    }
  }

  async function carregarHistorico() {
  const { data, error } = await supabase
    .from('visitas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('ERRO AO CARREGAR HISTÓRICO:', error);
    return;
  }

  setHistorico(data || []);
}

  async function salvarModelos(novosModelos) {
    try {
      setModelos(novosModelos);
      await AsyncStorage.setItem(STORAGE_MODELOS, JSON.stringify(novosModelos));
    } catch (erro) {
      Alert.alert('Erro ao salvar', 'Não foi possível salvar o banco de checklists.');
    }
  }

  const equipamento =
  equipamentos[equipamentoAtual] ||
  equipamentos[0] ||
  criarEquipamento(MODELOS_INICIAIS, 1);

  const resumo = useMemo(() => {
  const todos = equipamentos.flatMap((eq) =>
    (eq.itens || []).filter((i) => i.ativo !== false)
  );

  return {
    total: todos.length,
    ok: todos.filter((i) => i.resposta === 'OK' || i.ok === true).length,
    nao: todos.filter((i) => i.resposta === 'NAO' || i.nao === true).length,
    pendentes: todos.filter(
      (i) =>
        !i.resposta &&
        i.ok !== true &&
        i.nao !== true
    ).length,
  };
}, [equipamentos]);

  const indicadoresVisitaAtual = {
  visitas: pedidoEncontrado ? 1 : 0,
  equipamentos: equipamentos.length || 0,
  pendentes: resumo.pendentes || 0,
  nao: resumo.nao || 0,
};

  async function finalizarChecklist() {
  try {
    const numeroPedido =
      dados.numeroPedido ||
      dados.numero_pedido ||
      dados.pedido ||
      '';

    const { error } = await supabase
      .from('visitas')
      .insert([
        {
          cliente: dados.cliente || '',
          tecnico: dados.tecnico || '',
          cidade: dados.cidade || '',
          data_visita: new Date().toLocaleDateString('pt-BR'),
          observacoes: dados.observacoes || '',
          total_ok: resumo.ok,
          total_nao: resumo.nao,
          total_pendentes: resumo.pendentes,
          total_equipamentos: equipamentos.length,
          numero_os: numeroPedido,
          numero_pedido: numeroPedido,
          numero_entrega: `BRS-${new Date().getFullYear()}-${Date.now()}`,
          equipamentos: equipamentos,
        },
      ]);

    if (error) {
  console.log('ERRO AO SALVAR VISITA:', error);

  Alert.alert(
    'Erro ao salvar visita',
    error.message || JSON.stringify(error)
  );

  return;
}

    Alert.alert(
      'Checklist finalizado',
      'Visita salva com sucesso no Supabase.'
    );
  } catch (error) {
    console.log('ERRO FINALIZAR CHECKLIST:', error);
    Alert.alert('Erro', 'Erro ao finalizar checklist.');
  }
}

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarEquipamento(campo, valor) {
    setEquipamentos((atual) => {
      const novo = [...atual];
      novo[equipamentoAtual] = { ...novo[equipamentoAtual], [campo]: valor };
      return novo;
    });
  }

function trocarTipoEquipamento(tipo) {
  Alert.alert('Carregar checklist', `Deseja carregar o checklist padrão de ${tipo}?`, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Carregar',
      onPress: async () => {
        const checklistOnline = await carregarChecklistDoSupabase(tipo);
        const checklistFinal = checklistOnline || criarChecklist(modelos, tipo);

        setEquipamentos((atual) => {
          const novo = [...atual];
          novo[equipamentoAtual] = {
            ...novo[equipamentoAtual],
            tipo,
            nome: tipo,
            itens: checklistFinal,
          };
          return novo;
        });
      },
    },
  ]);
}   
  function adicionarEquipamento() {
    const primeiroTipo = Object.keys(modelos)[0] || 'Elevador de Sementes';
    setEquipamentos((atual) => [...atual, criarEquipamento(modelos, atual.length + 1, primeiroTipo)]);
    setEquipamentoAtual(equipamentos.length);
  }

  function removerEquipamento() {
    if (equipamentos.length === 1) {
      Alert.alert('Atenção', 'É necessário manter pelo menos um equipamento.');
      return;
    }
    setEquipamentos((atual) => atual.filter((_, i) => i !== equipamentoAtual));
    setEquipamentoAtual(0);
  }

  function alterarItemVisita(index, alteracao) {
    setEquipamentos((atual) => {
      const novo = [...atual];
      const itens = [...novo[equipamentoAtual].itens];
      itens[index] = { ...itens[index], ...alteracao };
      novo[equipamentoAtual] = { ...novo[equipamentoAtual], itens };
      return novo;
    });
  }

  function adicionarItemVisita() {
    const texto = novoItemVisita.trim();
    if (!texto) return;
    setEquipamentos((atual) => {
      const novo = [...atual];
      novo[equipamentoAtual] = {
        ...novo[equipamentoAtual],
        itens: [...novo[equipamentoAtual].itens, criarItem(texto)],
      };
      return novo;
    });
    setNovoItemVisita('');
  }

  function removerItemVisita(index) {
    setEquipamentos((atual) => {
      const novo = [...atual];
      novo[equipamentoAtual] = {
        ...novo[equipamentoAtual],
        itens: novo[equipamentoAtual].itens.filter((_, i) => i !== index),
      };
      return novo;
    });
  }

  function salvarEdicaoItemVisita() {
    const texto = textoEditandoVisita.trim();
    if (!texto) return;
    alterarItemVisita(editandoItemVisita, { texto });
    setEditandoItemVisita(null);
    setTextoEditandoVisita('');
  }

  async function escolherFotoEquipamento() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmera ou galeria.');
      return;
    }

    Alert.alert('Foto do equipamento', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!resultado.canceled) atualizarEquipamento('foto', resultado.assets[0].uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!resultado.canceled) atualizarEquipamento('foto', resultado.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function adicionarFotoItem(index) {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos.');
      return;
    }

    Alert.alert('Foto do item', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!resultado.canceled) alterarItemVisita(index, { foto: resultado.assets[0].uri });
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!resultado.canceled) alterarItemVisita(index, { foto: resultado.assets[0].uri });
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function salvarAssinatura(signature) {
    setAssinatura(signature);
    setAssinaturaAberta(false);
    Alert.alert('Assinatura salva', 'A assinatura foi registrada com sucesso.');
  }

  function confirmarAssinatura() {
    assinaturaRef.current?.readSignature();
  }

  function limparAssinatura() {
    setAssinatura(null);
    assinaturaRef.current?.clearSignature();
  }

  function adicionarTipoBanco() {
    const nome = novoTipo.trim();
    if (!nome) return;
    if (modelos[nome]) {
      Alert.alert('Atenção', 'Esse tipo de equipamento já existe no banco.');
      return;
    }
    const novoBanco = { ...modelos, [nome]: [] };
    salvarModelos(novoBanco);
    setTipoBanco(nome);
    setNovoTipo('');
  }

  function adicionarItemBanco() {
    const texto = novoItemBanco.trim();
    if (!texto) return;
    const novoBanco = {
      ...modelos,
      [tipoBanco]: [...(modelos[tipoBanco] || []), texto],
    };
    salvarModelos(novoBanco);
    setNovoItemBanco('');
  }

  function removerItemBanco(index) {
    const novoBanco = {
      ...modelos,
      [tipoBanco]: modelos[tipoBanco].filter((_, i) => i !== index),
    };
    salvarModelos(novoBanco);
  }

  function salvarEdicaoBanco() {
    const texto = textoEditandoBanco.trim();
    if (!texto) return;    const lista = [...modelos[tipoBanco]];
    lista[editandoBancoIndex] = texto;
    salvarModelos({ ...modelos, [tipoBanco]: lista });
    setEditandoBancoIndex(null);
    setTextoEditandoBanco('');
  }

  function removerTipoBanco() {
    if (Object.keys(modelos).length === 1) {
      Alert.alert('Atenção', 'É necessário manter pelo menos um tipo de equipamento.');
      return;
    }
    Alert.alert('Remover tipo', `Deseja remover ${tipoBanco} do Banco de Checklists BRS?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const novoBanco = { ...modelos };
          delete novoBanco[tipoBanco];
          const novoTipoSelecionado = Object.keys(novoBanco)[0];
          salvarModelos(novoBanco);
          setTipoBanco(novoTipoSelecionado);
        },
      },
    ]);
  }

  function restaurarBancoInicial() {
    Alert.alert('Restaurar banco inicial', 'Isso vai voltar os modelos para o padrão inicial da BRS. Deseja continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: () => {
          salvarModelos(MODELOS_INICIAIS);
          setTipoBanco('Elevador de Sementes');
        },
      },
    ]);
  }

 async function salvarHistorico() {
  const registro = {
    id: Date.now(),
    cliente: dados.cliente,
    emailCliente: dados.emailCliente,
    propriedade: dados.propriedade,
    cidade: dados.cidade,
    tecnico: dados.tecnico,
    data: dados.data,
    equipamentos: equipamentos,
    resumo,
    dados,
    numero_pedido: numeroPedido,
    pedidoEncontrado,
    status: resumo.pendentes === 0 ? 'finalizado' : 'em_andamento',
   finalizado: resumo.pendentes === 0,
  };

  const salvo = await AsyncStorage.getItem(STORAGE_VISITAS);
  const listaAtual = salvo ? JSON.parse(salvo) : [];
  const novaLista = [registro, ...listaAtual];

  await AsyncStorage.setItem(STORAGE_VISITAS, JSON.stringify(novaLista));
  setHistorico(novaLista);

   await supabase.from('visitas').insert([
  {
    numero_os: `BRS-${new Date().getFullYear()}-${Date.now()}`,
    cliente: dados.cliente,
    tecnico: dados.tecnico,
    cidade: dados.cidade,
    data_visita: dados.data,
    observacoes: dados.observacoes,
    total_ok: resumo.ok,
    total_nao: resumo.nao,
    total_pendentes: resumo.pendentes,
    total_equipamentos: equipamentos.length,
    status: 'finalizado',
    finalizado: true,
  },
]);
try {
console.log('Dados enviados para Supabase');
} catch (erro) {
  console.log('Erro Supabase:', erro);
}
}
  async function limparHistorico() {
    Alert.alert('Limpar histórico', 'Deseja apagar todo o histórico salvo neste celular?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_VISITAS);
          setHistorico([]);
        },
      },
    ]);
  }

function continuarVisita(visita) {
  console.log('CONTINUANDO VISITA:', visita);

  setDados(visita.dados || {});
  setEquipamentos(visita.equipamentos || []);
  setPedidoEncontrado(visita.pedidoEncontrado || null);
  setNumeroPedido(String(visita.numero_pedido || ''));

  setTela('visita');
}

async function gerarNumeroEntrega() {
  const anoAtual = new Date().getFullYear();

  const { data, error } = await supabase
    .from('controle_entregas')
    .select('*')
    .eq('ano', anoAtual)
    .single();

  if (error) {
    console.log(error);
    return `BRS-${anoAtual}-0001`;
  }

  const proximoNumero = data.ultimo_numero + 1;

  await supabase
    .from('controle_entregas')
    .update({
      ultimo_numero: proximoNumero,
    })
    .eq('id', data.id);

  const numeroFormatado = String(proximoNumero).padStart(4, '0');

  return `BRS-${anoAtual}-${numeroFormatado}`;
}

async function fazerLogin() {
  if (!emailLogin || !senhaLogin) {
    Alert.alert('Atenção', 'Preencha e-mail e senha.');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
  email: emailLogin.trim().toLowerCase(),
  password: senhaLogin.trim(),
});

  if (error) {
    Alert.alert('Erro', error.message);
    return;
  }

  const { data: tecnico, error: erroTecnico } = await supabase
  .from('tecnicos')
  .select('*')
  .eq('email', emailLogin)
  .eq('ativo', true)
  .single();

if (erroTecnico || !tecnico) {
  Alert.alert('Atenção', 'Técnico não cadastrado ou inativo.');
  return;
}

setUsuario({
  ...data.user,
  tecnico,
});

setTela('pedido');
}   

async function verificarLogin() {
  const { data } = await supabase.auth.getSession();

  if (data?.session?.user) {
    setUsuario(data.session.user);
  }
}   

async function sairSistema() {
  await supabase.auth.signOut();
  setUsuario(null);
}

  async function montarHtmlPdf(logoBase64, equipamentosPdf = equipamentos) {
    const equipamentosHtml = equipamentosPdf.map((eq, eqIndex) => {
        const fotoEquipamentoHtml = eq.fotoBase64
  ? `
    <div class="fotoEquipamentoBox">
      <h3>Foto do equipamento</h3>
      <img
        class="fotoEquipamentoPdf"
        src="data:image/jpeg;base64,${eq.fotoBase64}"
      />
    </div>
  `
  : `
  <div class="semFotoBox">
    <p class="semFoto">
      Nenhuma foto registrada para este equipamento.
    </p>
  </div>
`;  
      const itemsHtml = (eq.itens || [])
  .filter((item) => item.ativo !== false)
  .map(
    (item) => `
      <tr>
        <td>${item.texto}</td>
        <td class="centro ok">${item.resposta === 'OK' ? 'OK' : ''}</td>
        <td class="centro nao">${item.resposta === 'NAO' ? 'NÃO' : ''}</td>
        <td>${item.obs || ''}</td>
      </tr>
    `
  )
  .join('');

const fotosItens = (eq.itens || [])
  .filter(
    (item) =>
      item.ativo !== false &&
      item.fotoBase64 &&
      item.fotoBase64.trim() !== ''
  )
  .map(
    (item) => `
      <div class="foto-item">
        <p><strong>${item.texto}</strong></p>

        <img
          class="foto"
          src="data:image/jpeg;base64,${item.fotoBase64}"
        />
      </div>
    `
  )
  .join('');

      return `
        <section class="equipamento">
          <h2>Equipamento ${eqIndex + 1}: ${eq.nome}</h2>
          <p><strong>Tipo:</strong> ${eq.tipo}</p>
          <p><strong>Descrição:</strong> ${eq.descricao || ''}</p>
          <p><strong>Modelo:</strong> ${eq.modelo || ''}</p>
          <p><strong>Série:</strong> ${eq.serie || ''}</p>
          ${fotoEquipamentoHtml}

          <h3>Checklist deste equipamento</h3>

          <table>
  <thead>
    <tr>
      <th>Item verificado</th>
      <th>OK</th>
      <th>Não</th>
      <th>Observação</th>
    </tr>
  </thead>

  <tbody>
    ${itemsHtml}
  </tbody>
</table>
          ${fotosItens ? `<h3>Fotos deste equipamento</h3><div class="fotos-container">${fotosItens}</div>` : ''}
        </section>
      `;
    }).join('');

    const assinaturaHtml = assinatura ? `<img class="assinatura" src="${assinatura}" />` : '<p>Sem assinatura registrada.</p>';

    const numeroEntrega = await gerarNumeroEntrega();

    const linkEntrega = `https://brsequipamentos.com.br/entrega/${numeroEntrega}`;

    const qrCodeBase64 = `https://quickchart.io/qr?text=${encodeURIComponent(linkEntrega)}&size=140`;

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
  font-family: Arial, sans-serif;
  padding: 0;
  zoom: 1;
  margin: 0;
  color: #111827;
  background: #ffffff;
}

.pagina {
  padding: 28px;
}

<div class="cabecalhoPremium">

  <div class="logoArea">
    <img
      class="logoPremium"
      src="data:image/png;base64,${logoBase64}"
    />
  </div>

  <div class="slogan">
    Soluções que geram produtividade no campo.
  </div>

  <div class="contatosPdf">

  <div class="linhaContato">
    <span class="iconeContato">📍</span>

    <div class="textoContato">
      Rua Ronald Tkotz, 3808<br/>
      Jardim Tarobá, Cambé - PR<br/>
      86192-171
    </div>
  </div>

  <div class="linhaDivisoria"></div>

  <div class="linhaContato">
    <span class="iconeContato">☎</span>

    <div class="textoContato">
      (43) 3316-6045
    </div>
  </div>

  <div class="linhaDivisoria"></div>

  <div class="linhaContato">
    <span class="iconeContato">✉</span>

    <div class="textoContato">
      fabio.ribeiro@brsequipamentos.com.br
    </div>
  </div>

</div>

    <div class="contatoItem">
      <span class="iconeContato">☎</span>
      <span>(43) 3316-6045</span>
    </div>

    <div class="contatoItem">
      <span class="iconeContato">✉</span>
      <span>fabio.ribeiro@brsequipamentos.com.br</span>
    </div>

  </div>

</div>

.semFotoBox {
  background: #f4f7fb;
  border: 1px dashed #b8c7da;
  border-radius: 12px;
  padding: 18px;
  margin: 14px 0 20px;
  text-align: center;
}

.semFoto {
  color: #6b7a90;
  font-style: italic;
  margin: 0;
}

.cabecalhoPremium{
  background:#ffffff;
  text-align:center;
  padding:0px 20px 4px 20px;
}

.logoArea{
  margin:0;
  padding:0;
}

<div class="faixaTitulo">

  <div class="tituloPremium">
    BRS Equipamentos Agrícolas
  </div>

  <div class="numeroEntregaPremium">
    Entrega Técnica Nº ${numeroEntrega}
  </div>

<div class="validacaoBox">
  Código de validação:
  <strong>${numeroEntrega}</strong>
</div>

<div class="linkValidacao">
  ${linkEntrega}
</div>

  <div class="subtituloPremium">
    Relatório de Entrega Técnica / Checklist de Equipamentos
  </div>

<div class="tecnicoResponsavel">
  Técnico responsável: ${usuario?.email || 'Não identificado'}
</div>

</div>

.dados {
  background: #f1f5f9;
  border-left: 5px solid #123c69;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

th {
  background: #123c69;
  color: white;
  padding: 10px;
  font- size: 13px;
  font-weight: 600;
}

td {
  border: 1px solid #d1d5db;
  padding: 8px;
  font-size: 12px;
}

.resumo{
  display:flex;
  justify-content:space-between;
  gap:12px;
  margin-top:14px;
  margin-bottom:18px;
}

.box{
  flex:1;
  background:linear-gradient(180deg,#ffffff 0%,#f1f5f9 100%);
  border:1px solid #d1d5db;
  border-radius:12px;
  padding:14px;
  text-align:center;
  box-shadow:0 2px 6px rgba(0,0,0,0.08);
}

.infoCliente {
  background: #f5f7fa;
  border: 1px solid #dbe3ea;
  border-radius: 10px;
  padding: 18px;
  margin-bottom: 25px;
}

.infoCliente h2 {
  color: #123c69;
  margin-bottom: 15px;
}

.infoCliente p {
  margin: 6px 0;
  font-size: 14px;
}

.numero{
  font-size:24px;
  font-weight:bold;
  color:#123c69;
  margin-bottom:6px;
}

.rodape{
  margin-top:20px;
  padding-top:12px;
  border-top:1px solid #d1d5db;
  text-align:center;
  font-size:10px;
  color:#64748b;
}

tr:nth-child(even) {
  background: #f8fafc;
}

.centro {
  text-align: center;
  font-weight: bold;
}

.ok {
  color: #15803d;
}

.nao {
  color: #b42318;
}

.fotoEquipamentoBox {
  margin: 14px 0 18px;
}

.fotoEquipamentoBox h3 {
  color: #123c69;
  margin-bottom: 10px;
}

.fotoEquipamentoPdf {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #dbe4ea;
}

.semFoto {
  color: #6b7a90;
  font-style: italic;
}

.foto {
  width: 170px;
  height: 125px;
  object-fit: cover;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  margin: 8px 8px 8px 0;
}

.fotos-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.foto-item {
  width: 180px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px;
  background: #f8fafc;
}

.assinatura {
  width: 320px;
  height: 120px;
  object-fit: contain;
  border: 1px solid #d1d5db;
  margin-top: 8px;
  border-radius: 8px;
}

.observacoes {
  margin-top: 22px;
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #d1d5db;
}

.rodape {
  margin-top: 28px;
  padding-top: 12px;
  border-top: 1px solid #d1d5db;
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

.equipamento {
  margin-bottom: 28px;
}

.semFoto {
  color: #64748b;
  font-style: italic;
}

.cabecalhoPremium{
  background:#ffffff;
  text-align:center;
  padding:8px 20px 14   px 20px;
}

.logoArea{
  margin:0;
  padding:0;
}

.logoPremium{
  width:270px;
  height:160px;
  object-fit:contain;
  display:block;
  margin:0 auto 2px auto;
}   

.slogan{
  font-size:15px;
  font-weight:600;
  color:#17325c;
  margin-top:-6px;
  margin-bottom:10px;
}

.iconeContato{
  margin-right:6px;
  font-size:15px;
}   

.faixaTitulo{
  background:linear-gradient(135deg,#052554 0%,#0b3d7a 100%);
  color:white;
  text-align:center;
  padding:24px 20px;
  border-bottom:5px solid #38b44a;
  margin-top: 8px;
}

.tituloPremium{
  font-size:28px;
  font-weight:bold;
  margin-bottom:14px;
}

.numeroEntregaPremium{
  display:inline-block;
  border:1.5px solid rgba(255,255,255,0.55);
  border-radius:12px;
  padding:10px 26px;
  font-size:21px;
  margin-bottom:14px;
}

.subtituloPremium{
  font-size:16px;
}

.tecnicoResponsavel{
  text-align:center;
  color:#dbeafe;
  font-size:12px;
  margin-top:8px;
}

.contatosPdf {
  width: 100%;
  max-width: 420px;
  margin: 18px auto 14px;
}

.linhaContato{
  margin-bottom:6px;
  font-size:14px;
}

.iconeContato {
  font-size: 18px;
  width: 28px;
  text-align: center;
}

.textoContato {
  color: #243b63;
  font-size: 16px;
  line-height: 1.5;
  vtext-align: left;
}

.linhaDivisoria {
  height: 1px;
  background: #d9e2ef;
  margin-left: 42px;
}

.validacaoBox{
  margin-top:10px;
  font-size:13px;
  color:#dbeafe;
  text-align:center;
}

.linkValidacao{
  margin-top:5px;
  font-size:11px;
  color:#93c5fd;
  text-align:center;
  word-break:break-all;
}

           </style>
           </head>
          
        <body>
        <div class="cabecalhoPremium">

  <div class="logoArea">
    <img class="logoPremium" src="data:image/jpeg;base64,${logoBase64}" />
  </div>

  <div class="slogan">Soluções que geram produtividade no campo.</div>

  <div class="contatosBRS">

    <div class="contatoItem">
      <span class="iconeContato">📍</span>
      <span>
        Rua Ronald Tkotz, 3808<br/>
        Jardim Tarobá, Cambé - PR<br/>
        86192-171
      </span>
    </div>

    <div class="contatoItem">
      <span class="iconeContato">☎</span>
      <span>(43) 3316-6045</span>
    </div>

    <div class="contatoItem">
      <span class="iconeContato">✉</span>
      <span>fabio.ribeiro@brsequipamentos.com.br</span>
    </div>

  </div>

</div>

<div class="faixaTitulo">

  <div class="tituloPremium">
    BRS Equipamentos Agrícolas
  </div>

  <div class="numeroEntregaPremium">
    Entrega Técnica Nº ${numeroEntrega}
  </div>

  <div class="validacaoBox">
  Código de validação:
  <strong>${numeroEntrega}</strong>
</div>

<div class="linkValidacao">
  ${linkEntrega}
</div>

  <div class="subtituloPremium">
    Relatório de Entrega Técnica / Checklist de Equipamentos
  </div>

</div>
        <div class="conteudo">    
        <div class="infoCliente">
         <h2>Dados do pedido e cliente</h2>
           <p><strong>Número do pedido:</strong> ${dados.numeroPedido || ''}</p>
           <p><strong>Cliente:</strong> ${dados.cliente || ''}</p>
           <p><strong>Endereço:</strong> ${dados.endereco || ''}</p>
           <p><strong>Cidade / Estado:</strong> ${dados.cidade || ''} / ${dados.estado || ''}</p>
           <p><strong>Telefone:</strong> ${dados.telefone || ''}</p>
           <p><strong>E-mail:</strong> ${dados.emailCliente || ''}</p>
           <p><strong>Responsável:</strong> ${dados.responsavel || ''}</p>
           <p><strong>Técnico responsável:</strong> ${dados.tecnico || ''}</p>
           <p><strong>Data:</strong> ${dados.data || ''}</p>
        </div>
           <h2>Equipamentos verificados</h2>
          ${equipamentosHtml}
        </div>

          <h2>Observações gerais</h2>
          <p>${dados.observacoes || 'Sem observações.'}</p>
          <h2>Assinatura do cliente / responsável</h2>
          ${assinaturaHtml}
    
}
          <h2>Resumo final da inspeção</h2>

<div class="resumo">
  <div class="box">
    <div class="numero">${resumo.ok}</div>
    <div>OK</div>
  </div>

  <div class="box">
    <div class="numero">${resumo.nao}</div>
    <div>Não</div>
  </div>

  <div class="box">
    <div class="numero">${resumo.pendentes}</div>
    <div>Pendentes</div>
  </div>
</div>

          <div class="rodape">Documento gerado pelo aplicativo de checklist técnico da BRS Equipamentos Agrícolas.</div>
        </body>
      </html>
    `;

    }

async function gerarPdf(enviarEmail = false) {
  if (!dados.cliente) {
    Alert.alert('Atenção', 'Preencha o nome do cliente antes de gerar o PDF.');
    return;
  }

  try {
    const asset = Asset.fromModule(LOGO_FIXO);
    await asset.downloadAsync();

    const logoUri = asset.localUri || asset.uri;

    const logoFile = new File(logoUri);
    const logoBase64 = await logoFile.base64();

    const equipamentosComFotosBase64 = await Promise.all(
      equipamentos.map(async (eq) => ({
        ...eq,
        fotoBase64: eq.foto ? await new File(eq.foto).base64() : null,
        itens: await Promise.all(
          eq.itens.map(async (item) => ({
            ...item,
            fotoBase64: item.foto ? await new File(item.foto).base64() : null,
          }))
        ),
      }))
    );

    const arquivo = await Print.printToFileAsync({
      html: await montarHtmlPdf(logoBase64, equipamentosComFotosBase64),
    });

    await salvarHistorico();

    if (enviarEmail) {
      const disponivel = await MailComposer.isAvailableAsync();

      if (!disponivel) {
        Alert.alert('E-mail indisponível', 'Configure um aplicativo de e-mail no celular.');
        return;
      }

      await MailComposer.composeAsync({
        recipients: dados.emailCliente ? [dados.emailCliente] : [],
        subject: `Entrega técnica - ${dados.cliente}`,
        body: `Olá, segue em anexo o relatório de entrega técnica da visita realizada em ${dados.data}.

Atenciosamente,
${dados.empresa || 'BRS Equipamentos Agrícolas'}`,
        attachments: [arquivo.uri],
      });
    } else {
      await Sharing.shareAsync(arquivo.uri);
    }
  } catch (error) {
    console.log(error);
    Alert.alert('Erro', 'Não foi possível gerar o PDF.');
  }
}

  function statusEquipamento(eq) {
  const itens = (eq.itens || []).filter((i) => i.ativo !== false);

  if (itens.length === 0) return 'nao_iniciado';

  const ok = itens.filter((i) => i.resposta === 'OK' || i.ok === true).length;
  const nao = itens.filter((i) => i.resposta === 'NAO' || i.nao === true).length;
  const pendentes = itens.filter(
    (i) => !i.resposta && i.ok !== true && i.nao !== true
  ).length;

  if (ok === 0 && nao === 0) return 'nao_iniciado';
  if (nao > 0 || pendentes > 0) return 'pendente';
  return 'concluido';
}

  function BotoesEquipamentos() {
    return (
      <View style={styles.abasEquipamentos}>
        {equipamentos.map((eq, index) => {
          const status = statusEquipamento(eq);

          const totalItens = eq.checklist?.length || 0;

const itensPreenchidos =
  eq.checklist?.filter((item) => item.status === 'ok' || item.status === 'nao')
    .length || 0;

const corFundo =
  status === 'nao_iniciado'
    ? '#dc2626'
    : status === 'pendente'
    ? '#f59e0b'
    : '#16a34a';

const corTexto =
  status === 'pendente'
    ? '#111827'
    : '#ffffff';

console.log('STATUS EQUIPAMENTO:', eq.nome, status);

          console.log('STATUS EQUIPAMENTO:', eq.nome, status);

          return (
          <TouchableOpacity
            key={`${eq.nome}-${index}`}
            style={[
  styles.abaEquipamento,
  { backgroundColor: corFundo },
  equipamentoAtual === index ? styles.abaAtiva : null,
]}
            onPress={() => selecionarEquipamentoVisita(index)}
          >
            <Text
  style={[
    styles.abaTexto,
    { color: corTexto },
    equipamentoAtual === index ? styles.abaTextoAtivo : null,
  ]}
>
              {index + 1}. {eq.nome || 'Equipamento'} ({itensPreenchidos}/{totalItens})
            </Text>
          </TouchableOpacity>
        );
        })}
      </View>
    );
  }

async function selecionarEquipamentoVisita(index) {
  const equipamentoSelecionado = equipamentos[index];

  console.log(
  'OBJETO COMPLETO:',
  JSON.stringify(equipamentoSelecionado, null, 2)
);

  setEquipamentoAtual(index);

  const tag =
  equipamentoSelecionado.tag ||
  equipamentoSelecionado.TAG ||
  equipamentoSelecionado.codigo_tag ||
  equipamentoSelecionado.tag_equipamento ||
  equipamentoSelecionado.descritivo?.split('-')[0] ||
  equipamentoSelecionado.modelo?.split('-')[0];

console.log('EQUIPAMENTO:', equipamentoSelecionado);
console.log('TAG:', tag);

if (!tag) {
  Alert.alert(
    'Checklist não encontrado',
    'Este equipamento não possui TAG cadastrada.'
  );
  return;
}

  const checklistOnline = await carregarChecklistDoSupabase(
  tag.trim()
);

  if (!checklistOnline || checklistOnline.length === 0) {
    Alert.alert(
      'Checklist não encontrado',
      `Nenhum checklist encontrado para a TAG ${equipamentoSelecionado.tag}.`
    );
    return;
  }

  setEquipamentos((atual) => {
    const novo = [...atual];

    novo[index] = {
      ...novo[index],
      itens: checklistOnline,
    };

    return novo;
  });

  Alert.alert(
    'Checklist carregado',
    `${checklistOnline.length} itens carregados para ${equipamentoSelecionado.nome}.`
  );
}

const historicoFiltrado = historico.filter((visita) => {
  const texto = buscaHistorico.toLowerCase();

  return (
    visita.cliente?.toLowerCase().includes(texto) ||
    visita.cidade?.toLowerCase().includes(texto) ||
    visita.tecnico?.toLowerCase().includes(texto)
  );
});

  if (tela === 'historico') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.titulo}>Histórico de Visitas</Text>
            <Text style={styles.subtitulo}>Entregas técnicas salvas no celular</Text>
          </View>

          <TouchableOpacity style={styles.botaoConfig} onPress={() => setTela('visita')}>
            <Text style={styles.botaoConfigTexto}>Voltar para a visita</Text>
          </TouchableOpacity>

          <TextInput
  style={styles.inputBusca}
  placeholder="Buscar cliente, cidade ou técnico..."
  value={buscaHistorico}
  onChangeText={setBuscaHistorico}
/>

          <Secao titulo="Visitas salvas">
            {historico.length === 0 ? (
              <Text style={styles.semFoto}>Nenhuma visita salva ainda. Gere um PDF para salvar uma visita no histórico.</Text>
            ) : (
              historicoFiltrado.map((visita) => (
                <View key={visita.id} style={styles.historicoCard}>
                  <Text style={styles.historicoEntrega}>
  Entrega: {visita.numero_entrega || visita.numero_os || 'Sem número'}
</Text>

<Text style={styles.historicoPedido}>
  Pedido: #{visita.numero_pedido || '-'}
</Text>

<Text style={styles.historicoTitulo}>
  {visita.cliente || 'Cliente não informado'}
</Text>

<Text style={styles.infoTexto}>
  Cidade: {visita.cidade || '-'}
</Text>

<Text style={styles.infoTexto}>
  Data: {visita.data_visita || visita.data || '-'}
</Text>

<Text style={styles.infoTexto}>
  Técnico: {visita.tecnico || '-'}
</Text>

<View style={styles.statusHistoricoContainer}>
  <Text style={styles.statusHistorico}>
    {visita.total_pendentes === 0
      ? '🟢 Finalizado'
      : '🟡 Em andamento'}
  </Text>
</View>

<Text style={styles.resumoHistorico}>
  OK: {visita.total_ok || 0} | Não: {visita.total_nao || 0} | Pendentes: {visita.total_pendentes || 0}
</Text>

<Text style={styles.infoTexto}>
  Equipamentos: {visita.equipamentos?.length || 0}
</Text>

<TouchableOpacity
  style={styles.botaoPrincipal}
  onPress={() => continuarVisita(visita)}
>
  <Text style={styles.botaoPrincipalTexto}>
    Continuar visita
  </Text>
</TouchableOpacity>

                </View>
              ))
            )}
          </Secao>

          <TouchableOpacity style={styles.botaoRemoverGrande} onPress={limparHistorico}>
            <Text style={styles.botaoRemoverTexto}>Limpar histórico deste celular</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

if (!usuario) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
      }}>

        <Image
          source={LOGO_FIXO}
          style={{
            width: 180,
            height: 100,
            resizeMode: 'contain',
            alignSelf: 'center',
            marginBottom: 30,
          }}
        />

        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#123c69',
          marginBottom: 30,
        }}>
          Login Técnico
        </Text>

        <TextInput
          placeholder="E-mail do técnico"
          placeholderTextColor="#9CA3AF"
          value={emailLogin}
          onChangeText={setEmailLogin}
          autoCapitalize="none"
          utoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            backgroundColor: '#fff',
          }}
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor="#9CA3AF"
          value={senhaLogin}
          onChangeText={setSenhaLogin}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
            backgroundColor: '#fff',
            color: '#000',
          }}
        />

        <TouchableOpacity
          onPress={fazerLogin}
          style={{
            backgroundColor: '#123c69',
            padding: 16,
            borderRadius: 12,
          }}
        >
          <Text style={{
            color: '#fff',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: 16,
          }}>
            Entrar
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

  if (tela === 'pedido') {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image source={LOGO_FIXO} style={styles.logo} />

          <Text style={styles.titulo}>
            Buscar Pedido BRS
          </Text>

          <Text style={styles.subtitulo}>
            Digite o número do pedido para iniciar a entrega técnica
          </Text>
        </View>

        <View style={styles.card}>
  <Text style={styles.subtitulo}>Pedidos disponíveis</Text>

  <ScrollView
  style={{ maxHeight: 300 }}
  nestedScrollEnabled={true}
  showsVerticalScrollIndicator={true}
>
  {listaPedidos.map((pedido) => (
    <TouchableOpacity
      key={pedido.id}
      style={styles.cardPedido}
      onPress={() => {
        setNumeroPedido(String(pedido.numero_pedido));
      }}
    >
      <Text style={styles.tituloPedido}>
        Pedido #{pedido.numero_pedido}
      </Text>

      <Text style={styles.clientePedido}>
        {pedido.cliente || 'Cliente não informado'}
      </Text>

      <Text
  style={[
    styles.statusPedido,
    {
      color:
        pedido.finalizado
          ? '#22c55e'
          : pedido.status === 'em_andamento'
          ? '#eab308'
          : '#ff9800',
    },
  ]}
>
  • {pedido.finalizado ? 'finalizado' : pedido.status || 'pendente'}
</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
     </View>

     <TextInput
  style={styles.input}
  placeholder="Número do pedido"
  value={numeroPedido}
  onChangeText={setNumeroPedido}
/>

<TouchableOpacity
  style={styles.botaoPrincipal}
  onPress={() => buscarPedido()}
>
  <Text style={styles.botaoPrincipalTexto}>
    {buscandoPedido ? 'Buscando...' : 'Buscar pedido'}
  </Text>
</TouchableOpacity>

         <CardPedido
  pedido={pedidoEncontrado}
  equipamentos={equipamentos}
  styles={styles}
  onIniciar={() => setTela('visita')}
  onAbrirMaps={() => abrirMaps(pedidoEncontrado)}
/>
      </ScrollView>
    </SafeAreaView>
  );
}

  if (tela === 'banco') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image source={LOGO_FIXO} style={styles.logo} />
            <Text style={styles.titulo}>Banco de Checklists BRS</Text>
            <Text style={styles.subtitulo}>Modelos inteligentes por tipo de equipamento</Text>
          </View>

          <TouchableOpacity style={styles.botaoConfig} onPress={() => setTela('visita')}>
            <Text style={styles.botaoConfigTexto}>Voltar para a visita</Text>
          </TouchableOpacity>

          <Secao titulo="Tipos de equipamentos cadastrados">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tiposContainer}>
                {Object.keys(modelos).map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.tipoBotao, tipoBanco === tipo ? styles.tipoBotaoAtivo : null]}
                    onPress={() => setTipoBanco(tipo)}
                  >
                    <Text style={[styles.tipoBotaoTexto, tipoBanco === tipo ? styles.tipoBotaoTextoAtivo : null]}>{tipo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Campo label="Criar novo tipo de equipamento" value={novoTipo} onChangeText={setNovoTipo} />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarTipoBanco}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar tipo ao banco</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoRemoverGrande} onPress={removerTipoBanco}>
              <Text style={styles.botaoRemoverTexto}>Remover tipo selecionado</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo={`Itens padrão: ${tipoBanco}`}>
            <Campo label="Novo item padrão" value={novoItemBanco} onChangeText={setNovoItemBanco} />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarItemBanco}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar item padrão</Text>
            </TouchableOpacity>

            {(modelos[tipoBanco] || []).map((item, index) => (
              <View key={`${item}-${index}`} style={styles.configItem}>
                {editandoBancoIndex === index ? (
                  <>
                    <TextInput style={styles.input} value={textoEditandoBanco} onChangeText={setTextoEditandoBanco} />
                    <TouchableOpacity style={styles.botaoOkPequeno} onPress={salvarEdicaoBanco}>
                      <Text style={styles.botaoPequenoTexto}>Salvar alteração</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.itemTexto}>{item}</Text>
                    <View style={styles.botoesLinha}>
                      <TouchableOpacity style={styles.botaoEditar} onPress={() => { setEditandoBancoIndex(index); setTextoEditandoBanco(item); }}>
                        <Text style={styles.botaoEditarTexto}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.botaoRemover} onPress={() => removerItemBanco(index)}>
                        <Text style={styles.botaoRemoverTexto}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))}
          </Secao>

          <TouchableOpacity style={styles.botaoSecundario} onPress={restaurarBancoInicial}>
            <Text style={styles.botaoSecundarioTexto}>Restaurar banco inicial da BRS</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
          styles.container,
           { paddingBottom: 110 }
  ]}
>

<View style={styles.dashboardGrid}>

  <View style={styles.dashboardCard}>
    <Text style={styles.dashboardNumero}>
      {indicadoresVisitaAtual.visitas}
    </Text>

    <Text style={styles.dashboardTexto}>
      Visitas
    </Text>
  </View>

  <View style={styles.dashboardCard}>
    <Text style={styles.dashboardNumero}>
      {indicadoresVisitaAtual.equipamentos}
    </Text>

    <Text style={styles.dashboardTexto}>
      Equipamentos
    </Text>

  </View>
  <View style={styles.dashboardCardAlerta}>
  <Text style={styles.dashboardNumero}>
    {indicadoresVisitaAtual.pendentes}
  </Text>

  <Text style={styles.dashboardTexto}>
    Itens pendentes
  </Text>
</View>

<View style={styles.dashboardCardErro}>
  <Text style={styles.dashboardNumero}>
    {indicadoresVisitaAtual.nao}
  </Text>

  <Text style={styles.dashboardTexto}>
    Não conformidades
  </Text>
</View>

<View style={styles.linhaUltimoAtendimento}>

<View style={styles.infoUltimo}>
  <Ionicons
  name="calendar-outline"
  size={26}
  color="#c0392b"
/>

  <Text style={styles.ultimoAtendimentoTitulo}>
    Último atendimento
  </Text>

  <Text style={styles.ultimoAtendimentoTexto}>
    {ultimoAtendimentoCliente}
  </Text>
</View>

<View style={styles.divisorVertical} />

<TouchableOpacity
  onPress={() => {
    setPedidoEncontrado(null);
    setEquipamentos([]);
    setTela('pedido');
  }}
  style={styles.botaoSairMini}
>
  <Text style={styles.botaoSairMiniTexto}>
    Voltar
  </Text>
</TouchableOpacity>

</View> 

</View>

          <View style={styles.headerEntregaNovo}>

  <View style={styles.headerTopoEntrega}>
    <Image source={LOGO_FIXO} style={styles.logoEntregaNovo} />

    <View style={styles.headerInfoEntrega}>
      <Text style={styles.tituloEntregaNovo}>
        {dados.empresa}
      </Text>

      <Text style={styles.subtituloEntregaNovo}>
        Entrega técnica industrial
      </Text>
    </View>
  </View>

  <View style={styles.cardStatusEntrega}>
    <Text style={styles.statusEntregaLabel}>
      VISITA EM ANDAMENTO
    </Text>

    <Text style={styles.statusEntregaQtd}>
      {equipamentos.length} equipamento(s)
    </Text>
  </View>

</View>

          <TouchableOpacity
  style={styles.botaoHistorico}
  onPress={() => {
    carregarHistorico();
    setTela('historico');
  }}
>
            <Text style={styles.botaoFinalizarTexto}>Abrir Histórico de Visitas</Text>
          </TouchableOpacity>

          <View style={styles.cardResumo}>
            <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.ok}</Text><Text style={styles.resumoTexto}>OK</Text></View>
            <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.nao}</Text><Text style={styles.resumoTexto}>Não</Text></View>
            <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.pendentes}</Text><Text style={styles.resumoTexto}>Pendentes</Text></View>
          </View>

          <Secao titulo="Dados do cliente e da visita">
            <View style={styles.pickerContainer}>

  <Picker
    selectedValue={clienteSelecionado}
    onValueChange={(itemValue) => {

      setClienteSelecionado(itemValue);

      const clienteEscolhido = listaClientes.find(
        (c) => c.id === itemValue
      );

      if (clienteEscolhido) {

        atualizarCampo('cliente', clienteEscolhido.nome);
        atualizarCampo('cidade', clienteEscolhido.cidade || '');
        atualizarCampo('emailCliente', clienteEscolhido.email || '');
        

      }
    }}
  >

    <Picker.Item
      label="Selecione um cliente"
      value={null}
    />

    {clientesUnicos.map((item) => (
      <Picker.Item
        key={item.id}
        label={item.nome}
        value={item.id}
      />
    ))}
  </Picker>

</View>
            <Campo label="Cliente" value={dados.cliente} onChangeText={(v) => atualizarCampo('cliente', v)} />
            <Campo label="Endereço" value={dados.endereco} onChangeText={(v) => atualizarCampo('endereco', v)} />
            <Campo label="Cidade" value={dados.cidade} onChangeText={(v) => atualizarCampo('cidade', v)} />
            <Campo label="Estado" value={dados.estado} onChangeText={(v) => atualizarCampo('estado', v)} />
            <Campo label="Telefone" value={dados.telefone} onChangeText={(v) => atualizarCampo('telefone', v)} />
            <Campo label="E-mail do cliente" value={dados.emailCliente} onChangeText={(v) => atualizarCampo('emailCliente', v)} />
            <Campo label="Responsável" value={dados.responsavel} onChangeText={(v) => atualizarCampo('responsavel', v)} />
            <Campo label="Técnico responsável" value={dados.tecnico} onChangeText={(v) => atualizarCampo('tecnico', v)} />
            <Campo label="Data" value={dados.data} onChangeText={(v) => atualizarCampo('data', v)} />
          </Secao>

          <Secao titulo="Equipamentos desta visita">
            <BotoesEquipamentos />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarEquipamento}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar outro equipamento</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo="Dados do equipamento selecionado">

            <Campo label="Nome do equipamento" value={equipamento.nome} onChangeText={(v) => atualizarEquipamento('nome', v)} />
            <Campo label="Modelo" value={equipamento.modelo} onChangeText={(v) => atualizarEquipamento('modelo', v)} />
            <Campo label="Número de série" value={equipamento.serie} onChangeText={(v) => atualizarEquipamento('serie', v)} />
            <Campo label="Descritivo" value={equipamento.descritivo} onChangeText={(v) => atualizarEquipamento('descritivo', v)} />

            <TouchableOpacity style={styles.botaoFoto} onPress={escolherFotoEquipamento}>
              <Text style={styles.botaoFotoTexto}>{equipamento.foto ? 'Trocar foto do equipamento' : 'Adicionar foto do equipamento'}</Text>
            </TouchableOpacity>
            {equipamento.foto ? <Image source={{ uri: equipamento.foto }} style={styles.fotoPreview} /> : <Text style={styles.semFoto}>Sem foto deste equipamento</Text>}

            <TouchableOpacity style={styles.botaoRemoverGrande} onPress={removerEquipamento}>
              <Text style={styles.botaoRemoverTexto}>Remover este equipamento</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo="Adicionar item somente nesta visita">
            <Campo label="Novo item da visita" value={novoItemVisita} onChangeText={setNovoItemVisita} />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarItemVisita}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar item ao equipamento</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo="Checklist do equipamento selecionado">
           {(equipamento.itens || []).map((item, index) => {             
              if (!item.ativo) return null;
              return (
                <View
  key={`${item.texto}-${index}`}
  style={[
    styles.itemBox,
    item.resposta === 'NAO' ? styles.itemBoxNao : null,
  ]}
>
                  {editandoItemVisita === index ? (
                    <>
                      <TextInput style={styles.input} value={textoEditandoVisita} onChangeText={setTextoEditandoVisita} />
                      <TouchableOpacity style={styles.botaoOkPequeno} onPress={salvarEdicaoItemVisita}>
                        <Text style={styles.botaoPequenoTexto}>Salvar alteração</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>

{(
  index === 0 ||
  ((equipamento.itens[index - 1] && equipamento.itens[index - 1].categoria
    ? equipamento.itens[index - 1].categoria.trim()
    : 'GERAL') !==
    (item.categoria ? item.categoria.trim() : 'GERAL'))
) ? (
  <Text style={styles.categoriaTitulo}>
  {item.categoria ? item.categoria.trim() : 'GERAL'}
</Text>
) : null}

<Text style={styles.itemTexto}>
  {item.texto}
</Text>

                      <View style={styles.botoesLinha}>
                        <BotaoOpcao texto="OK" ativo={item.resposta === 'OK'} tipo="ok" onPress={() => alterarItemVisita(index, { resposta: 'OK' })} />
                        <BotaoOpcao texto="Não" ativo={item.resposta === 'NAO'} tipo="nao" onPress={() => alterarItemVisita(index, { resposta: 'NAO' })} />
                      </View>
                      <TextInput style={styles.obsItem} placeholder="Observação deste item" placeholderTextColor="#666" value={item.obs} onChangeText={(v) => alterarItemVisita(index, { obs: v })} />
                      <TouchableOpacity style={styles.botaoFotoItem} onPress={() => adicionarFotoItem(index)}>
                        <Text style={styles.botaoFotoItemTexto}>{item.foto ? 'Trocar foto deste item' : 'Adicionar foto deste item'}</Text>
                      </TouchableOpacity>
                      {item.foto ? <Image source={{ uri: item.foto }} style={styles.fotoItem} /> : null}
                      <View style={styles.botoesLinhaInferior}>
                        <TouchableOpacity style={styles.botaoEditar} onPress={() => { setEditandoItemVisita(index); setTextoEditandoVisita(item.texto); }}>
                          <Text style={styles.botaoEditarTexto}>Editar item</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.botaoRemover} onPress={() => removerItemVisita(index)}>
                          <Text style={styles.botaoRemoverTexto}>Remover item</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </Secao>

          <Secao titulo="Observações gerais da visita">
            <TextInput style={styles.textArea} placeholder="Digite observações gerais da visita." value={dados.observacoes} onChangeText={(v) => atualizarCampo('observacoes', v)} multiline />
          </Secao>

          <Secao titulo="Assinatura do cliente / responsável">
            {assinatura ? <Image source={{ uri: assinatura }} style={styles.assinaturaPreview} /> : <Text style={styles.semFoto}>Nenhuma assinatura registrada</Text>}
            <TouchableOpacity style={styles.botaoFinalizar} onPress={() => setAssinaturaAberta(true)}>
              <Text style={styles.botaoFinalizarTexto}>{assinatura ? 'Refazer assinatura' : 'Abrir tela de assinatura'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoSecundario} onPress={limparAssinatura}>
              <Text style={styles.botaoSecundarioTexto}>Limpar assinatura</Text>
            </TouchableOpacity>
          </Secao>

          <TouchableOpacity style={styles.botaoFinalizar} onPress={finalizarChecklist}>

            <Text style={styles.botaoFinalizarTexto}>Finalizar checklist</Text>
          </TouchableOpacity> 

          <TouchableOpacity style={styles.botaoPdf} onPress={() => gerarPdf(false)}>
            <Text style={styles.botaoFinalizarTexto}>Gerar PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoEmail} onPress={() => gerarPdf(true)}>
            <Text style={styles.botaoFinalizarTexto}>Enviar PDF por e-mail</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={assinaturaAberta} animationType="slide">
          <SafeAreaView style={styles.modalAssinatura}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo}>Assinatura do cliente</Text>
              <TouchableOpacity style={styles.botaoFechar} onPress={() => setAssinaturaAberta(false)}>
                <Text style={styles.botaoFecharTexto}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.assinaturaTelaCheia}>
              <SignatureScreen
                ref={assinaturaRef}
                onOK={salvarAssinatura}
                onEmpty={() => Alert.alert('Assinatura vazia', 'Assine antes de salvar.')}
                descriptionText="Assine dentro do quadro"
                clearText=""
                confirmText=""
                webStyle={`.m-signature-pad { box-shadow: none; border: none; height: 100%; } .m-signature-pad--body { border: 2px solid #123c69; border-radius: 12px; top: 0; bottom: 0; } .m-signature-pad--footer { display: none; } body,html { background-color: #fff; width: 100%; height: 100%; }`}
              />
            </View>

            <View style={styles.botoesAssinaturaModal}>
              <TouchableOpacity style={styles.botaoLimparAssinatura} onPress={() => assinaturaRef.current?.clearSignature()}>
                <Text style={styles.botaoFinalizarTexto}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvarAssinatura} onPress={confirmarAssinatura}>
                <Text style={styles.botaoFinalizarTexto}>Salvar assinatura</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Secao({ titulo, children }) {
  return <View style={styles.card}><Text style={styles.secaoTitulo}>{titulo}</Text>{children}</View>;
}

function Campo({ label, value, onChangeText }) {
  return (
    <View style={styles.campoBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={label} />
    </View>
  );
}

function BotaoOpcao({ texto, ativo, tipo, onPress }) {
  const estiloAtivo =
    tipo === 'ok'
      ? styles.botaoOkAtivo
      : styles.botaoNaoAtivo;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.botaoOpcao, ativo ? estiloAtivo : null]}
    >
      <Text
        style={[
          styles.botaoOpcaoTexto,
          ativo ? styles.botaoOpcaoTextoAtivo : null,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  headerEntregaNovo: {
  backgroundColor: '#ffffff',
  borderRadius: 22,
  padding: 20,
  marginBottom: 18,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 4,
  },
  elevation: 4,
},

headerTopoEntrega: {
  flexDirection: 'row',
  alignItems: 'center',
},

logoEntregaNovo: {
  width: 72,
  height: 72,
  resizeMode: 'contain',
},

headerInfoEntrega: {
  marginLeft: 14,
  flex: 1,
},

tituloEntregaNovo: {
  fontSize: 22,
  fontWeight: '900',
  color: '#123c69',
},

subtituloEntregaNovo: {
  fontSize: 14,
  color: '#64748b',
  marginTop: 4,
},

cardStatusEntrega: {
  marginTop: 18,
  backgroundColor: '#eff6ff',
  borderRadius: 16,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderWidth: 1,
  borderColor: '#bfdbfe',
},

statusEntregaLabel: {
  fontSize: 12,
  fontWeight: '800',
  color: '#1d4ed8',
  marginBottom: 4,
},

statusEntregaQtd: {
  fontSize: 18,
  fontWeight: '900',
  color: '#123c69',
},

  dashboardGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: 16,
},  

categoriaTituloTexto: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  textTransform: 'uppercase',
},

itemBoxNao: {
  borderColor: '#b42318',
  borderWidth: 2,
  backgroundColor: '#fff5f5',
},

botaoOkAtivo: {
  backgroundColor: '#1f7a4d',
  borderColor: '#1f7a4d',
},

botaoNaoAtivo: {
  backgroundColor: '#b42318',
  borderColor: '#b42318',
},

categoriaTitulo: {
  backgroundColor: '#1f3f6d',
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginTop: 12,
  marginBottom: 8,
  textTransform: 'uppercase',
},

cardPedido: {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#d9e2ef',
},

tituloPedido: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#1f3f68',
},

clientePedido: {
  fontSize: 13,
  color: '#333',
  marginTop: 4,
},

statusPedido: {
  fontSize: 12,
  color: '#f59e0b',
  marginTop: 4,
  fontWeight: 'bold',
},

inputBusca: {
  backgroundColor: '#fff',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginBottom: 18,
  borderWidth: 1,
  borderColor: '#dbe4ea',
  fontSize: 15,
},

 divisorVertical: {
  width: 1,
  height: 70,
  backgroundColor: '#dbe4ea',
  marginHorizontal: 18,
},

linhaUltimoAtendimento: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 18,
  marginBottom: 18,
  borderWidth: 1,
  borderColor: '#dbe4ea',
  minHeight: 95,
  width: '100%',
},

infoUltimo: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

botaoSairMini: {
  backgroundColor: '#c62828',
  paddingHorizontal: 22,
  paddingVertical: 14,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: 90,
},

botaoSairMiniTexto: {
  color: '#fff',
  fontWeight: 'bold',
},

dashboardCardAlerta: {
  backgroundColor: '#f59e0b',
  width: '48%',
  borderRadius: 14,
  padding: 16,
  alignItems: 'center',
},

dashboardCardErro: {
  backgroundColor: '#b42318',
  width: '48%',
  borderRadius: 14,
  padding: 16,
  alignItems: 'center',
},

ultimoAtendimentoCard: {
  backgroundColor: '#fff',
  width: '48%',
  minHeight: 90,
  borderRadius: 14,
  padding: 16,
  marginBottom: 18,
  borderWidth: 1,
  borderColor: '#dbe4ea',
  alignItems: 'center',
  justifyContent: 'center',
},

ultimoAtendimentoIcone: {
  fontSize: 22,
  marginBottom: 4,
},

ultimoAtendimentoTitulo: {
  fontSize: 12,
  color: '#64748b',
  fontWeight: '800',
  textAlign: 'center',
},

ultimoAtendimentoTexto: {
  fontSize: 18,
  color: '#123c69',
  fontWeight: '900',
  textAlign: 'center',
},

dashboardCard: {
  backgroundColor: '#1f3f70',
  width: '48%',
  borderRadius: 14,
  padding: 16,
  alignItems: 'center',
  marginBottom: 10,
},

dashboardNumero: {
  color: '#fff',
  fontSize: 28,
  fontWeight: '900',
},

dashboardTexto: {
  color: '#dbeafe',
  marginTop: 6,
  fontWeight: '700',
},

logoPdf: {
  width: 280,
  height: 180,
  resizeMode: 'contain',
  alignSelf: 'center',
  marginBottom: 10,
},

  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#eef2f7' },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe4ea',
    elevation: 4,
},
    
pickerContainer: {
  backgroundColor: '#fff',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#dbe4ea',
  marginBottom: 16,
  overflow: 'hidden',
},

abaNaoIniciado: {
  backgroundColor: '#dc2626',
},

abaPendente: {
  backgroundColor: '#fef3c7',
},

abaConcluido: {
  backgroundColor: '#dcfce7',
},

abaTextoNaoIniciado: {
  color: '#fff',
},

  logo: { width: 140, height: 60, resizeMode: 'contain', marginBottom: 10 },
  titulo: { fontSize: 25, color: '#14532d', fontWeight: '900', textAlign: 'center' },
  subtitulo: { fontSize: 16, color: '#334155', marginTop: 6, textAlign: 'center', fontWeight: '700' },
  equipamento: { fontSize: 14, color: '#475569', marginTop: 8, textAlign: 'center', fontWeight: '600' },
  botaoConfig: { backgroundColor: '#f59e0b', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 14 },
  botaoConfigTexto: { color: '#111827', fontWeight: '900' },
  botaoHistorico: { backgroundColor: '#334155', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 14 },
  cardResumo: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 14, elevation: 2 },
  resumoBox: { flex: 1, alignItems: 'center' },
  resumoNumero: { fontSize: 24, fontWeight: '900', color: '#123c69' },
  resumoTexto: { fontSize: 12, color: '#586273', marginTop: 3 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, elevation: 2 },
  secaoTitulo: { fontSize: 18, fontWeight: '900', color: '#123c69', marginBottom: 12 },
  campoBox: { marginBottom: 10 },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 5, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: '#f9fafb' },
  abasEquipamentos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  abaEquipamento: { backgroundColor: '#e5e7eb', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  abaAtiva: { borderWidth: 2, borderColor: '#123c69' },
  abaTexto: { color: '#111827', fontWeight: '800' },
  abaTextoAtivo: { color: '#fff' },
  tiposContainer: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  tipoBotao: { backgroundColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 8 },
  tipoBotaoAtivo: { backgroundColor: '#14532d' },
  tipoBotaoTexto: { color: '#1e293b', fontWeight: '800' },
  tipoBotaoTextoAtivo: { color: '#fff' },
  botaoPrincipal: { backgroundColor: '#123c69', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10 },
  botaoPrincipalTexto: { color: '#fff', fontWeight: '900' },
  configItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
  itemBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
  itemTexto: { fontSize: 15, color: '#111827', fontWeight: '800', marginBottom: 10 },
  historicoCard: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 14, padding: 12, marginBottom: 12, backgroundColor: '#f8fafc' },
  historicoTitulo: { fontSize: 17, fontWeight: '900', color: '#14532d', marginBottom: 8 },
  historicoEquipamento: { color: '#334155', fontWeight: '700', marginTop: 4 },
  botoesLinha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  botoesLinhaInferior: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  botaoOpcao: { flex: 1, minWidth: 90, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: '#fff' },
  botaoOkAtivo: { backgroundColor: '#12805c', borderColor: '#12805c' },
  botaoNaoAtivo: { backgroundColor: '#b42318', borderColor: '#b42318' },
  botaoOpcaoTexto: { fontWeight: '900', color: '#334155' },
  botaoOpcaoTextoAtivo: { color: '#fff' },
  botaoEditar: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  botaoEditarTexto: { color: '#fff', fontWeight: '900' },
  botaoRemover: { backgroundColor: '#b42318', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  botaoRemoverGrande: { backgroundColor: '#b42318', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  botaoRemoverTexto: { color: '#fff', fontWeight: '900' },
  botaoOkPequeno: { backgroundColor: '#12805c', borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'center' },
  botaoPequenoTexto: { color: '#fff', fontWeight: '900' },
  obsItem: { marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 9, backgroundColor: '#fff' },
  botaoFoto: { backgroundColor: '#123c69', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  botaoFotoTexto: { color: '#fff', fontWeight: '900' },
  botaoFotoItem: { backgroundColor: '#0f766e', borderRadius: 10, padding: 11, alignItems: 'center', marginTop: 10 },
  botaoFotoItemTexto: { color: '#fff', fontWeight: '900' },
  fotoPreview: { width: '100%', height: 190, borderRadius: 12, marginTop: 12, backgroundColor: '#e5e7eb' },
  fotoItem: { width: '100%', height: 180, borderRadius: 12, marginTop: 10, backgroundColor: '#e5e7eb' },
  semFoto: { marginTop: 10, color: '#6b7280', fontStyle: 'italic' },
  textArea: { minHeight: 120, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: '#f9fafb', textAlignVertical: 'top' },
  assinaturaPreview: { width: '100%', height: 150, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#fff', resizeMode: 'contain' },
  modalAssinatura: { flex: 1, backgroundColor: '#eef2f7', paddingHorizontal: 14, paddingBottom: 14, paddingTop: 45, },
  modalTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitulo: { fontSize: 22, fontWeight: '900', color: '#123c69' },
  botaoFechar: { backgroundColor: '#b42318', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  botaoFecharTexto: { color: '#fff', fontWeight: '900' },
  assinaturaTelaCheia: { flex: 1, marginTop: 35, paddingTop: 15, minHeight: 430, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db' },
  botoesAssinaturaModal: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 },
  botaoLimparAssinatura: { flex: 1, backgroundColor: '#64748b', borderRadius: 14, padding: 16, alignItems: 'center' },
  botaoSalvarAssinatura: { flex: 2, backgroundColor: '#12805c', borderRadius: 14, padding: 16, alignItems: 'center' },
  botaoSecundario: { marginTop: 10, borderWidth: 1, borderColor: '#123c69', borderRadius: 10, padding: 12, alignItems: 'center' },
  botaoSecundarioTexto: { color: '#123c69', fontWeight: '900' },
  botaoFinalizar: { backgroundColor: '#123c69', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 4 },
  botaoPdf: { backgroundColor: '#14532d', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  botaoEmail: { backgroundColor: '#2563eb', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  botaoFinalizarTexto: { color: '#fff', fontSize: 17, fontWeight: '900' },

cardResumoPedido: {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  padding: 18,
  marginTop: 16,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: '#d9e2ec',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 4,
},

resumoPedidoTitulo: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#0b1f3a',
  marginBottom: 12,
},

resumoPedidoLinha: {
  fontSize: 16,
  color: '#1f2933',
  marginBottom: 8,
  fontWeight: '600',
},

botaoMaps: {
  backgroundColor: '#eaf2ff',
  borderWidth: 1,
  borderColor: '#1f3f6d',
  borderRadius: 10,
  paddingVertical: 16,
  marginTop: 16,
  alignItems: 'center',
},

botaoMapsTexto: {
  color: '#1f3f6d',
  fontSize: 15,
  fontWeight: 'bold',
},
  
});