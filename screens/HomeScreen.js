import QRCode from 'qrcode';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Linking, } from 'react-native';
import { supabase } from '../supabase';
import { obterEmpresaAtual, obterTecnicoAtualId, obterPapelAtual, usuarioPodeGerenciar } from '../utils/sessaoOperacional';

import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HomeScreenProvider } from './home/HomeScreenContext';
import { styles } from './home/homeScreenStyles';
import { MODELOS_INICIAIS } from '../data/modelosChecklistIniciais';
import { gerarPdfVisita } from '../services/relatorioVisitaPdf';
import { enviarMidiasVisita } from '../services/campoMidiaService';
import { capturarLocalizacaoCampo } from '../services/campoLocalizacaoService';
import HistoricoVisitasView from './home/HistoricoVisitasView';
import LoginTecnicoView from './home/LoginTecnicoView';
import PedidosView from './home/PedidosView';
import DetalhePedidoView from './home/DetalhePedidoView';
import BancoChecklistView from './home/BancoChecklistView';
import VisitaTecnicaView from './home/VisitaTecnicaView';
//import CardPedido from '../components/CardPedido';

const LOGO_FIXO = require('../assets/fieldcheck-icon.png');
const STORAGE_MODELOS = '@fieldcheck_modelos_checklist';
const STORAGE_VISITAS = '@fieldcheck_historico_servicos';
const STORAGE_PEDIDOS_CACHE = '@fieldcheck_cache_pedidos';
const STORAGE_PEDIDO_DETALHE_CACHE = '@fieldcheck_cache_pedido_detalhe';
const STORAGE_EQUIPAMENTOS_CACHE = '@fieldcheck_cache_equipamentos_pedido';
const STORAGE_CHECKLIST_CACHE = '@fieldcheck_cache_modelo_checklist';
const STORAGE_SYNC_QUEUE = '@fieldcheck_fila_sincronizacao';

function chaveCacheSegura(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_');
}

async function lerJsonStorage(chave, fallback = null) {
  try {
    const texto = await AsyncStorage.getItem(chave);
    return texto ? JSON.parse(texto) : fallback;
  } catch (erro) {
    console.log('Erro lendo cache local:', chave, erro);
    return fallback;
  }
}

async function salvarJsonStorage(chave, valor) {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.log('Erro salvando cache local:', chave, erro);
  }
}

function limparFotosPesadas(valor) {
  if (Array.isArray(valor)) return valor.map(limparFotosPesadas);

  if (valor && typeof valor === 'object') {
    const limpo = {};
    Object.entries(valor).forEach(([chave, item]) => {
      const nome = String(chave).toLowerCase();
      if (nome.includes('base64') || nome === 'imagem_base64' || nome === 'foto_base64') return;
      if (typeof item === 'string' && item.length > 250000) return;
      limpo[chave] = limparFotosPesadas(item);
    });
    return limpo;
  }

  return valor;
}
async function buscarTecnicoAtivoPorEmail(email) {
  const emailLimpo = String(email || '').trim().toLowerCase();
  if (!emailLimpo) return null;

  const { data: tecnico, error } = await supabase
    .from('tecnicos')
    .select('*')
    .eq('email', emailLimpo)
    .eq('ativo', true)
    .maybeSingle();

  if (error) throw error;

  const empresaTecnico = String(tecnico?.empresa || '').trim().toLowerCase();
  const empresaAtual = String(obterEmpresaAtual() || '').trim().toLowerCase();

  if (!tecnico || empresaTecnico !== empresaAtual) return null;

  return tecnico;
}

function montarFiltroInSupabase(valores = []) {
  const lista = valores.map((valor) => JSON.stringify(String(valor))).join(',');
  return `(${lista})`;
}

async function cachearPedidoLocal(pedido) {
  const numero = String(pedido?.numero_pedido || '').trim();
  if (!numero) return;
  await salvarJsonStorage(`${STORAGE_PEDIDO_DETALHE_CACHE}_${numero}`, {
    ...pedido,
    cached_at: new Date().toISOString(),
  });
}

async function buscarPedidoLocal(numeroPedido) {
  const numero = String(numeroPedido || '').trim();
  if (!numero) return null;
  const pedido = await lerJsonStorage(`${STORAGE_PEDIDO_DETALHE_CACHE}_${numero}`, null);
  if (!pedido) return null;
  if (!usuarioPodeGerenciar() && Number(pedido.tecnico_id) !== Number(obterTecnicoAtualId())) return null;
  return pedido;
}

async function cachearEquipamentosPedidoLocal(numeroPedido, equipamentos) {
  const numero = String(numeroPedido || '').trim();
  if (!numero) return;
  await salvarJsonStorage(
    `${STORAGE_EQUIPAMENTOS_CACHE}_${numero}`,
    limparFotosPesadas(equipamentos || [])
  );
}

async function buscarEquipamentosPedidoLocal(numeroPedido) {
  const numero = String(numeroPedido || '').trim();
  if (!numero) return [];
  return lerJsonStorage(`${STORAGE_EQUIPAMENTOS_CACHE}_${numero}`, []);
}

async function cachearChecklistLocal(tag, itens) {
  const chave = chaveCacheSegura(tag);
  if (!chave || !Array.isArray(itens) || itens.length === 0) return;
  await salvarJsonStorage(`${STORAGE_CHECKLIST_CACHE}_${chave}`, itens);
}

async function buscarChecklistLocal(tag) {
  const chave = chaveCacheSegura(tag);
  if (!chave) return null;
  return lerJsonStorage(`${STORAGE_CHECKLIST_CACHE}_${chave}`, null);
}

