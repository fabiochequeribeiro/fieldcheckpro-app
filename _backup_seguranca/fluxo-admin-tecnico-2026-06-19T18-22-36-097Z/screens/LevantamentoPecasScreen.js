import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';

const EMPRESA_ATUAL = 'FieldCheck';

const STORAGE_RASCUNHO = '@fieldcheck_levantamento_pecas_obra_rascunho_v2';
const STORAGE_HISTORICO = '@fieldcheck_levantamento_pecas_obra_historico_v1';
const ARQUIVO_RASCUNHO_LOCAL = `${FileSystem.documentDirectory}fieldcheck_levantamento_pecas_rascunho_garantia.json`;
const ARQUIVO_HISTORICO_LOCAL = `${FileSystem.documentDirectory}fieldcheck_levantamentos_pecas_historico_garantia.json`;

function ehUUID(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(valor || ''));
}

function gerarUUID() {
  if (globalThis?.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function montarFiltroInSupabase(valores = []) {
  const lista = valores.map((valor) => JSON.stringify(String(valor))).join(',');
  return `(${lista})`;
}

const STATUS_PECAS = [
  { id: 'em_obra', label: 'Em obra', cor: '#1976d2' },
  { id: 'montada', label: 'Montada', cor: '#2e7d32' },
  { id: 'sobrando', label: 'Vai sobrar', cor: '#ef6c00' },
  { id: 'faltando', label: 'Faltando', cor: '#c62828' },
];

function textoSeguro(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function dataBrasileira(data = new Date()) {
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch (_erro) {
    return new Date().toLocaleDateString('pt-BR');
  }
}

function novaPeca() {
  return {
    id: gerarUUID(),
    codigo: '',
    descricao: '',
    quantidade: '',
    localizacao: '',
    status: 'em_obra',
    observacao: '',
    fotoUri: '',
    fotoBase64: '',
  };
}

function criarNumeroLevantamento(historico = []) {
  const ano = new Date().getFullYear();
  const totalAno = historico.filter((item) => String(item.numero || '').includes(`LP-${ano}-`)).length + 1;
  return `LP-${ano}-${String(totalAno).padStart(4, '0')}`;
}

function normalizarTextoArquivo(valor) {
  return String(valor || 'obra').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function obterStatusSincronizacao(item = {}) {
  const status = item.sincronizacao || (item.pendenteSincronizacao ? 'local' : 'sincronizado');

  if (status === 'sincronizado') {
    return {
      id: 'sincronizado',
      label: 'Sincronizado',
      detalhe: 'Salvo no celular e no Supabase',
      icone: 'cloud-done',
      cor: '#2e7d32',
      fundo: '#e8f5e9',
      borda: '#a5d6a7',
    };
  }

  if (status === 'erro') {
    return {
      id: 'erro',
      label: 'Erro de sincronização',
      detalhe: 'Salvo no celular. Tente sincronizar novamente.',
      icone: 'cloud-offline',
      cor: '#c62828',
      fundo: '#ffebee',
      borda: '#ef9a9a',
    };
  }

  return {
    id: 'local',
    label: 'Salvo no celular',
    detalhe: 'Aguardando sincronização com o Supabase',
    icone: 'phone-portrait',
    cor: '#ef6c00',
    fundo: '#fff3e0',
    borda: '#ffcc80',
  };
}

export default function LevantamentoPecasScreen() {
  const [pedido, setPedido] = useState('');
  const [cliente, setCliente] = useState('');
  const [obra, setObra] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [pecas, setPecas] = useState([novaPeca()]);
  const [historico, setHistorico] = useState([]);
  const [levantamentoAtualId, setLevantamentoAtualId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [autoSincronizando, setAutoSincronizando] = useState(false);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    const numero = String(pedido || '').trim();
    if (!numero) return;

    const timer = setTimeout(() => buscarDadosDoPedido(numero), 650);
    return () => clearTimeout(timer);
  }, [pedido]);

  useEffect(() => {
    const timer = setTimeout(() => salvarGarantiaNoCelular(pecas), 700);
    return () => clearTimeout(timer);
  }, [pedido, cliente, obra, tecnico, observacoesGerais, pecas, levantamentoAtualId]);

  const resumo = useMemo(() => calcularResumo(pecas), [pecas]);

  async function buscarDadosDoPedido(numero) {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('numero_pedido', numero)
        .eq('empresa', EMPRESA_ATUAL)
        .maybeSingle();

      if (error || !data) return;

      setCliente((atual) => atual || data.cliente || data.nome || '');
      setObra((atual) => atual || data.obra || [data.cidade, data.estado].filter(Boolean).join(' - ') || '');
    } catch (erro) {
      console.log('Não foi possível buscar dados da ordem/pedido:', erro);
    }
  }

  async function carregarDadosIniciais() {
    await Promise.all([carregarRascunho(), carregarHistorico()]);
  }

  async function lerJsonArquivoLocal(caminho, padrao) {
    try {
      const info = await FileSystem.getInfoAsync(caminho);
      if (!info.exists) return padrao;
      const conteudo = await FileSystem.readAsStringAsync(caminho);
      return conteudo ? JSON.parse(conteudo) : padrao;
    } catch (erro) {
      console.log('Erro ao ler arquivo local:', erro);
      return padrao;
    }
  }

  async function gravarJsonArquivoLocal(caminho, dados) {
    try {
      await FileSystem.writeAsStringAsync(caminho, JSON.stringify(dados));
      return true;
    } catch (erro) {
      console.log('Erro ao gravar arquivo local:', erro);
      return false;
    }
  }

  async function carregarHistorico() {
    try {
      const salvoAsync = await AsyncStorage.getItem(STORAGE_HISTORICO);
      const listaAsync = salvoAsync ? JSON.parse(salvoAsync) : [];
      const listaArquivo = await lerJsonArquivoLocal(ARQUIVO_HISTORICO_LOCAL, []);
      const listaSupabase = await carregarHistoricoSupabase();
      const combinada = mesclarHistoricos(listaAsync, listaArquivo, listaSupabase);
      setHistorico(combinada);
      await salvarHistorico(combinada, false);
      tentarSincronizarPendentes(combinada);
    } catch (erro) {
      console.log('Erro ao carregar histórico de levantamentos:', erro);
    }
  }

  async function salvarHistorico(lista, atualizarTela = true) {
    const ordenada = [...lista].sort((a, b) => new Date(b.atualizadoEm || b.data || 0) - new Date(a.atualizadoEm || a.data || 0));
    if (atualizarTela) setHistorico(ordenada);

    // Garantia principal: arquivo físico no armazenamento interno do app.
    await gravarJsonArquivoLocal(ARQUIVO_HISTORICO_LOCAL, ordenada);

    // Espelho no AsyncStorage. Se falhar por tamanho, o arquivo acima continua salvo.
    try {
      await AsyncStorage.setItem(STORAGE_HISTORICO, JSON.stringify(ordenada));
    } catch (erro) {
      console.log('AsyncStorage não conseguiu gravar histórico completo, mas o arquivo local foi salvo:', erro);
    }
  }


  function mesclarHistoricos(...listas) {
    const mapa = new Map();
    listas.flat().forEach((item) => {
      if (!item?.id) return;
      const anterior = mapa.get(item.id);
      if (!anterior) {
        mapa.set(item.id, item);
        return;
      }
      const dataItem = new Date(item.atualizadoEm || item.data || 0).getTime();
      const dataAnterior = new Date(anterior.atualizadoEm || anterior.data || 0).getTime();
      mapa.set(item.id, dataItem >= dataAnterior ? item : anterior);
    });
    return Array.from(mapa.values()).sort((a, b) => new Date(b.atualizadoEm || b.data || 0) - new Date(a.atualizadoEm || a.data || 0));
  }

  async function carregarHistoricoSupabase() {
    try {
      const { data: levantamentos, error } = await supabase
        .from('levantamentos_pecas_obra')
        .select('*')
        .eq('empresa', EMPRESA_ATUAL)
        .order('atualizado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!Array.isArray(levantamentos) || !levantamentos.length) return [];

      const ids = levantamentos.map((item) => item.id).filter(Boolean);
      const { data: itens, error: erroItens } = await supabase
        .from('levantamentos_pecas_obra_itens')
        .select('*')
        .eq('empresa', EMPRESA_ATUAL)
        .in('levantamento_id', ids);

      if (erroItens) throw erroItens;

      return levantamentos.map((levantamento) => {
        const pecasDoLevantamento = (itens || [])
          .filter((item) => item.levantamento_id === levantamento.id)
          .map((item) => ({
            id: item.id || gerarUUID(),
            codigo: item.codigo || '',
            descricao: item.descricao || '',
            quantidade: item.quantidade === null || item.quantidade === undefined ? '' : String(item.quantidade),
            localizacao: item.localizacao || '',
            status: item.situacao || 'em_obra',
            observacao: item.observacao || '',
            fotoUri: item.foto_url || '',
            fotoBase64: '',
          }));

        return {
          id: levantamento.id,
          numero: levantamento.numero || '',
          pedido: levantamento.pedido || '',
          cliente: levantamento.cliente || '',
          obra: levantamento.obra || '',
          tecnico: levantamento.tecnico || '',
          observacoesGerais: levantamento.observacoes_gerais || '',
          status: levantamento.status || 'Finalizado',
          totalPecas: pecasDoLevantamento.length,
          data: levantamento.criado_em || new Date().toISOString(),
          atualizadoEm: levantamento.atualizado_em || levantamento.criado_em || new Date().toISOString(),
          sincronizacao: 'sincronizado',
          pendenteSincronizacao: false,
          erroSincronizacao: '',
          pecas: pecasDoLevantamento.length ? pecasDoLevantamento : [novaPeca()],
        };
      });
    } catch (erro) {
      console.log('Erro ao carregar histórico do Supabase:', erro);
      return [];
    }
  }

  async function salvarLevantamentoSupabase(registro, pecasValidas) {
    try {
      const agora = new Date().toISOString();
      const cabecalho = {
        id: registro.id,
        pedido: String(registro.pedido || '').trim(),
        cliente: registro.cliente || '',
        obra: registro.obra || '',
        tecnico: registro.tecnico || '',
        observacoes_gerais: registro.observacoesGerais || '',
        status: registro.status || 'Finalizado',
        atualizado_em: agora,
        empresa: EMPRESA_ATUAL,
      };

      const { error: erroCabecalho } = await supabase
        .from('levantamentos_pecas_obra')
        .upsert(cabecalho, { onConflict: 'id' });

      if (erroCabecalho) throw erroCabecalho;

      const itens = pecasValidas.map((peca) => ({
        id: peca.id || gerarUUID(),
        levantamento_id: registro.id,
        codigo: peca.codigo || '',
        descricao: peca.descricao || '',
        quantidade: Number(String(peca.quantidade || '0').replace(',', '.')) || 0,
        situacao: peca.status || 'em_obra',
        observacao: peca.observacao || '',
        foto_url: peca.fotoUri || '',
        empresa: EMPRESA_ATUAL,
      }));

      if (itens.length) {
        const { error: erroItens } = await supabase
          .from('levantamentos_pecas_obra_itens')
          .upsert(itens, { onConflict: 'id' });
        if (erroItens) throw erroItens;
      }

      const idsAtuais = itens.map((item) => item.id).filter(Boolean);
      let removerAntigos = supabase
        .from('levantamentos_pecas_obra_itens')
        .delete()
        .eq('levantamento_id', registro.id)
        .eq('empresa', EMPRESA_ATUAL);

      if (idsAtuais.length > 0) {
        removerAntigos = removerAntigos.not('id', 'in', montarFiltroInSupabase(idsAtuais));
      }

      const { error: erroLimparItens } = await removerAntigos;
      if (erroLimparItens) throw erroLimparItens;

      return { ok: true };
    } catch (erro) {
      console.log('Erro ao salvar levantamento no Supabase:', erro);
      return { ok: false, erro };
    }
  }

  async function carregarRascunho() {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_RASCUNHO);
      const dados = salvo ? JSON.parse(salvo) : await lerJsonArquivoLocal(ARQUIVO_RASCUNHO_LOCAL, null);
      if (!dados) return;
      setLevantamentoAtualId(dados.levantamentoAtualId || null);
      setPedido(dados.pedido || '');
      setCliente(dados.cliente || '');
      setObra(dados.obra || '');
      setTecnico(dados.tecnico || '');
      setObservacoesGerais(dados.observacoesGerais || '');
      setPecas(Array.isArray(dados.pecas) && dados.pecas.length ? dados.pecas : [novaPeca()]);
    } catch (erro) {
      console.log('Erro ao carregar levantamento:', erro);
    }
  }

  async function salvarRascunhoSilencioso(listaPecas = pecas) {
    const dados = {
      levantamentoAtualId,
      pedido,
      cliente,
      obra,
      tecnico,
      observacoesGerais,
      pecas: listaPecas,
      atualizadoEm: new Date().toISOString(),
    };

    await gravarJsonArquivoLocal(ARQUIVO_RASCUNHO_LOCAL, dados);

    try {
      await AsyncStorage.setItem(STORAGE_RASCUNHO, JSON.stringify(dados));
    } catch (erro) {
      console.log('AsyncStorage não conseguiu gravar rascunho completo, mas o arquivo local foi salvo:', erro);
    }
  }

  async function salvarRascunhoManual() {
    setSalvando(true);
    await salvarGarantiaNoCelular(pecas);
    setSalvando(false);
    Alert.alert('Salvo', 'Rascunho salvo no aparelho e protegido no histórico local.');
  }

  async function salvarGarantiaNoCelular(listaPecas = pecas) {
    try {
      const temConteudo =
        String(pedido || '').trim() ||
        String(cliente || '').trim() ||
        String(obra || '').trim() ||
        String(tecnico || '').trim() ||
        String(observacoesGerais || '').trim() ||
        listaPecas.some((peca) =>
          String(peca.codigo || '').trim() ||
          String(peca.descricao || '').trim() ||
          String(peca.quantidade || '').trim() ||
          String(peca.localizacao || '').trim() ||
          String(peca.observacao || '').trim() ||
          peca.fotoUri ||
          peca.fotoBase64
        );

      if (!temConteudo) {
        await salvarRascunhoSilencioso(listaPecas);
        return;
      }

      const agora = new Date().toISOString();
      const idGarantia = ehUUID(levantamentoAtualId) ? levantamentoAtualId : gerarUUID();
      const existente = historico.find((item) => item.id === idGarantia);

      const registro = {
        id: idGarantia,
        numero: existente?.numero || criarNumeroLevantamento(historico),
        pedido,
        cliente,
        obra,
        tecnico,
        observacoesGerais,
        status: 'Rascunho local',
        totalPecas: listaPecas.filter((peca) => String(peca.codigo || '').trim() || String(peca.descricao || '').trim()).length,
        data: existente?.data || agora,
        atualizadoEm: agora,
        sincronizacao: existente?.sincronizacao === 'sincronizado' ? 'local' : (existente?.sincronizacao || 'local'),
        pendenteSincronizacao: true,
        erroSincronizacao: existente?.erroSincronizacao || '',
        pecas: listaPecas,
      };

      if (!levantamentoAtualId) setLevantamentoAtualId(idGarantia);

      const novaLista = [registro, ...historico.filter((item) => item.id !== registro.id)];
      await salvarHistorico(novaLista);
      await salvarRascunhoSilencioso(listaPecas);
    } catch (erro) {
      console.log('Erro ao salvar garantia local:', erro);
    }
  }

  function calcularResumo(listaPecas = []) {
    return STATUS_PECAS.map((status) => ({
      ...status,
      total: listaPecas.filter((peca) => peca.status === status.id).length,
    }));
  }

  function atualizarPeca(id, campo, valor) {
    setPecas((lista) => {
      const novaLista = lista.map((peca) => (peca.id === id ? { ...peca, [campo]: valor } : peca));
      salvarGarantiaNoCelular(novaLista);
      return novaLista;
    });
  }

  function adicionarPeca() {
    setPecas((lista) => {
      const novaLista = [...lista, novaPeca()];
      salvarGarantiaNoCelular(novaLista);
      return novaLista;
    });
  }

  function removerPeca(id) {
    if (pecas.length === 1) {
      const novaLista = [novaPeca()];
      setPecas(novaLista);
      salvarGarantiaNoCelular(novaLista);
      return;
    }
    Alert.alert('Remover peça', 'Deseja remover este item do levantamento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setPecas((lista) => {
          const novaLista = lista.filter((peca) => peca.id !== id);
          salvarGarantiaNoCelular(novaLista);
          return novaLista;
        }) },
    ]);
  }

  async function tirarFoto(id) {
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Autorize o uso da câmera para registrar a foto da peça.');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        quality: 0.65,
        allowsEditing: false,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets?.[0]?.uri) {
        const asset = resultado.assets[0];
        atualizarPeca(id, 'fotoUri', asset.uri);
        if (asset.base64) {
          atualizarPeca(id, 'fotoBase64', `data:image/jpeg;base64,${asset.base64}`);
        }
      }
    } catch (erro) {
      console.log('Erro ao abrir câmera:', erro);
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  }

  function validarLevantamento(lista = pecas, exigirPedido = true) {
    const pecasValidas = lista.filter((peca) => String(peca.codigo || '').trim() || String(peca.descricao || '').trim());
    if (exigirPedido && !String(pedido || '').trim()) {
      Alert.alert('Ordem obrigatória', 'Informe o número da ordem/pedido antes de salvar ou gerar o relatório.');
      return null;
    }
    if (!pecasValidas.length) {
      Alert.alert('Nenhum item lançado', 'Informe pelo menos um item com código ou descrição.');
      return null;
    }
    return pecasValidas;
  }

  function dadosAtuais() {
    return {
      id: ehUUID(levantamentoAtualId) ? levantamentoAtualId : gerarUUID(),
      pedido,
      cliente,
      obra,
      tecnico,
      observacoesGerais,
      pecas,
    };
  }

  async function atualizarRegistroSincronizacao(registroId, campos) {
    const novaLista = historico.map((item) => (
      item.id === registroId
        ? { ...item, ...campos, atualizadoEm: campos.atualizadoEm || item.atualizadoEm }
        : item
    ));
    await salvarHistorico(novaLista);
  }


  function pecasValidasSemAlerta(lista = []) {
    return lista.filter((peca) => String(peca.codigo || '').trim() || String(peca.descricao || '').trim());
  }

  async function tentarSincronizarPendentes(lista = historico) {
    const pendentes = (lista || []).filter((item) => {
      const statusSync = item.sincronizacao || (item.pendenteSincronizacao ? 'local' : 'sincronizado');
      const temPedido = String(item.pedido || '').trim();
      const temPecas = pecasValidasSemAlerta(item.pecas || []).length > 0;
      return statusSync !== 'sincronizado' && temPedido && temPecas;
    });

    if (!pendentes.length || autoSincronizando) return;

    setAutoSincronizando(true);
    let listaAtualizada = [...lista];

    for (const item of pendentes) {
      const pecasValidas = pecasValidasSemAlerta(item.pecas || []);
      const resultado = await salvarLevantamentoSupabase(item, pecasValidas);
      listaAtualizada = listaAtualizada.map((registro) => (
        registro.id === item.id
          ? {
              ...registro,
              sincronizacao: resultado.ok ? 'sincronizado' : 'erro',
              pendenteSincronizacao: !resultado.ok,
              erroSincronizacao: resultado.ok ? '' : (resultado.erro?.message || 'Erro ao sincronizar com Supabase'),
              status: resultado.ok && registro.status === 'Rascunho local' ? 'Finalizado' : registro.status,
              atualizadoEm: new Date().toISOString(),
            }
          : registro
      ));
    }

    await salvarHistorico(listaAtualizada);
    setAutoSincronizando(false);
  }

  async function sincronizarLevantamento(item) {
    const pecasValidas = validarLevantamento(item.pecas || [], false);
    if (!pecasValidas) return;

    setSalvando(true);
    const resultadoSupabase = await salvarLevantamentoSupabase(item, pecasValidas);
    setSalvando(false);

    if (resultadoSupabase.ok) {
      await atualizarRegistroSincronizacao(item.id, {
        sincronizacao: 'sincronizado',
        pendenteSincronizacao: false,
        erroSincronizacao: '',
        status: item.status === 'Rascunho local' ? 'Finalizado' : item.status,
        atualizadoEm: new Date().toISOString(),
      });
      Alert.alert('Sincronizado', `${item.numero || 'Levantamento'} foi salvo no Supabase.`);
    } else {
      await atualizarRegistroSincronizacao(item.id, {
        sincronizacao: 'erro',
        pendenteSincronizacao: true,
        erroSincronizacao: resultadoSupabase.erro?.message || 'Erro ao sincronizar com Supabase',
        atualizadoEm: new Date().toISOString(),
      });
      Alert.alert('Salvo no celular', 'Não conseguiu sincronizar com o Supabase agora. O levantamento continua seguro no aparelho.');
    }
  }

  async function salvarLevantamentoNoHistorico(mostrarAlerta = true) {
    const pecasValidas = validarLevantamento();
    if (!pecasValidas) return null;

    try {
      const base = dadosAtuais();
      const existente = historico.find((item) => item.id === base.id);
      const agora = new Date().toISOString();
      const registroLocal = {
        ...base,
        numero: existente?.numero || criarNumeroLevantamento(historico),
        status: 'Finalizado',
        totalPecas: pecasValidas.length,
        data: existente?.data || agora,
        atualizadoEm: agora,
        sincronizacao: 'local',
        pendenteSincronizacao: true,
        erroSincronizacao: '',
      };

      const listaLocal = [registroLocal, ...historico.filter((item) => item.id !== registroLocal.id)];
      await salvarHistorico(listaLocal);
      setLevantamentoAtualId(registroLocal.id);
      await salvarRascunhoSilencioso(registroLocal.pecas);

      const resultadoSupabase = await salvarLevantamentoSupabase(registroLocal, pecasValidas);
      const registroFinal = {
        ...registroLocal,
        sincronizacao: resultadoSupabase.ok ? 'sincronizado' : 'erro',
        pendenteSincronizacao: !resultadoSupabase.ok,
        erroSincronizacao: resultadoSupabase.ok ? '' : (resultadoSupabase.erro?.message || 'Erro ao sincronizar com Supabase'),
        atualizadoEm: new Date().toISOString(),
      };

      await salvarHistorico([registroFinal, ...historico.filter((item) => item.id !== registroFinal.id)]);

      if (mostrarAlerta) {
        if (resultadoSupabase.ok) {
          Alert.alert('Histórico salvo', `${registroFinal.numero} salvo no aparelho e sincronizado com o Supabase.`);
        } else {
          Alert.alert(
            'Salvo no aparelho',
            'O levantamento foi salvo no celular, mas não conseguiu sincronizar com o Supabase. Ele ficará marcado como pendente/erro para tentar novamente.'
          );
        }
      }
      return registroFinal;
    } catch (erro) {
      console.log('Erro ao salvar no histórico:', erro);
      Alert.alert('Erro', 'Não foi possível salvar o levantamento no histórico. O rascunho local continua protegido no celular.');
      return null;
    }
  }

  function montarHtml(registroOuDados, listaPecas) {
    const dados = registroOuDados || dadosAtuais();
    const pecasValidas = listaPecas || validarLevantamento(dados.pecas || pecas);
    if (!pecasValidas) return '';

    const linhas = pecasValidas.map((peca, index) => {
      const status = STATUS_PECAS.find((item) => item.id === peca.status)?.label || peca.status;
      const fotoSrc = peca.fotoBase64 || peca.fotoUri || '';
      const foto = fotoSrc ? `<img class="foto" src="${fotoSrc}" />` : '';
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${textoSeguro(peca.codigo)}</td>
          <td>${textoSeguro(peca.descricao)}</td>
          <td>${textoSeguro(peca.quantidade)}</td>
          <td>${textoSeguro(peca.localizacao)}</td>
          <td>${textoSeguro(status)}</td>
          <td>${textoSeguro(peca.observacao)}</td>
        </tr>
        ${foto ? `<tr><td colspan="7">${foto}</td></tr>` : ''}
      `;
    }).join('');

    const cardsResumo = STATUS_PECAS.map((status) => {
      const total = pecasValidas.filter((peca) => peca.status === status.id).length;
      return `<div class="card"><strong>${total}</strong><span>${status.label}</span></div>`;
    }).join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #1b2633; padding: 24px; }
            .topo { border-bottom: 4px solid #123c69; padding-bottom: 12px; margin-bottom: 18px; }
            h1 { color: #123c69; font-size: 22px; margin: 0 0 6px; }
            .sub { font-size: 12px; color: #52616f; }
            .dados { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
            .campo { border: 1px solid #d6dee6; border-radius: 8px; padding: 8px; }
            .campo b { color: #123c69; }
            .resumo { display: flex; gap: 8px; margin: 16px 0; }
            .card { flex: 1; border: 1px solid #d6dee6; border-radius: 10px; padding: 10px; text-align: center; }
            .card strong { display: block; font-size: 22px; color: #123c69; }
            .card span { font-size: 11px; color: #52616f; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10.5px; }
            th { background: #123c69; color: #fff; padding: 8px; text-align: left; }
            td { border: 1px solid #d6dee6; padding: 7px; vertical-align: top; }
            .foto { max-width: 260px; max-height: 260px; object-fit: contain; margin-top: 6px; border: 1px solid #d6dee6; border-radius: 8px; }
            .obs { margin-top: 18px; border: 1px solid #d6dee6; border-radius: 8px; padding: 10px; }
          </style>
        </head>
        <body>
          <div class="topo">
            <h1>Inventário de Campo</h1>
            <div class="sub">${textoSeguro(dados.numero || 'Rascunho')} • Relatório gerado em ${dataBrasileira()}</div>
          </div>
          <div class="dados">
            <div class="campo"><b>Pedido:</b> ${textoSeguro(dados.pedido)}</div>
            <div class="campo"><b>Cliente:</b> ${textoSeguro(dados.cliente)}</div>
            <div class="campo"><b>Obra/Cidade:</b> ${textoSeguro(dados.obra)}</div>
            <div class="campo"><b>Técnico:</b> ${textoSeguro(dados.tecnico)}</div>
          </div>
          <div class="resumo">${cardsResumo}</div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Código</th><th>Descrição</th><th>Qtde</th><th>Localização</th><th>Situação</th><th>Observação</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
          <div class="obs"><b>Observações gerais:</b><br />${textoSeguro(dados.observacoesGerais).replace(/\n/g, '<br />')}</div>
        </body>
      </html>
    `;
  }

  async function gerarPdf(registro = null) {
    const dados = registro || dadosAtuais();
    const pecasValidas = registro ? validarLevantamento(registro.pecas || [], false) : validarLevantamento();
    if (!pecasValidas) return;

    try {
      let registroSalvo = registro;
      if (!registro) {
        registroSalvo = await salvarLevantamentoNoHistorico(false);
        if (!registroSalvo) return;
      }

      const html = montarHtml(registroSalvo || dados, pecasValidas);
      const arquivo = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(arquivo.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar inventário de campo',
        });
      } else {
        await Share.share({ message: `Levantamento de peças gerado: ${arquivo.uri}` });
      }
    } catch (erro) {
      console.log('Erro ao gerar PDF:', erro);
      Alert.alert('Erro', 'Não foi possível gerar o relatório em PDF.');
    }
  }

  function gerarCsv(dados, listaPecas) {
    const cabecalho = ['Número', 'Pedido', 'Cliente', 'Obra', 'Técnico', 'Código', 'Descrição', 'Quantidade', 'Localização', 'Situação', 'Observação'];
    const linhas = listaPecas.map((peca) => {
      const status = STATUS_PECAS.find((item) => item.id === peca.status)?.label || peca.status;
      return [dados.numero || '', dados.pedido, dados.cliente, dados.obra, dados.tecnico, peca.codigo, peca.descricao, peca.quantidade, peca.localizacao, status, peca.observacao]
        .map((valor) => `"${String(valor || '').replace(/"/g, '""')}"`)
        .join(';');
    });
    return '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\n');
  }

  async function exportarExcelCsv(registro = null) {
    const dados = registro || dadosAtuais();
    const pecasValidas = registro ? validarLevantamento(registro.pecas || [], false) : validarLevantamento();
    if (!pecasValidas) return;

    try {
      let registroSalvo = registro;
      if (!registro) {
        registroSalvo = await salvarLevantamentoNoHistorico(false);
        if (!registroSalvo) return;
      }

      const csv = gerarCsv(registroSalvo || dados, pecasValidas);
      const nomeArquivo = normalizarTextoArquivo(`inventario-campo-${(registroSalvo || dados).numero || dados.pedido || 'obra'}.csv`);
      const uri = `${FileSystem.cacheDirectory}${nomeArquivo}`;
      await FileSystem.writeAsStringAsync(uri, csv);

      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        Alert.alert('Erro', 'O arquivo CSV não foi criado.');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar levantamento para Excel',
        });
      } else {
        await Share.share({ message: csv });
      }
    } catch (erro) {
      console.log('Erro ao exportar CSV:', erro);
      Alert.alert('Erro ao exportar', erro?.message || 'Não foi possível exportar a planilha.');
    }
  }

  function abrirLevantamento(item) {
    Alert.alert('Abrir levantamento', `Deseja abrir ${item.numero}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abrir',
        onPress: async () => {
          setLevantamentoAtualId(item.id);
          setPedido(item.pedido || '');
          setCliente(item.cliente || '');
          setObra(item.obra || '');
          setTecnico(item.tecnico || '');
          setObservacoesGerais(item.observacoesGerais || '');
          setPecas(Array.isArray(item.pecas) && item.pecas.length ? item.pecas : [novaPeca()]);
          await salvarRascunhoSilencioso();
        },
      },
    ]);
  }

  function excluirLevantamento(id) {
    Alert.alert('Excluir histórico', 'Deseja remover este levantamento do histórico?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const novaLista = historico.filter((item) => item.id !== id);
          await salvarHistorico(novaLista);
          try {
            await supabase.from('levantamentos_pecas_obra_itens').delete().eq('levantamento_id', id).eq('empresa', EMPRESA_ATUAL);
            await supabase.from('levantamentos_pecas_obra').delete().eq('id', id).eq('empresa', EMPRESA_ATUAL);
          } catch (erro) {
            console.log('Erro ao excluir levantamento no Supabase:', erro);
          }
          if (levantamentoAtualId === id) setLevantamentoAtualId(null);
        },
      },
    ]);
  }


  async function recuperarUltimoRascunho() {
    try {
      const salvoAsync = await AsyncStorage.getItem(STORAGE_RASCUNHO);
      const rascunhoAsync = salvoAsync ? JSON.parse(salvoAsync) : null;
      const rascunhoArquivo = await lerJsonArquivoLocal(ARQUIVO_RASCUNHO_LOCAL, null);

      const opcoes = [rascunhoAsync, rascunhoArquivo]
        .filter(Boolean)
        .sort((a, b) => new Date(b.atualizadoEm || 0) - new Date(a.atualizadoEm || 0));

      const dados = opcoes[0];
      if (!dados) {
        Alert.alert('Sem rascunho', 'Não encontrei um rascunho salvo no aparelho.');
        return;
      }

      setLevantamentoAtualId(dados.levantamentoAtualId || dados.id || null);
      setPedido(dados.pedido || '');
      setCliente(dados.cliente || '');
      setObra(dados.obra || '');
      setTecnico(dados.tecnico || '');
      setObservacoesGerais(dados.observacoesGerais || '');
      setPecas(Array.isArray(dados.pecas) && dados.pecas.length ? dados.pecas : [novaPeca()]);
      await salvarGarantiaNoCelular(Array.isArray(dados.pecas) && dados.pecas.length ? dados.pecas : [novaPeca()]);
      Alert.alert('Rascunho recuperado', 'O último rascunho salvo no celular foi aberto.');
    } catch (erro) {
      console.log('Erro ao recuperar rascunho:', erro);
      Alert.alert('Erro', 'Não foi possível recuperar o rascunho local.');
    }
  }

  async function exportarBackupJson() {
    try {
      await salvarGarantiaNoCelular(pecas);
      const dadosBackup = {
        versao: 'fieldcheck-inventario-campo-backup-v1',
        exportadoEm: new Date().toISOString(),
        rascunhoAtual: {
          levantamentoAtualId,
          pedido,
          cliente,
          obra,
          tecnico,
          observacoesGerais,
          pecas,
          atualizadoEm: new Date().toISOString(),
        },
        historico,
      };

      const nomeArquivo = normalizarTextoArquivo(`backup-inventario-campo-${pedido || levantamentoAtualId || 'obra'}.json`);
      const uri = `${FileSystem.cacheDirectory}${nomeArquivo}`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(dadosBackup, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar backup do levantamento',
        });
      } else {
        await Share.share({ message: JSON.stringify(dadosBackup) });
      }
    } catch (erro) {
      console.log('Erro ao exportar backup:', erro);
      Alert.alert('Erro', 'Não foi possível exportar o backup JSON.');
    }
  }

  function limparTudo() {
    Alert.alert('Novo levantamento', 'Deseja limpar os dados atuais e começar outro levantamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          setLevantamentoAtualId(null);
          setPedido('');
          setCliente('');
          setObra('');
          setTecnico('');
          setObservacoesGerais('');
          setPecas([novaPeca()]);
          await AsyncStorage.removeItem(STORAGE_RASCUNHO);
          try { await FileSystem.deleteAsync(ARQUIVO_RASCUNHO_LOCAL, { idempotent: true }); } catch (_erro) {}
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <View style={styles.headerIcone}>
              <Ionicons name="cube" size={30} color="#fff" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.titulo}>Inventário de Campo</Text>
              <Text style={styles.subtitulo}>Controle itens em campo: encontrados, instalados, sobrando ou faltando.</Text>
            </View>
          </View>

          <View style={styles.cardDestaque}>
            <Text style={styles.destaqueTitulo}>Histórico ativo</Text>
            <Text style={styles.destaqueTexto}>{levantamentoAtualId ? 'Você está editando um levantamento salvo.' : 'Novo levantamento em rascunho.'}</Text>
            {levantamentoAtualId ? (() => {
              const atual = historico.find((item) => item.id === levantamentoAtualId);
              const sync = obterStatusSincronizacao(atual || { sincronizacao: 'local' });
              return (
                <View style={[styles.syncBadge, { backgroundColor: sync.fundo, borderColor: sync.borda }]}>
                  <Ionicons name={sync.icone} size={15} color={sync.cor} />
                  <Text style={[styles.syncBadgeTexto, { color: sync.cor }]}>{sync.label}</Text>
                </View>
              );
            })() : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Dados da obra</Text>
            <TextInput style={styles.input} placeholder="Número da Ordem/Pedido" placeholderTextColor="#667085" value={pedido} onChangeText={setPedido} keyboardType="number-pad" />
            <TextInput style={styles.input} placeholder="Cliente" placeholderTextColor="#667085" value={cliente} onChangeText={setCliente} />
            <TextInput style={styles.input} placeholder="Local / Cidade" placeholderTextColor="#667085" value={obra} onChangeText={setObra} />
            <TextInput style={styles.input} placeholder="Responsável" placeholderTextColor="#667085" value={tecnico} onChangeText={setTecnico} />
          </View>

          <View style={styles.resumoLinha}>
            {resumo.map((item) => (
              <View key={item.id} style={styles.resumoCard}>
                <Text style={[styles.resumoNumero, { color: item.cor }]}>{item.total}</Text>
                <Text style={styles.resumoLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {pecas.map((peca, index) => (
            <View key={peca.id} style={styles.card}>
              <View style={styles.pecaTopo}>
                <Text style={styles.cardTitulo}>Item {index + 1}</Text>
                <TouchableOpacity onPress={() => removerPeca(peca.id)} style={styles.botaoRemover}>
                  <Ionicons name="trash" size={18} color="#c62828" />
                  <Text style={styles.textoRemover}>Remover</Text>
                </TouchableOpacity>
              </View>

              <TextInput style={styles.input} placeholder="Código do item" placeholderTextColor="#667085" value={peca.codigo} onChangeText={(valor) => atualizarPeca(peca.id, 'codigo', valor)} />
              <TextInput style={styles.input} placeholder="Descrição do item" placeholderTextColor="#667085" value={peca.descricao} onChangeText={(valor) => atualizarPeca(peca.id, 'descricao', valor)} />
              <TextInput
                style={styles.input}
                placeholder="Quantidade"
                placeholderTextColor="#667085"
                value={peca.quantidade}
                onChangeText={(valor) => atualizarPeca(peca.id, 'quantidade', valor)}
                keyboardType="numeric"
                selectTextOnFocus={true}
              />
              <TextInput style={styles.input} placeholder="Localização no campo" placeholderTextColor="#667085" value={peca.localizacao} onChangeText={(valor) => atualizarPeca(peca.id, 'localizacao', valor)} />

              <Text style={styles.label}>Situação</Text>
              <View style={styles.statusLinha}>
                {STATUS_PECAS.map((status) => {
                  const ativo = peca.status === status.id;
                  return (
                    <TouchableOpacity
                      key={status.id}
                      style={[styles.statusBotao, ativo && { backgroundColor: status.cor, borderColor: status.cor }]}
                      onPress={() => atualizarPeca(peca.id, 'status', status.id)}
                    >
                      <Text style={[styles.statusTexto, ativo && styles.statusTextoAtivo]}>{status.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observação do item"
                placeholderTextColor="#667085"
                value={peca.observacao}
                onChangeText={(valor) => atualizarPeca(peca.id, 'observacao', valor)}
                multiline
              />

              {peca.fotoUri ? <Image source={{ uri: peca.fotoUri }} style={styles.foto} /> : null}
              <TouchableOpacity style={styles.botaoFoto} onPress={() => tirarFoto(peca.id)}>
                <Ionicons name="camera" size={20} color="#123c69" />
                <Text style={styles.botaoFotoTexto}>{peca.fotoUri ? 'Trocar foto' : 'Adicionar foto'}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarPeca}>
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.botaoAdicionarTexto}>Adicionar item</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Observações gerais</Text>
            <TextInput
              style={[styles.input, styles.textAreaGrande]}
              placeholder="Exemplo: obra antiga, peças sem identificação, material separado próximo ao elevador..."
              placeholderTextColor="#667085"
              value={observacoesGerais}
              onChangeText={setObservacoesGerais}
              multiline
            />
          </View>

          <View style={styles.acoes}>
            <TouchableOpacity style={styles.botaoSecundario} onPress={salvarRascunhoManual} disabled={salvando}>
              <Ionicons name="save" size={19} color="#123c69" />
              <Text style={styles.botaoSecundarioTexto}>{salvando ? 'Salvando...' : 'Rascunho'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoSecundario} onPress={() => exportarExcelCsv()}>
              <Ionicons name="document-text" size={19} color="#123c69" />
              <Text style={styles.botaoSecundarioTexto}>Excel</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.botaoHistorico} onPress={() => salvarLevantamentoNoHistorico(true)}>
            <Ionicons name="archive" size={21} color="#fff" />
            <Text style={styles.botaoPdfTexto}>Salvar no histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoPdf} onPress={() => gerarPdf()}>
            <Ionicons name="print" size={21} color="#fff" />
            <Text style={styles.botaoPdfTexto}>Gerar relatório PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoLimpar} onPress={limparTudo}>
            <Text style={styles.botaoLimparTexto}>Novo levantamento / limpar tela</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.pecaTopo}>
              <Text style={styles.cardTitulo}>Histórico de levantamentos</Text>
              <Text style={styles.historicoContador}>{historico.length}</Text>
            </View>

            {historico.length === 0 ? (
              <Text style={styles.vazioTexto}>Nenhum levantamento salvo ainda.</Text>
            ) : (
              historico.map((item) => {
                const resumoItem = calcularResumo(item.pecas || []);
                const sync = obterStatusSincronizacao(item);
                return (
                  <View key={item.id} style={styles.historicoCard}>
                    <View style={styles.historicoTopo}>
                      <View style={styles.historicoIcone}>
                        <Ionicons name="cube" size={22} color="#123c69" />
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.historicoNumero}>{item.numero}</Text>
                        <Text style={styles.historicoTexto}>Pedido: {item.pedido || '-'}</Text>
                        <Text style={styles.historicoTexto}>Cliente: {item.cliente || '-'}</Text>
                        <Text style={styles.historicoTexto}>Data: {dataBrasileira(item.data)}</Text>
                        <View style={[styles.syncBadge, { backgroundColor: sync.fundo, borderColor: sync.borda }]}>
                          <Ionicons name={sync.icone} size={14} color={sync.cor} />
                          <Text style={[styles.syncBadgeTexto, { color: sync.cor }]}>{sync.label}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.historicoResumoLinha}>
                      {resumoItem.map((res) => (
                        <Text key={res.id} style={[styles.historicoResumoTexto, { color: res.cor }]}>{res.label}: {res.total}</Text>
                      ))}
                    </View>

                    <View style={styles.historicoAcoes}>
                      <TouchableOpacity style={styles.historicoBotao} onPress={() => abrirLevantamento(item)}>
                        <Ionicons name="open" size={17} color="#123c69" />
                        <Text style={styles.historicoBotaoTexto}>Abrir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.historicoBotao} onPress={() => gerarPdf(item)}>
                        <Ionicons name="print" size={17} color="#123c69" />
                        <Text style={styles.historicoBotaoTexto}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.historicoBotao} onPress={() => exportarExcelCsv(item)}>
                        <Ionicons name="document-text" size={17} color="#123c69" />
                        <Text style={styles.historicoBotaoTexto}>Excel</Text>
                      </TouchableOpacity>
                      {sync.id !== 'sincronizado' ? (
                        <TouchableOpacity style={styles.historicoBotao} onPress={() => sincronizarLevantamento(item)} disabled={salvando}>
                          <Ionicons name="cloud-upload" size={17} color="#123c69" />
                          <Text style={styles.historicoBotaoTexto}>Sync</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity style={styles.historicoBotaoExcluir} onPress={() => excluirLevantamento(item.id)}>
                        <Ionicons name="trash" size={17} color="#c62828" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#eef3f8' },
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123c69',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  headerIcone: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0b2b4d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titulo: { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtitulo: { color: '#dce8f2', fontSize: 12, marginTop: 4, lineHeight: 17 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d8e2ec',
  },
  cardDestaque: {
    backgroundColor: '#eaf3ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfd7ff',
  },
  destaqueTitulo: { color: '#123c69', fontSize: 14, fontWeight: '900' },
  destaqueTexto: { color: '#425466', fontSize: 12, fontWeight: '700', marginTop: 2 },
  syncBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncBadgeTexto: { fontSize: 11, fontWeight: '900' },
  cardTitulo: { color: '#123c69', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d5e0ea',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 10,
    color: '#1b2633',
    fontWeight: '600',
  },
  textArea: { minHeight: 74, textAlignVertical: 'top' },
  textAreaGrande: { minHeight: 105, textAlignVertical: 'top' },
  resumoLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  resumoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d8e2ec',
    alignItems: 'center',
  },
  resumoNumero: { fontSize: 24, fontWeight: '900' },
  resumoLabel: { color: '#52616f', fontSize: 12, marginTop: 2, fontWeight: '700' },
  pecaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  botaoRemover: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5 },
  textoRemover: { color: '#c62828', fontWeight: '700', fontSize: 12 },
  label: { color: '#52616f', fontWeight: '800', marginBottom: 7 },
  statusLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  statusBotao: {
    borderWidth: 1,
    borderColor: '#c8d4df',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  statusTexto: { color: '#425466', fontSize: 12, fontWeight: '800' },
  statusTextoAtivo: { color: '#fff' },
  foto: { width: '100%', height: 210, borderRadius: 14, marginBottom: 10, backgroundColor: '#eef3f8' },
  botaoFoto: {
    borderWidth: 1,
    borderColor: '#bfd0df',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  botaoFotoTexto: { color: '#123c69', fontWeight: '800' },
  botaoAdicionar: {
    backgroundColor: '#123c69',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  botaoAdicionarTexto: { color: '#fff', fontSize: 16, fontWeight: '900' },
  acoes: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  botaoSecundario: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bfd0df',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  botaoSecundarioTexto: { color: '#123c69', fontWeight: '900' },
  botaoHistorico: {
    backgroundColor: '#123c69',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  botaoPdf: {
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  botaoPdfTexto: { color: '#fff', fontSize: 16, fontWeight: '900' },
  botaoLimpar: { alignItems: 'center', paddingVertical: 12 },
  botaoLimparTexto: { color: '#c62828', fontWeight: '800' },
  syncBanner: {
    backgroundColor: '#eaf3ff',
    borderWidth: 1,
    borderColor: '#bfd7ff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  syncBannerTexto: { color: '#123c69', fontWeight: '800', fontSize: 12 },
  historicoContador: { color: '#123c69', fontWeight: '900', fontSize: 16 },
  vazioTexto: { color: '#667085', fontSize: 14, fontWeight: '700' },
  historicoCard: {
    borderWidth: 1,
    borderColor: '#d8e2ec',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fbfdff',
  },
  historicoTopo: { flexDirection: 'row', alignItems: 'center' },
  historicoIcone: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#eaf3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historicoNumero: { color: '#123c69', fontWeight: '900', fontSize: 15 },
  historicoTexto: { color: '#52616f', fontWeight: '700', fontSize: 12, marginTop: 2 },
  historicoResumoLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  historicoResumoTexto: { fontSize: 11, fontWeight: '900' },
  historicoAcoes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  historicoBotao: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bfd0df',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#fff',
  },
  historicoBotaoTexto: { color: '#123c69', fontWeight: '900', fontSize: 12 },
  historicoBotaoExcluir: {
    width: 40,
    borderWidth: 1,
    borderColor: '#f0c3c3',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
  },
});