async function carregarModeloChecklist(nomeEquipamento) {

  try {

    const { data, error } = await supabase
      .from('modelos_checklist')
      .select('*')
      .eq('equipamento', nomeEquipamento)
      .eq('empresa', obterEmpresaAtual())
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

async function carregarModeloGenericoAtribuido(modeloId) {
  if (!modeloId) return [];
  try {
    const { data, error } = await supabase
      .from('modelos_checklist_genericos_itens')
      .select('texto, tipo_resposta, exige_foto, exige_observacao, ordem')
      .eq('modelo_id', modeloId)
      .eq('empresa', obterEmpresaAtual())
      .order('ordem');
    if (error) throw error;
    return (data || []).map((item) => ({
      texto: item.texto,
      categoria: 'GERAL',
      resposta: null,
      obs: '',
      foto: null,
      ativo: true,
      exige_foto: item.exige_foto === true,
      exige_observacao: item.exige_observacao === true,
    }));
  } catch (error) {
    console.log('Erro ao carregar modelo atribuído:', error);
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
  const tag = String(tipo || '').trim();

  try {
    const { data, error } = await supabase
      .from('modelos_checklist')
      .select('*')
      .eq('tag', tag)
      .eq('empresa', obterEmpresaAtual())
      .order('ordem');

    if (error) {
      console.log('Erro ao carregar modelo online, tentando cache local:', error);
      return await buscarChecklistLocal(tag);
    }

    if (!data || data.length === 0) {
      return await buscarChecklistLocal(tag);
    }

    const itens = data.map((linha) => ({
      texto: linha.item,
      categoria: linha.categoria || 'GERAL',
      ativo: true,
      resposta: null,
      obs: '',
      foto: null,
    }));

    await cachearChecklistLocal(tag, itens);
    return itens;
  } catch (erro) {
    console.log('Erro Supabase checklist, usando cache local:', erro);
    return await buscarChecklistLocal(tag);
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
      quality: 0.45,
    });

  if (!resultado.canceled) {

    const novaLista = [...equipamentos];

    novaLista[eqIndex].foto =
      resultado.assets[0].uri;


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

function SecaoEstavel({ titulo, children }) {
  return <View style={styles.card}><Text style={styles.secaoTitulo}>{titulo}</Text>{children}</View>;
}

function CampoEstavel({ label, value, onChangeText, editable = true }) {
  return (
    <View style={styles.campoBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable ? { backgroundColor: '#f1f5f9', color: '#475467' } : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        editable={editable}
        selectTextOnFocus={editable}
      />
    </View>
  );
}

function BotaoOpcaoEstavel({ texto, ativo, tipo, onPress }) {
  const estiloAtivo = tipo === 'ok' ? styles.botaoOkAtivo : styles.botaoNaoAtivo;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.botaoOpcao, ativo ? estiloAtivo : null]}>
      <Text style={[styles.botaoOpcaoTexto, ativo ? styles.botaoOpcaoTextoAtivo : null]}>{texto}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ route, usuarioLogado }) {
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalVisitas, setTotalVisitas] = useState(0);
  const [totalEquipamentos, setTotalEquipamentos] = useState(0);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [totalNao, setTotalNao] = useState(0);
  const [ultimoCliente, setUltimoCliente] = useState('');
  const assinaturaRef = useRef(null);
  const visitaScrollRef = useRef(null);
  const ignorarSalvamentoLocalRef = useRef(false);
  const usuarioInicial = route?.params?.usuarioLogado || usuarioLogado || null;
  const [tela, setTela] = useState(route?.params?.telaInicial || 'pedido');
  const [usuario, setUsuario] = useState(usuarioInicial);

  useEffect(() => {
    if (route?.params?.telaInicial) {
      setTela(route.params.telaInicial);
    }
  }, [route?.params?.telaInicial]);

  useEffect(() => {
    if (usuarioInicial && !usuario) {
      setUsuario(usuarioInicial);
    }
  }, [usuarioInicial, usuario]);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [equipamentoAtual, setEquipamentoAtual] = useState(null);
  const [etapaVisita, setEtapaVisita] = useState('resumo');
  const [equipamentosSalvos, setEquipamentosSalvos] = useState({});
  const [assinaturaAberta, setAssinaturaAberta] = useState(false);
  const [listaPedidos, setListaPedidos] = useState([]);
  const [modelos, setModelos] = useState({});
  const [historico, setHistorico] = useState([]);
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [acaoAposLogin, setAcaoAposLogin] = useState(null);
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
  const [dados, setDados] = useState({ numeroPedido: '', cliente: '', endereco: '', cidade: '', estado: '', telefone: '', emailCliente: '', responsavel: '', tecnico: '', data: new Date().toLocaleDateString('pt-BR'), observacoes: '', });
  const STORAGE_KEY_LEGACY = '@fieldcheck_visita_em_andamento_atual';
  const STORAGE_KEY_BASE = '@fieldcheck_visita_em_andamento';

  function chaveTecnicoSeguro() {
    return String(
      dados?.tecnico ||
      usuario?.tecnico?.nome ||
      usuario?.email ||
      emailLogin ||
      'sem_tecnico'
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_');
  }

  function getStorageKeyFromPedido(pedido) {
    const pedidoSeguro = String(pedido || '').trim();
    if (!pedidoSeguro) return null;
    return `${STORAGE_KEY_BASE}_${pedidoSeguro}_${chaveTecnicoSeguro()}`;
  }

  function getStorageKeyAtual() {
    const pedidoAtual = String(
      numeroPedido ||
      dados?.numeroPedido ||
      pedidoEncontrado?.numero_pedido ||
      ''
    ).trim();
    return getStorageKeyFromPedido(pedidoAtual);
  }

  async function getItemSeguroStorage(chave, contexto = 'storage', removerSeGrande = true) {
    try {
      return await AsyncStorage.getItem(chave);
    } catch (erro) {
      const mensagem = String(erro?.message || erro || '');
      console.log(`Erro lendo ${contexto}:`, erro);

      if (removerSeGrande && (mensagem.includes('CursorWindow') || mensagem.includes('Row too big'))) {
        try {
          await AsyncStorage.removeItem(chave);
          console.log(`Storage removido por estar grande demais: ${chave}`);
        } catch (erroRemover) {
          console.log(`Erro removendo storage grande ${chave}:`, erroRemover);
        }
      }

      return null;
    }
  }

  function limparBase64ParaStorage(valor) {
    if (Array.isArray(valor)) {
      return valor.map(limparBase64ParaStorage);
    }

    if (valor && typeof valor === 'object') {
      const limpo = {};

      Object.entries(valor).forEach(([chave, item]) => {
        const chaveNormalizada = String(chave).toLowerCase();

        if (
          chaveNormalizada.includes('base64') ||
          chaveNormalizada === 'imagem_base64' ||
          chaveNormalizada === 'foto_base64'
        ) {
          return;
        }

        if (typeof item === 'string' && item.length > 250000) {
          // Evita o erro Android: Row too big to fit into CursorWindow.
          // Fotos e imagens grandes não devem ir para AsyncStorage.
          return;
        }

        limpo[chave] = limparBase64ParaStorage(item);
      });

      return limpo;
    }

    return valor;
  }

  function prepararRegistroParaStorage(registro) {
    return limparBase64ParaStorage(registro || {});
  }

  function prepararListaHistoricoParaStorage(lista) {
    return (Array.isArray(lista) ? lista : [])
      .map(prepararRegistroParaStorage)
      .slice(0, 50);
  }


  function visitaTemProgresso(listaEquipamentos = equipamentos, salvos = equipamentosSalvos, assinaturaAtual = assinatura) {
    const temEquipamentoSalvo = salvos && Object.keys(salvos).length > 0;
    const temAssinatura = !!assinaturaAtual;

    const temItemPreenchido = (listaEquipamentos || []).some((eq) => {
      const temFotoEquipamento = !!(eq?.foto || eq?.fotoBase64);
      const temDadosEquipamento = !!(
        eq?.descricao ||
        eq?.modelo ||
        eq?.serie ||
        eq?.observacao ||
        eq?.observacoes
      );

      const temItem = (eq?.itens || []).some((item) => !!(
        item?.resposta ||
        item?.ok === true ||
        item?.nao === true ||
        item?.obs ||
        item?.observacao ||
        item?.foto ||
        item?.fotoBase64
      ));

      return temFotoEquipamento || temDadosEquipamento || temItem;
    });

    return temEquipamentoSalvo || temAssinatura || temItemPreenchido;
  }

  function visitaValidaParaContinuar(visita) {
    if (!visita) return false;
    if (visita.finalizado === true || visita.status === 'finalizado') return false;
    const lista = Array.isArray(visita.equipamentos) ? visita.equipamentos : [];
    if (lista.length === 0) return false;
    return visitaTemProgresso(lista, visita.equipamentosSalvos || {}, visita.assinatura || null);
  }
  const [equipamentos, setEquipamentos] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const [localizacaoInicio, setLocalizacaoInicio] = useState(null);

  useEffect(() => {
    if (tela === 'visita') {
      setTimeout(() => {
        visitaScrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 80);
    }
  }, [tela, etapaVisita, equipamentoAtual]);
  function calcularResumoEquipamentos(listaEquipamentos = []) {
    const todos = (listaEquipamentos || []).flatMap((eq) =>
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
  }

  function montarRegistroParcial({
    equipamentosOverride = equipamentos,
    equipamentosSalvosOverride = equipamentosSalvos,
    etapaOverride = etapaVisita,
    equipamentoAtualOverride = equipamentoAtual,
    finalizadoOverride = false,
  } = {}) {
    const equipamentosCompletos = (equipamentosOverride || []).map((eq) => ({
      ...eq,
      itens: (eq.itens || []).map((item) => ({ ...item })),
    }));

    const resumoParcial = calcularResumoEquipamentos(equipamentosCompletos);
    const pedidoAtual = String(numeroPedido || dados.numeroPedido || pedidoEncontrado?.numero_pedido || '').trim();
    const agora = new Date().toISOString();

    return {
      id: `local-${pedidoAtual || Date.now()}`,
      numero_os: finalizadoOverride
        ? `FC-${new Date().getFullYear()}-${Date.now()}`
        : `PARCIAL-${pedidoAtual || Date.now()}`,
      numeroPedido: pedidoAtual,
      numero_pedido: pedidoAtual || null,
      pedidoEncontrado,

      dados: {
        ...dados,
        numeroPedido: pedidoAtual || dados.numeroPedido || '',
      },

      cliente: dados.cliente || pedidoEncontrado?.cliente || '',
      emailCliente: dados.emailCliente || '',
      propriedade: dados.propriedade,
      cidade: dados.cidade || pedidoEncontrado?.cidade || '',
      estado: dados.estado || '',
      endereco: dados.endereco || '',
      telefone: dados.telefone || dados.contato || '',
      contato: dados.contato || '',
      responsavel: dados.responsavel || '',
      tecnico: dados.tecnico || usuario?.tecnico?.nome || usuario?.email || '',
      data: dados.data,
      data_visita: dados.data,
      observacoes: dados.observacoes || '',

      equipamentos: equipamentosCompletos,
      equipamentosSalvos: equipamentosSalvosOverride,
      equipamentoAtual: equipamentoAtualOverride,
      etapaVisita: etapaOverride,

      assinatura,
      tecnico_id: obterTecnicoAtualId(),
      localizacao_inicio: localizacaoInicio,
      inicio_em: localizacaoInicio?.capturado_em || null,
      resumo: resumoParcial,

      total_ok: resumoParcial.ok,
      total_nao: resumoParcial.nao,
      total_pendentes: resumoParcial.pendentes,
      total_equipamentos: equipamentosCompletos.length,

      finalizado: finalizadoOverride,
      status: finalizadoOverride ? 'finalizado' : 'em andamento',
      criadoEm: agora,
      updated_at_local: agora,
      dataSalvamento: agora,
      sincronizado: false,
    };
  }

  async function salvarRegistroNoHistoricoLocal(registro) {
    const salvo = await getItemSeguroStorage(STORAGE_VISITAS, 'histórico local');
    const listaAtual = salvo ? JSON.parse(salvo) : [];

    const registroSeguro = prepararRegistroParaStorage(registro);
    const pedidoAtual = String(registroSeguro.numeroPedido || registroSeguro.numero_pedido || '');
    const novaLista = prepararListaHistoricoParaStorage([
      registroSeguro,
      ...listaAtual.filter((item) => {
        const mesmoPedido =
          String(item.numeroPedido || item.numero_pedido || '') === pedidoAtual;

        return !mesmoPedido;
      }),
    ]);

    await AsyncStorage.setItem(STORAGE_VISITAS, JSON.stringify(novaLista));
    setHistorico(novaLista.map(normalizarVisitaHistorico));
  }

  async function adicionarNaFilaSincronizacao(registro) {
    try {
      const filaAtual = await lerJsonStorage(STORAGE_SYNC_QUEUE, []);
      const registroSeguro = prepararRegistroParaStorage({
        ...registro,
        aguardando_sync: true,
        sincronizado: false,
        fila_sync_em: new Date().toISOString(),
      });

      const pedidoAtual = String(registroSeguro.numero_pedido || registroSeguro.numeroPedido || '');
      const novaFila = [
        registroSeguro,
        ...(Array.isArray(filaAtual) ? filaAtual : []).filter((item) => {
          const mesmoPedido = String(item.numero_pedido || item.numeroPedido || '') === pedidoAtual;
          const mesmoStatus = String(item.status || '') === String(registroSeguro.status || '');
          return !(mesmoPedido && mesmoStatus);
        }),
      ].slice(0, 100);

      await salvarJsonStorage(STORAGE_SYNC_QUEUE, novaFila);
    } catch (erro) {
      console.log('Erro adicionando visita na fila de sincronização:', erro);
    }
  }

  async function processarFilaSincronizacao() {
    try {
      const fila = await lerJsonStorage(STORAGE_SYNC_QUEUE, []);
      if (!Array.isArray(fila) || fila.length === 0) return;

      const pendentes = [];

      for (const registro of fila) {
        const sucesso = await sincronizarVisitaParcialSupabase(registro, { reenfileirar: false });
        if (!sucesso) pendentes.push(registro);
      }

      await salvarJsonStorage(STORAGE_SYNC_QUEUE, pendentes);
      if (pendentes.length === 0) {
        console.log('Fila de sincronização esvaziada com sucesso.');
      }
    } catch (erro) {
      console.log('Erro processando fila de sincronização:', erro);
    }
  }

  async function sincronizarVisitaParcialSupabase(registro, { reenfileirar = true } = {}) {
    try {
      if (!registro?.numero_pedido && !registro?.cliente) return false;

      const payloadBasico = {
        numero_os: registro.numero_os,
        numero_pedido: registro.numero_pedido || null,
        cliente: registro.cliente || '',
        tecnico: registro.tecnico || '',
        cidade: registro.cidade || '',
        data_visita: registro.data_visita || registro.data || '',
        observacoes: registro.observacoes || '',
        total_ok: registro.total_ok || 0,
        total_nao: registro.total_nao || 0,
        total_pendentes: registro.total_pendentes || 0,
        total_equipamentos: registro.total_equipamentos || 0,
        finalizado: registro.finalizado === true || registro.status === 'finalizado',
        status: registro.finalizado === true || registro.status === 'finalizado' ? 'finalizado' : 'em andamento',
        empresa: obterEmpresaAtual(),
        tecnico_id: obterTecnicoAtualId(),
        criado_por: usuario?.id || null,
        pedido_id: registro.pedidoEncontrado?.id || null,
      };

      const { data: existente, error: erroBusca } = await supabase
        .from('visitas')
        .select('id')
        .eq('numero_pedido', registro.numero_pedido)
        .eq('empresa', obterEmpresaAtual())
        .neq('status', 'finalizado')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (erroBusca) {
        console.log('ERRO BUSCAR VISITA PARCIAL:', erroBusca);
      }

      let idVisita = existente?.id;

      if (idVisita) {
        const { error: erroUpdate } = await supabase
          .from('visitas')
          .update(payloadBasico)
          .eq('id', idVisita)
          .eq('empresa', obterEmpresaAtual());

        if (erroUpdate) {
          console.log('ERRO UPDATE VISITA PARCIAL:', erroUpdate);
          if (reenfileirar) await adicionarNaFilaSincronizacao(registro);
          return false;
        }
      } else {
        const { data: inserida, error: erroInsert } = await supabase
          .from('visitas')
          .insert([payloadBasico])
          .select('id')
          .single();

        if (erroInsert) {
          console.log('ERRO INSERT VISITA PARCIAL:', erroInsert);
          if (reenfileirar) await adicionarNaFilaSincronizacao(registro);
          return false;
        }

        idVisita = inserida?.id;
      }

      if (idVisita) {
        const { error: erroCompleto } = await supabase
          .from('visitas')
          .update({
            dados: registro.dados,
            equipamentos: registro.equipamentos,
            assinatura: registro.assinatura,
            resumo: registro.resumo,
            empresa: obterEmpresaAtual(),
          })
          .eq('id', idVisita)
          .eq('empresa', obterEmpresaAtual());

        if (erroCompleto) {
          console.log(
            'Aviso: parcial básica salva, mas faltam colunas jsonb completas em visitas:',
            erroCompleto.message
          );
        }
      }

      console.log('Visita parcial sincronizada no Supabase');
      return true;
    } catch (erro) {
      console.log('Erro sincronizar visita parcial:', erro);
      if (reenfileirar) await adicionarNaFilaSincronizacao(registro);
      return false;
    }
  }

  async function salvarVisitaLocal({
    sincronizarSupabase = false,
    equipamentosOverride = equipamentos,
    equipamentosSalvosOverride = equipamentosSalvos,
    etapaOverride = etapaVisita,
    equipamentoAtualOverride = equipamentoAtual,
    finalizadoOverride = false,
  } = {}) {
    try {
      if (ignorarSalvamentoLocalRef.current) {
        return;
      }

      const pedidoAtualSalvar = String(
        numeroPedido || dados?.numeroPedido || pedidoEncontrado?.numero_pedido || ''
      ).trim();

      if (!pedidoAtualSalvar) {
        return;
      }

      // Não grava visita vazia quando o técnico apenas abriu o pedido.
      // O salvamento parcial só começa depois de existir preenchimento real
      // ou quando o usuário salva um equipamento/assina/finaliza.
      if (
        !finalizadoOverride &&
        !visitaTemProgresso(equipamentosOverride, equipamentosSalvosOverride, assinatura)
      ) {
        return;
      }

      const registro = montarRegistroParcial({
        equipamentosOverride,
        equipamentosSalvosOverride,
        etapaOverride,
        equipamentoAtualOverride,
        finalizadoOverride,
      });

      const chaveSalvar = getStorageKeyFromPedido(registro.numeroPedido || registro.numero_pedido || pedidoAtualSalvar);
      if (!chaveSalvar) return;

      await AsyncStorage.setItem(chaveSalvar, JSON.stringify(prepararRegistroParaStorage(registro)));
      // remove chave antiga/global para evitar alerta fantasma ao abrir o app
      await AsyncStorage.removeItem(STORAGE_KEY_LEGACY);
      await salvarRegistroNoHistoricoLocal(registro);
      buscarListaPedidos();

      if (sincronizarSupabase) {
        const sincronizado = await sincronizarVisitaParcialSupabase(registro);
        if (!sincronizado) {
          await adicionarNaFilaSincronizacao(registro);
        }
      }

      console.log('Visita salva localmente:', chaveSalvar);
    } catch (error) {
      console.log('Erro ao salvar visita local:', error);
    }
  }

  function pedidoDaVisitaLocal(visita) {
    return String(
      visita?.numeroPedido ||
      visita?.numero_pedido ||
      visita?.dados?.numeroPedido ||
      visita?.pedidoEncontrado?.numero_pedido ||
      ''
    ).trim();
  }

  function tecnicoDaVisitaLocal(visita) {
    return String(
      visita?.tecnico ||
      visita?.dados?.tecnico ||
      visita?.usuario?.email ||
      ''
    ).trim().toLowerCase();
  }

  function tecnicoAtualLogado() {
    return String(
      dados?.tecnico ||
      usuario?.tecnico?.nome ||
      usuario?.email ||
      emailLogin ||
      ''
    ).trim().toLowerCase();
  }

  function carregarVisitaSalvaNaTela(visita) {
    if (!visita) return;

    setNumeroPedido(pedidoDaVisitaLocal(visita));
    setPedidoEncontrado(visita.pedidoEncontrado || null);
    setDados(visita.dados || {
      numeroPedido: pedidoDaVisitaLocal(visita),
      cliente: '',
      endereco: '',
      cidade: '',
      estado: '',
      telefone: '',
      emailCliente: '',
    });
    setEquipamentos(
      (visita.equipamentos || []).map((eq) => ({
        ...eq,
        itens: eq.itens || [],
      }))
    );
    setEquipamentoAtual(visita.equipamentoAtual ?? null);
    setEtapaVisita(visita.etapaVisita || 'resumo');
    setEquipamentosSalvos(visita.equipamentosSalvos || {});
    setAssinatura(visita.assinatura || null);
    setLocalizacaoInicio(visita.localizacao_inicio || null);
    setTela('visita');
  }

  async function buscarVisitaEmAndamentoDoPedido(pedidoDigitado) {
    const pedidoAtualBusca = String(pedidoDigitado || '').trim();
    if (!pedidoAtualBusca) return null;

    const chavePedido = getStorageKeyFromPedido(pedidoAtualBusca);

    try {
      const dadosSalvos = chavePedido ? await getItemSeguroStorage(chavePedido, 'visita por chave') : null;
      if (dadosSalvos) {
        const visita = JSON.parse(dadosSalvos);
        const historicoSalvo = await getItemSeguroStorage(STORAGE_VISITAS, 'historico para limpar rascunho');
        const historicoLocal = historicoSalvo ? JSON.parse(historicoSalvo) : [];
        const finalizadaMaisRecente = (Array.isArray(historicoLocal) ? historicoLocal : [])
          .map(normalizarVisitaHistorico)
          .filter((item) => {
            const mesmoPedido = String(item.numeroPedido || item.numero_pedido || item.dados?.numeroPedido || '') === pedidoAtualBusca;
            return mesmoPedido && (item.finalizado === true || item.status === 'finalizado' || item.status === 'enviado');
          })
          .sort((a, b) => String(b.finalizado_em || b.criadoEm || '').localeCompare(String(a.finalizado_em || a.criadoEm || '')))[0];

        const dataRascunho = Date.parse(visita.updated_at_local || visita.dataSalvamento || visita.criadoEm || '') || 0;
        const dataFinalizacao = Date.parse(finalizadaMaisRecente?.finalizado_em || finalizadaMaisRecente?.criadoEm || '') || 0;
        if (finalizadaMaisRecente && (!dataRascunho || !dataFinalizacao || dataFinalizacao >= dataRascunho)) {
          if (chavePedido) await AsyncStorage.removeItem(chavePedido);
          await AsyncStorage.removeItem(STORAGE_KEY_LEGACY);
          return null;
        }
        if (visitaValidaParaContinuar(visita)) return visita;
        if (chavePedido) await AsyncStorage.removeItem(chavePedido);
      }
    } catch (erro) {
      console.log('Erro lendo visita por chave:', erro);
    }

    try {
      const salvoHistorico = await getItemSeguroStorage(STORAGE_VISITAS, 'histórico local');
      const listaHistorico = salvoHistorico ? JSON.parse(salvoHistorico) : [];
      const tecnicoAtual = tecnicoAtualLogado();

      const visita = (Array.isArray(listaHistorico) ? listaHistorico : [])
        .map(normalizarVisitaHistorico)
        .find((item) => {
          const mesmoPedido = String(item.numeroPedido || item.numero_pedido || item.dados?.numeroPedido || '') === pedidoAtualBusca;
          const tecnicoItem = tecnicoDaVisitaLocal(item);
          const mesmoTecnico = !tecnicoItem || !tecnicoAtual || tecnicoItem === tecnicoAtual;
          return mesmoPedido && mesmoTecnico && visitaValidaParaContinuar(item);
        });

      if (visita) {
        if (chavePedido) await AsyncStorage.setItem(chavePedido, JSON.stringify(prepararRegistroParaStorage(visita)));
        return visita;
      }
    } catch (erro) {
      console.log('Erro buscando visita no histórico local:', erro);
    }

    return null;
  }

  async function iniciarEntregaTecnicaPedido() {
    const inicioCapturado = localizacaoInicio || await capturarLocalizacaoCampo();
    setLocalizacaoInicio(inicioCapturado);
    const pedidoAtualBusca = String(numeroPedido || dados?.numeroPedido || pedidoEncontrado?.numero_pedido || '').trim();
    const visita = await buscarVisitaEmAndamentoDoPedido(pedidoAtualBusca);

    if (visita) {
      Alert.alert(
        'Visita em andamento',
        `Encontramos uma visita não finalizada para o pedido ${pedidoAtualBusca}. Deseja continuar?`,
        [
          {
            text: 'Iniciar nova',
            style: 'destructive',
            onPress: async () => {
              const chavePedido = getStorageKeyFromPedido(pedidoAtualBusca);
              if (chavePedido) await AsyncStorage.removeItem(chavePedido);
              await AsyncStorage.removeItem(STORAGE_KEY_LEGACY);
              setEquipamentoAtual(null);
              setEtapaVisita('resumo');
              setEquipamentosSalvos({});
              setAssinatura(null);
              setTela('visita');
            },
          },
          {
            text: 'Continuar',
            onPress: () => carregarVisitaSalvaNaTela(visita),
          },
        ]
      );
      return;
    }

    setEquipamentoAtual(null);
    setEtapaVisita('resumo');
    setTela('visita');
  }

  async function verificarVisitaLocalDoPedido(pedidoDigitado, pedido, equipamentosProntos) {
    try {
      const pedidoAtualBusca = String(pedidoDigitado || pedido?.numero_pedido || '').trim();

      // A chave antiga/global causava alerta fantasma na tela de pedidos.
      await AsyncStorage.removeItem(STORAGE_KEY_LEGACY);

      setPedidoEncontrado(pedido);
      setEquipamentos(equipamentosProntos || []);

      const visita = await buscarVisitaEmAndamentoDoPedido(pedidoAtualBusca);

      if (!visita) {
        setTela('detalhePedido');
        return;
      }

      Alert.alert(
        'Visita em andamento',
        `Encontramos uma visita não finalizada para o pedido ${pedidoAtualBusca}. Deseja continuar?`,
        [
          {
            text: 'Iniciar nova',
            style: 'destructive',
            onPress: async () => {
              const chavePedido = getStorageKeyFromPedido(pedidoAtualBusca);
              if (chavePedido) await AsyncStorage.removeItem(chavePedido);
              await AsyncStorage.removeItem(STORAGE_KEY_LEGACY);
              setPedidoEncontrado(pedido);
              setEquipamentos(equipamentosProntos || []);
              setEquipamentoAtual(null);
              setEtapaVisita('resumo');
              setEquipamentosSalvos({});
              setAssinatura(null);
              setTela('detalhePedido');
            },
          },
          {
            text: 'Continuar',
            onPress: () => carregarVisitaSalvaNaTela(visita),
          },
        ]
      );
    } catch (error) {
      console.log('Erro ao verificar visita local do pedido:', error);
      setTela('detalhePedido');
    }
  }

  useEffect(() => {
    if (tela === 'visita') {
      salvarVisitaLocal();
    }
  }, [
    numeroPedido,
    pedidoEncontrado,
    dados,
    equipamentos,
    equipamentoAtual,
    etapaVisita,
    equipamentosSalvos,
    assinatura,
    tela,
  ]);
  const [listaClientes, setListaClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [numeroPedido, setNumeroPedido] = useState('');
  const [pedidoEncontrado, setPedidoEncontrado] = useState(null);
  const [buscandoPedido, setBuscandoPedido] = useState(false);

  function resetarParaNovaVisita() {
    ignorarSalvamentoLocalRef.current = true;

    setTela('pedido');
    setEtapaVisita('resumo');
    setEquipamentoAtual(null);
    setAssinaturaAberta(false);
    setPedidoEncontrado(null);
    setNumeroPedido('');
    setDados({
      numeroPedido: '',
      cliente: '',
      endereco: '',
      cidade: '',
      estado: '',
      telefone: '',
      emailCliente: '',
      responsavel: '',
      tecnico: usuario?.tecnico?.nome || usuario?.email || '',
      data: new Date().toLocaleDateString('pt-BR'),
      observacoes: '',
    });
    setEquipamentos([]);
    setEquipamentosSalvos({});
    setAssinatura(null);
    setLocalizacaoInicio(null);

    setTimeout(() => {
      ignorarSalvamentoLocalRef.current = false;
    }, 300);
  }

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.telaInicial === 'pedido') {
        resetarParaNovaVisita();
      }

      if (route?.params?.telaInicial === 'historico') {
        setTela('historico');
        setEtapaVisita('resumo');
        setEquipamentoAtual(null);
        setAssinaturaAberta(false);
      }
    }, [route?.params?.telaInicial])
  );
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
      .eq('empresa', obterEmpresaAtual())
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.log('ERRO �aLTIMA VISITA CLIENTE:', error);
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
    try {
      const pedidoDigitado = String(
        pedidoSelecionado || numeroPedido
      ).trim();

      if (!pedidoDigitado) {
        Alert.alert('Atenção', 'Digite o número do pedido.');
        return;
      }

      setBuscandoPedido(true);
      setEquipamentos([]);
      setEquipamentoAtual(null);
      setEtapaVisita('resumo');
      setEquipamentosSalvos({});

      let pedido = null;
      let pedidoOffline = false;

      try {
        const { data, error: erroPedido } = await supabase
          .from('pedidos')
          .select('*')
          .eq('numero_pedido', pedidoDigitado)
          .eq('empresa', obterEmpresaAtual())
          .maybeSingle();

        if (!erroPedido && data) {
          pedido = data;
          await cachearPedidoLocal(data);
        } else {
          console.log('Pedido não encontrado online, tentando cache:', erroPedido);
        }
      } catch (erroPedidoOnline) {
        console.log('Sem internet/erro ao buscar pedido online, tentando cache:', erroPedidoOnline);
      }

      if (!pedido) {
        pedido = await buscarPedidoLocal(pedidoDigitado);
        pedidoOffline = !!pedido;
      }

      if (!pedido) {
        setBuscandoPedido(false);
        Alert.alert(
          'Pedido não encontrado',
          'Não encontrei este pedido online nem no cache local. Abra este pedido pelo menos uma vez com internet antes de trabalhar offline.'
        );
        return;
      }

      setPedidoEncontrado(pedido);

      setDados((atual) => ({
        ...atual,
        numeroPedido: pedido.numero_pedido || pedidoDigitado,
        cliente: pedido.cliente || '',
        endereco: pedido.endereco || '',
        cidade: pedido.cidade || '',
        estado: pedido.estado || '',
        telefone: pedido.telefone || '',
        emailCliente: pedido.email || '',
        responsavel: pedido.responsavel || '',
      }));

      let equipamentosPedido = [];

      if (!pedidoOffline) {
        try {
          const { data, error: erroEquipamentos } = await supabase
            .from('equipamentos')
            .select('*')
            .eq('numero_pedido', pedidoDigitado)
            .eq('empresa', obterEmpresaAtual());

          if (erroEquipamentos) {
            console.log('Erro ao buscar equipamentos online, tentando cache:', erroEquipamentos);
          } else {
            equipamentosPedido = data || [];
          }
        } catch (erroEquipamentosOnline) {
          console.log('Sem internet/erro equipamentos online, tentando cache:', erroEquipamentosOnline);
        }
      }

      if (!equipamentosPedido || equipamentosPedido.length === 0) {
        equipamentosPedido = await buscarEquipamentosPedidoLocal(pedidoDigitado);
        if (equipamentosPedido?.length > 0) {
          pedidoOffline = true;
        }
      }

      const equipamentosFormatados = await Promise.all(
        (equipamentosPedido || []).map(async (eq) => {
          const tag = String(
            eq.tag ||
            eq.TAG ||
            eq.codigo_tag ||
            eq.tag_equipamento ||
            eq.nome ||
            ''
          ).trim();

          const checklistOnline = eq.modelo_checklist_id
            ? await carregarModeloGenericoAtribuido(eq.modelo_checklist_id)
            : tag
              ? await carregarChecklistDoSupabase(tag)
              : null;

          const itensBase =
            checklistOnline && checklistOnline.length > 0
              ? checklistOnline
              : [];

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
              exige_foto: item.exige_foto === true,
              exige_observacao: item.exige_observacao === true,
            })),
          };
        })
      );

      const equipamentosProntos = equipamentosFormatados.filter(Boolean);

      if (equipamentosProntos.length > 0) {
        await cachearEquipamentosPedidoLocal(pedidoDigitado, equipamentosProntos);
      }

      setEquipamentos(equipamentosProntos);
      setBuscandoPedido(false);
      if (pedidoOffline) {
        Alert.alert(
          'Modo offline',
          'Pedido carregado pelo cache local. Você pode preencher a visita normalmente; a sincronização ficará pendente até voltar internet.'
        );
      }
      await verificarVisitaLocalDoPedido(pedidoDigitado, pedido, equipamentosProntos);

      if (equipamentosProntos.length === 0) {
        Alert.alert(
          'Atenção',
          `Pedido ${pedidoDigitado} encontrado, mas nenhum equipamento foi localizado.`
        );
      }
    } catch (error) {
      setBuscandoPedido(false);
      Alert.alert(
        'Erro buscar pedido',
        error?.message || JSON.stringify(error)
      );
    }
  }

  async function carregarDashboard() {

    try {

      const { count: clientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('empresa', obterEmpresaAtual());

      const { count: visitas } = await supabase
        .from('visitas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa', obterEmpresaAtual());

      const { count: equipamentos } = await supabase
        .from('equipamentos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa', obterEmpresaAtual());

      const { data: visitasDados } = await supabase
        .from('visitas')
        .select('*')
        .eq('empresa', obterEmpresaAtual())
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
  async function carregarVisitasLocaisEmAndamento() {
    try {
      const salvoHistorico = await getItemSeguroStorage(STORAGE_VISITAS, 'histórico local');
      const listaHistorico = salvoHistorico ? JSON.parse(salvoHistorico) : [];

      return (Array.isArray(listaHistorico) ? listaHistorico : [])
        .map(normalizarVisitaHistorico)
        .filter((visita) => visitaValidaParaContinuar(visita));
    } catch (erro) {
      console.log('Erro carregando visitas locais em andamento:', erro);
      return [];
    }
  }

  async function buscarListaPedidos() {
    let pedidos = [];
    let visitas = [];
    let usandoCachePedidos = false;

    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, cliente, status, cidade, tecnico_id')
        .eq('empresa', obterEmpresaAtual())
        .order('id', { ascending: false });

      if (error) {
        console.log('ERRO LISTA PEDIDOS ONLINE:', error);
      } else {
        pedidos = data || [];
        await salvarJsonStorage(STORAGE_PEDIDOS_CACHE, pedidos);
      }
    } catch (erroPedidosOnline) {
      console.log('Sem internet/erro ao listar pedidos online:', erroPedidosOnline);
    }

    if (!pedidos || pedidos.length === 0) {
      pedidos = await lerJsonStorage(STORAGE_PEDIDOS_CACHE, []);
      if (!usuarioPodeGerenciar()) {
        pedidos = (Array.isArray(pedidos) ? pedidos : []).filter((pedido) => Number(pedido.tecnico_id) === Number(obterTecnicoAtualId()));
      }
      usandoCachePedidos = Array.isArray(pedidos) && pedidos.length > 0;
    }

    try {
      const { data, error: erroVisitas } = await supabase
        .from('visitas')
        .select('numero_pedido, status, finalizado, total_pendentes, total_equipamentos, created_at')
        .eq('empresa', obterEmpresaAtual())
        .order('created_at', { ascending: false });

      if (erroVisitas) {
        console.log('ERRO STATUS VISITAS:', erroVisitas);
      } else {
        visitas = data || [];
      }
    } catch (erroVisitasOnline) {
      console.log('Sem internet/erro status visitas online:', erroVisitasOnline);
    }

    const visitasLocais = await carregarVisitasLocaisEmAndamento();

    const pedidosComStatus = (pedidos || []).map((pedido) => {
      const visitaLocal = visitasLocais.find(
        (v) => String(v.numero_pedido || v.numeroPedido || v.dados?.numeroPedido || '') === String(pedido.numero_pedido)
      );

      const visitaSupabase = (visitas || []).find(
        (v) => String(v.numero_pedido) === String(pedido.numero_pedido)
      );

      const visita = visitaLocal || visitaSupabase;

      const visitaFinalizada =
        visita?.finalizado === true ||
        visita?.status === 'finalizado' ||
        (
          Number(visita?.total_pendentes || 0) === 0 &&
          Number(visita?.total_equipamentos || 0) > 0 &&
          !visitaLocal
        );

      return {
        ...pedido,
        status: visitaFinalizada
          ? 'finalizado'
          : visitaLocal
            ? 'em andamento'
            : visita?.status || pedido.status || (usandoCachePedidos ? 'cache offline' : 'pendente'),
        finalizado: visitaFinalizada,
        offline_cache: usandoCachePedidos,
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
    processarFilaSincronizacao();
    //carregarDashboard();
  }, []);

  async function buscarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa', obterEmpresaAtual())
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
      Alert.alert('Erro', 'Não foi possível carregar o Banco de Checklists FieldCheck.');
    }
  }

  function chaveVisita(visita = {}) {
    return String(
      visita.numero_os ||
      visita.numero_entrega ||
      visita.numero_pedido ||
      visita.numeroPedido ||
      visita.id ||
      ''
    );
  }

  function normalizarVisitaHistorico(visita = {}) {
    const resumoSeguro = visita.resumo || {
      ok: visita.total_ok || 0,
      nao: visita.total_nao || 0,
      pendentes: visita.total_pendentes || 0,
    };

    const dadosSeguro = visita.dados || {
      numeroPedido: visita.numero_pedido || visita.numeroPedido || '',
      cliente: visita.cliente || '',
      endereco: visita.endereco || '',
      cidade: visita.cidade || '',
      estado: visita.estado || '',
      telefone: visita.telefone || visita.contato || '',
      emailCliente: visita.emailCliente || visita.email_cliente || '',
      responsavel: visita.responsavel || '',
      tecnico: visita.tecnico || '',
      data: visita.data_visita || visita.data || '',
      observacoes: visita.observacoes || '',
    };

    const equipamentosSeguros = Array.isArray(visita.equipamentos)
      ? visita.equipamentos.map((eq) => ({
        ...eq,
        itens: Array.isArray(eq.itens) ? eq.itens : [],
      }))
      : [];

    return {
      ...visita,
      dados: dadosSeguro,
      equipamentos: equipamentosSeguros,
      resumo: resumoSeguro,
      total_ok: visita.total_ok ?? resumoSeguro.ok ?? 0,
      total_nao: visita.total_nao ?? resumoSeguro.nao ?? 0,
      total_pendentes: visita.total_pendentes ?? resumoSeguro.pendentes ?? 0,
      total_equipamentos: visita.total_equipamentos ?? equipamentosSeguros.length ?? 0,
      cliente: visita.cliente || dadosSeguro.cliente || 'Cliente não informado',
      cidade: visita.cidade || dadosSeguro.cidade || '',
      tecnico: visita.tecnico || dadosSeguro.tecnico || '',
      data_visita: visita.data_visita || dadosSeguro.data || visita.data || '',
      finalizado: visita.finalizado === true || visita.status === 'finalizado' || (Number(visita.total_pendentes || resumoSeguro.pendentes || 0) === 0 && Number(visita.total_equipamentos || equipamentosSeguros.length || 0) > 0),
      status: visita.status || (visita.finalizado ? 'finalizado' : 'em andamento'),
    };
  }

  async function carregarHistorico() {
    try {
      const salvoLocal = await getItemSeguroStorage(STORAGE_VISITAS, 'histórico local');
      const historicoLocal = salvoLocal ? JSON.parse(salvoLocal) : [];

      const { data, error } = await supabase
        .from('visitas')
        .select('*')
        .eq('empresa', obterEmpresaAtual())
        .order('created_at', { ascending: false });

      if (error) {
        console.log('ERRO AO CARREGAR HIST�RICO:', error);
        setHistorico((Array.isArray(historicoLocal) ? historicoLocal : []).map(normalizarVisitaHistorico));
        return;
      }

      const mapaLocal = new Map(
        (Array.isArray(historicoLocal) ? historicoLocal : [])
          .map(normalizarVisitaHistorico)
          .map((visita) => [chaveVisita(visita), visita])
      );

      const listaSupabase = Array.isArray(data) ? data.map(normalizarVisitaHistorico) : [];

      const listaMesclada = listaSupabase.map((visita) => {
        const local = mapaLocal.get(chaveVisita(visita));
        if (local && Array.isArray(local.equipamentos) && local.equipamentos.length > 0) {
          return normalizarVisitaHistorico({
            ...visita,
            ...local,
            id: visita.id || local.id,
            numero_os: visita.numero_os || local.numero_os,
            numero_pedido: visita.numero_pedido || local.numeroPedido || local.numero_pedido,
          });
        }

        return visita;
      });

      (Array.isArray(historicoLocal) ? historicoLocal : []).map(normalizarVisitaHistorico).forEach((local) => {
        const existe = listaMesclada.some((visita) => chaveVisita(visita) === chaveVisita(local));
        if (!existe) listaMesclada.push(local);
      });

      setHistorico(listaMesclada);
    } catch (erro) {
      console.log('Erro ao carregar histórico:', erro);
      setHistorico([]);
    }
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
    equipamentoAtual !== null
      ? equipamentos[equipamentoAtual]
      : null;

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

  const visitasDoPedido = historico.filter(
    (v) =>
      String(v.numero_pedido || v.numeroPedido || v.dados?.numeroPedido || '') ===
      String(numeroPedido || pedidoEncontrado?.numero_pedido || '')
  ).length;

  const progressoVisita = useMemo(() => {
    const totalEquipamentos = equipamentos.length || 0;

    const equipamentosSalvosQtd = equipamentos.filter((eq, index) => {
      const status = statusEquipamento(eq);
      return equipamentosSalvos[index] === true || status === 'concluido';
    }).length;

    const percentual = totalEquipamentos > 0
      ? Math.round((equipamentosSalvosQtd / totalEquipamentos) * 100)
      : 0;

    return {
      totalEquipamentos,
      equipamentosSalvosQtd,
      percentual,
    };
  }, [equipamentos, equipamentosSalvos]);

  const indicadoresVisitaAtual = {
    visitas: visitasDoPedido,
    equipamentos: equipamentos.length || 0,
    pendentes: resumo.pendentes || 0,
    nao: resumo.nao || 0,
  };

  function finalizarChecklist() {
    const itensObrigatoriosPendentes = equipamentos.flatMap((eq) =>
      (eq.itens || []).filter((item) =>
        item.ativo !== false && (
          !item.resposta ||
          (item.exige_foto === true && !item.foto) ||
          (item.exige_observacao === true && !String(item.obs || '').trim())
        )
      )
    );
    if (itensObrigatoriosPendentes.length > 0) {
      Alert.alert(
        'Checklist incompleto',
        'Responda todos os itens obrigatórios e inclua as fotos ou observações exigidas pela empresa.'
      );
      return;
    }
    Alert.alert(
      'Finalizar checklist',
      'Confirma a finalizacao desta visita? Depois disso, o tecnico podera apenas consultar e reenviar o relatorio.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              await salvarHistorico();
              Alert.alert('Checklist finalizado', 'Visita salva com sucesso.');
            } catch (error) {
              console.log('ERRO FINALIZAR CHECKLIST:', error);
              Alert.alert('Erro', 'Erro ao finalizar checklist.');
            }
          },
        },
      ]
    );
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
      Alert.alert('Atenção', '�0 necessário manter pelo menos um equipamento.');
      return;
    }
    setEquipamentos((atual) => atual.filter((_, i) => i !== equipamentoAtual));
    setEquipamentoAtual(null);
    setEtapaVisita('resumo');
  }

  async function salvarEquipamentoAtual() {
    if (equipamentoAtual === null) return;

    const novosEquipamentosSalvos = {
      ...equipamentosSalvos,
      [equipamentoAtual]: true,
    };

    setEquipamentosSalvos(novosEquipamentosSalvos);

    await salvarVisitaLocal({
      sincronizarSupabase: true,
      equipamentosOverride: equipamentos,
      equipamentosSalvosOverride: novosEquipamentosSalvos,
      etapaOverride: 'resumo',
      equipamentoAtualOverride: null,
      finalizadoOverride: false,
    });

    Alert.alert(
      'Equipamento salvo',
      'Checklist deste equipamento foi salvo no celular e sincronizado como visita em andamento.'
    );

    setEquipamentoAtual(null);
    setEtapaVisita('resumo');
  }

  function voltarParaResumoVisita() {
    setEquipamentoAtual(null);
    setEtapaVisita('resumo');
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
          const resultado = await ImagePicker.launchCameraAsync({
            quality: 0.45,
          });

          if (!resultado.canceled) {
            atualizarEquipamento('foto', resultado.assets[0].uri);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const resultado = await ImagePicker.launchImageLibraryAsync({
            quality: 0.45,
          });

          if (!resultado.canceled) {
            atualizarEquipamento('foto', resultado.assets[0].uri);
          }
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
          const resultado = await ImagePicker.launchCameraAsync({
            quality: 0.45,
          });

          if (!resultado.canceled) {
            alterarItemVisita(index, {
              foto: resultado.assets[0].uri,
            });
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const resultado = await ImagePicker.launchImageLibraryAsync({
            quality: 0.45,
          });

          if (!resultado.canceled) {
            alterarItemVisita(index, {
              foto: resultado.assets[0].uri,
            });
          }
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
    if (!texto) return; const lista = [...modelos[tipoBanco]];
    lista[editandoBancoIndex] = texto;
    salvarModelos({ ...modelos, [tipoBanco]: lista });
    setEditandoBancoIndex(null);
    setTextoEditandoBanco('');
  }

  function removerTipoBanco() {
    if (Object.keys(modelos).length === 1) {
      Alert.alert('Atenção', '�0 necessário manter pelo menos um tipo de equipamento.');
      return;
    }
    Alert.alert('Remover tipo', `Deseja remover ${tipoBanco} do Banco de Checklists FieldCheck?`, [
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
    Alert.alert('Restaurar banco inicial', 'Isso vai voltar os modelos para o padrão inicial do FieldCheck. Deseja continuar?', [
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
    const localizacaoEnvio = await capturarLocalizacaoCampo();
    const localizacaoInicioFinal = localizacaoInicio || localizacaoEnvio;
    const equipamentosCompletos = equipamentos.map((eq) => ({
      ...eq,
      itens: (eq.itens || []).map((item) => ({
        ...item,
      })),
    }));

    const numeroOsFinal = `FC-${new Date().getFullYear()}-${Date.now()}`;

    const registro = {
      id: Date.now(),
      numero_os: numeroOsFinal,
      numero_pedido: numeroPedido || null,

      numeroPedido,
      pedidoEncontrado,

      dados: {
        ...dados,
      },

      cliente: dados.cliente,
      emailCliente: dados.emailCliente,
      propriedade: dados.propriedade,
      cidade: dados.cidade,
      estado: dados.estado,
      endereco: dados.endereco,
      telefone: dados.telefone || dados.contato,
      contato: dados.contato,
      responsavel: dados.responsavel,
      tecnico: dados.tecnico,
      data: dados.data,
      observacoes: dados.observacoes,

      equipamentos: equipamentosCompletos,

      assinatura,
      tecnico_id: obterTecnicoAtualId(),
      localizacao_inicio: localizacaoInicioFinal,
      localizacao_envio: localizacaoEnvio,
      inicio_em: localizacaoInicioFinal?.capturado_em || null,
      finalizado_em: new Date().toISOString(),
      resumo,
      total_ok: resumo.ok,
      total_nao: resumo.nao,
      total_pendentes: resumo.pendentes,
      total_equipamentos: equipamentos.length,
      finalizado: true,
      status: 'finalizado',
      sincronizado: false,
      criadoEm: new Date().toISOString(),
    };

    const salvo = await getItemSeguroStorage(STORAGE_VISITAS, 'histórico local');
    const listaAtual = salvo ? JSON.parse(salvo) : [];

    const novaLista = [
      registro,
      ...listaAtual.filter((item) => {
        const mesmoPedido =
          String(item.numeroPedido || item.numero_pedido || '') === String(numeroPedido || '');

        return !mesmoPedido;
      }),
    ];

    const novaListaSegura = prepararListaHistoricoParaStorage(novaLista);
    await AsyncStorage.setItem(STORAGE_VISITAS, JSON.stringify(novaListaSegura));
    setHistorico(novaListaSegura.map(normalizarVisitaHistorico));

    const chaveVisitaFinalizada = getStorageKeyFromPedido(numeroPedido);
    if (chaveVisitaFinalizada) await AsyncStorage.removeItem(chaveVisitaFinalizada);
    await AsyncStorage.removeItem(STORAGE_KEY_LEGACY);

    try {
      const midiasRemotas = await enviarMidiasVisita({
        equipamentos: equipamentosCompletos,
        assinatura,
        empresa: obterEmpresaAtual(),
        numeroOs: numeroOsFinal,
      });

      if (dados.cliente) {
        await supabase.from('clientes').insert([
          {
            nome: dados.cliente,
            email: dados.emailCliente,
            cidade: dados.cidade,
            propriedade: dados.propriedade,
            telefone: dados.telefone || dados.contato,
            empresa: obterEmpresaAtual(),
          },
        ]);
      }

      const visitaBasica = {
        numero_os: numeroOsFinal,
        numero_pedido: numeroPedido || null,
        cliente: dados.cliente,
        tecnico: dados.tecnico || usuario?.tecnico?.nome || usuario?.email || '',
        cidade: dados.cidade,
        data_visita: dados.data,
        observacoes: dados.observacoes,
        total_ok: resumo.ok,
        total_nao: resumo.nao,
        total_pendentes: resumo.pendentes,
        total_equipamentos: equipamentos.length,
        finalizado: true,
        status: 'enviado',
        empresa: obterEmpresaAtual(),
        tecnico_id: obterTecnicoAtualId(),
        pedido_id: pedidoEncontrado?.id || null,
        criado_por: usuario?.id || null,
        enviado_em: new Date().toISOString(),
        inicio_em: registro.inicio_em,
        finalizado_em: registro.finalizado_em,
        localizacao_inicio: localizacaoInicioFinal,
        localizacao_envio: localizacaoEnvio,
        dados: registro.dados,
        equipamentos: midiasRemotas.equipamentos,
        assinatura: null,
        assinatura_path: midiasRemotas.assinaturaPath,
        resumo,
      };

      const { data: visitaInserida, error: erroInserirVisita } = await supabase
        .from('visitas')
        .insert([visitaBasica])
        .select('id')
        .single();

      if (erroInserirVisita) {
        console.log('ERRO AO SALVAR VISITA BÁSICA:', erroInserirVisita);
        await adicionarNaFilaSincronizacao(registro);
      }

      console.log('Dados enviados para Supabase');
    } catch (erro) {
      console.log('Erro Supabase:', erro);
      await adicionarNaFilaSincronizacao(registro);
    }
  }

  async function obterVisitaCompletaLocal(visitaResumo) {
    const pedidoBusca = String(
      visitaResumo?.numero_pedido ||
      visitaResumo?.numeroPedido ||
      visitaResumo?.dados?.numeroPedido ||
      ''
    ).trim();

    if (!pedidoBusca) return visitaResumo;

    const chavePedido = getStorageKeyFromPedido(pedidoBusca);
    if (!chavePedido) return visitaResumo;

    const salvoCompleto = await getItemSeguroStorage(chavePedido, 'visita completa por pedido');
    if (!salvoCompleto) return visitaResumo;

    try {
      const visitaCompleta = JSON.parse(salvoCompleto);
      if (Array.isArray(visitaCompleta?.equipamentos) && visitaCompleta.equipamentos.length > 0) {
        return visitaCompleta;
      }
    } catch (erro) {
      console.log('Erro parseando visita completa por pedido:', erro);
    }

    return visitaResumo;
  }

  function carregarVisitaNaTela(visitaOriginal, modo = 'continuar') {
    const visita = normalizarVisitaHistorico(visitaOriginal);

    console.log('ABRINDO VISITA DO HIST�RICO:', visita);
    console.log('EQUIPAMENTOS DA VISITA:', visita.equipamentos);
    console.log('DADOS DA VISITA:', visita.dados);

    if (!Array.isArray(visita.equipamentos) || visita.equipamentos.length === 0) {
      Alert.alert(
        'Relatórios incompleto',
        'Esta visita foi salva apenas com o resumo. Não encontrei os equipamentos completos para revisar ou gerar PDF. Para as próximas visitas, esta versão passa a guardar os dados completos no histórico do celular e no Supabase.'
      );
    }

    setDados(visita.dados);

    setEquipamentos(
      (visita.equipamentos || []).map((eq) => ({
        ...eq,
        itens: eq.itens || [],
      }))
    );

    setAssinatura(visita.assinatura || null);

    setPedidoEncontrado(
      visita.pedidoEncontrado || {
        numero_pedido: visita.numero_pedido || visita.numeroPedido || visita.dados?.numeroPedido || '',
        cliente: visita.cliente || visita.dados?.cliente || '',
        cidade: visita.cidade || visita.dados?.cidade || '',
        equipamentos: visita.equipamentos || [],
        status: visita.finalizado ? 'finalizado' : 'em andamento',
      }
    );

    setNumeroPedido(String(visita.numero_pedido || visita.numeroPedido || visita.dados?.numeroPedido || ''));
    setEtapaVisita('resumo');
    setEquipamentoAtual(null);
    setTela('visita');
  }

  async function continuarVisita(visita) {
    const visitaCompleta = await obterVisitaCompletaLocal(visita);
    const visitaSegura = normalizarVisitaHistorico(visitaCompleta);

    const pedirLoginAntesDeAbrir = (modo = 'continuar') => {
      setAcaoAposLogin({
        tipo: 'continuarVisita',
        visita: visitaSegura,
        modo,
      });

      setTela('pedido');

      Alert.alert(
        'Login necessário',
        'Entre com seu usuário e senha para continuar esta visita do ponto salvo.'
      );
    };

    if (visitaSegura.finalizado) {
      Alert.alert(
        'Visita finalizada',
        'Esta entrega já foi finalizada. Ela será aberta apenas para visualização, reimpressão ou reenvio do PDF.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Visualizar',
            onPress: () => {
              if (!usuario) {
                pedirLoginAntesDeAbrir('visualizar');
                return;
              }

              carregarVisitaNaTela(visitaSegura, 'visualizar');
            },
          },
        ]
      );
      return;
    }

    if (!usuario) {
      pedirLoginAntesDeAbrir('continuar');
      return;
    }

    carregarVisitaNaTela(visitaSegura, 'continuar');
  }

  function visualizarVisitaFinalizada(visita) {
    carregarVisitaNaTela(visita, 'visualizar');
  }

  function gerarPdfVisitaHistorico(visita, enviarEmail = false) {
    carregarVisitaNaTela(visita, 'visualizar');

    setTimeout(() => {
      gerarPdf(enviarEmail);
    }, 700);
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
      return `FC-${anoAtual}-0001`;
    }

    const proximoNumero = data.ultimo_numero + 1;

    await supabase
      .from('controle_entregas')
      .update({
        ultimo_numero: proximoNumero,
      })
      .eq('id', data.id);

    const numeroFormatado = String(proximoNumero).padStart(4, '0');

    return `FC-${anoAtual}-${numeroFormatado}`;
  }

  async function fazerLogin() {
    const emailLimpo = String(emailLogin || '').trim().toLowerCase();
    const senhaLimpa = String(senhaLogin || '').trim();

    if (!emailLimpo || !senhaLimpa) {
      Alert.alert('Aten??o', 'Preencha e-mail e senha.');
      return;
    }

    try {
      const { data: sessao, error: erroLogin } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senhaLimpa,
      });

      if (erroLogin || !sessao?.user) {
        Alert.alert('Aten??o', 'E-mail ou senha inv?lidos.');
        return;
      }

      const tecnico = await buscarTecnicoAtivoPorEmail(emailLimpo);

      if (!tecnico) {
        await supabase.auth.signOut();
        Alert.alert('Aten??o', 'T?cnico inativo ou sem acesso a esta empresa.');
        return;
      }

      const usuarioLogado = {
        ...sessao.user,
        nome: tecnico.nome,
        empresa: tecnico.empresa,
        tecnico,
      };

      setUsuario(usuarioLogado);

      if (acaoAposLogin?.tipo === 'continuarVisita' && acaoAposLogin?.visita) {
        const visitaPendente = acaoAposLogin.visita;
        const modoPendente = acaoAposLogin.modo || 'continuar';

        setAcaoAposLogin(null);

        setTimeout(() => {
          carregarVisitaNaTela(visitaPendente, modoPendente);
        }, 50);

        return;
      }

      setTela('pedido');
    } catch (erro) {
      console.log('Erro ao fazer login:', erro);
      Alert.alert('Erro', erro?.message || 'N?o foi poss?vel fazer login.');
    }
  }

  async function verificarLogin() {
    try {
      const { data } = await supabase.auth.getSession();

      if (data?.session?.user) {
        const tecnico = await buscarTecnicoAtivoPorEmail(data.session.user.email);
        setUsuario({
          ...data.session.user,
          nome: tecnico?.nome || data.session.user.email,
          empresa: tecnico?.empresa || obterEmpresaAtual(),
          tecnico,
        });
      }
    } catch (erro) {
      console.log('Erro ao verificar login:', erro);
    }
  }

  async function sairSistema() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  async function gerarPdf(enviarEmail = false) {
    await gerarPdfVisita({
      enviarEmail,
      equipamentos,
      dados,
      pedidoEncontrado,
      logoModule: LOGO_FIXO,
      numeroPedido,
      usuario,
      assinatura,
      gerarNumeroEntrega,
    });
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
          const itens = (eq.itens || []).filter((item) => item.ativo !== false);
          const totalItens = itens.length;
          const itensPreenchidos = itens.filter(
            (item) => item.resposta === 'OK' || item.resposta === 'NAO'
          ).length;

          const salvoManual = equipamentosSalvos[index] === true;

          const corFundo =
            status === 'nao_iniciado'
              ? '#dc2626'
              : status === 'pendente'
                ? '#f59e0b'
                : '#16a34a';

          const corTexto = status === 'pendente' ? '#111827' : '#ffffff';

          const icone =
            status === 'concluido'
              ? '�S&'
              : salvoManual || status === 'pendente'
                ? '�xx�'
                : '�x�';

          const textoStatus =
            status === 'concluido'
              ? 'Concluído'
              : salvoManual || status === 'pendente'
                ? 'Em andamento'
                : 'Não iniciado';

          return (
            <TouchableOpacity
              key={`${eq.nome}-${eq.tag || index}-${index}`}
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
                {icone} {index + 1}. {eq.nome || eq.tipo || 'Equipamento'}
              </Text>

              <Text style={[styles.abaSubTexto, { color: corTexto }]}>
                {itensPreenchidos}/{totalItens} itens ⬢ {textoStatus}
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
    setEtapaVisita('equipamento');

    const tag =
      equipamentoSelecionado.tag ||
      equipamentoSelecionado.TAG ||
      equipamentoSelecionado.codigo_tag ||
      equipamentoSelecionado.tag_equipamento ||
      equipamentoSelecionado.descritivo?.split('-')[0] ||
      equipamentoSelecionado.modelo?.split('-')[0];

    console.log('EQUIPAMENTO:', equipamentoSelecionado);
    console.log('TAG:', tag);

    if ((equipamentoSelecionado.itens || []).length > 0) {
      return;
    }

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
    const tecnicoAtual = String(usuario?.tecnico?.nome || usuario?.email || '').trim().toLowerCase();
    const pertenceAoTecnico = usuarioPodeGerenciar() || Number(visita.tecnico_id) === Number(obterTecnicoAtualId()) || String(visita.tecnico || '').trim().toLowerCase() === tecnicoAtual;
    if (!pertenceAoTecnico) return false;

    return (
      visita.cliente?.toLowerCase().includes(texto) ||
      visita.cidade?.toLowerCase().includes(texto) ||
      visita.tecnico?.toLowerCase().includes(texto)
    );
  });

  const homeScreenContextValue = {
    styles,
    LOGO_FIXO,
    historico,
    historicoFiltrado,
    setTela,
    buscaHistorico,
    setBuscaHistorico,
    Secao: SecaoEstavel,
    normalizarVisitaHistorico,
    visualizarVisitaFinalizada,
    gerarPdfVisitaHistorico,
    continuarVisita,
    acaoAposLogin,
    emailLogin,
    setEmailLogin,
    senhaLogin,
    setSenhaLogin,
    fazerLogin,
    listaPedidos,
    setNumeroPedido,
    buscarPedido,
    iniciarEntregaTecnicaPedido,
    numeroPedido,
    buscandoPedido,
    pedidoEncontrado,
    equipamentos,
    abrirMaps,
    tipoBanco,
    setTipoBanco,
    modelos,
    novoTipo,
    setNovoTipo,
    adicionarTipoBanco,
    novoItemBanco,
    setNovoItemBanco,
    adicionarItemBanco,
    editandoBancoIndex,
    textoEditandoBanco,
    setTextoEditandoBanco,
    salvarEdicaoBanco,
    setEditandoBancoIndex,
    removerItemBanco,
    removerTipoBanco,
    restaurarBancoInicial,
    etapaVisita,
    setEtapaVisita,
    equipamento,
    equipamentoAtual,
    setEquipamentoAtual,
    visitaScrollRef,
    indicadoresVisitaAtual,
    ultimoAtendimentoCliente,
    resumo,
    dados,
    atualizarCampo,
    clienteSelecionado,
    setClienteSelecionado,
    listaClientes,
    clientesUnicos,
    adicionarEquipamento,
    assinatura,
    setAssinaturaAberta,
    limparAssinatura,
    finalizarChecklist,
    gerarPdf,
    assinaturaAberta,
    assinaturaRef,
    salvarAssinatura,
    confirmarAssinatura,
    adicionarFotoItem,
    alterarItemVisita,
    editandoItemVisita,
    setEditandoItemVisita,
    textoEditandoVisita,
    setTextoEditandoVisita,
    salvarEdicaoItemVisita,
    removerItemVisita,
    atualizarEquipamento,
    salvarEquipamentoAtual,
    voltarParaResumoVisita,
    escolherFotoEquipamento,
    trocarTipoEquipamento,
    categoriasAbertas,
    toggleCategoria,
    novoItemVisita,
    setNovoItemVisita,
    adicionarItemVisita,
    progressoVisita,
    BotoesEquipamentos,
    carregarHistorico,
    BotaoOpcao: BotaoOpcaoEstavel,
    Campo: CampoEstavel,
    removerEquipamento
  };
  function renderComContexto(Componente) {
    return (
      <HomeScreenProvider value={homeScreenContextValue}>
        <Componente />
      </HomeScreenProvider>
    );
  }

  if (tela === 'historico') {
    return renderComContexto(HistoricoVisitasView);
  }

  if (!usuario) {
    return renderComContexto(LoginTecnicoView);
  }

  if (tela === 'pedido') {
    return renderComContexto(PedidosView);
  }

  if (tela === 'detalhePedido' && pedidoEncontrado) {
    return renderComContexto(DetalhePedidoView);
  }

  if (tela === 'banco') {
    return renderComContexto(BancoChecklistView);
  }

  if (tela === 'visita') {
    return renderComContexto(VisitaTecnicaView);
  }
}
