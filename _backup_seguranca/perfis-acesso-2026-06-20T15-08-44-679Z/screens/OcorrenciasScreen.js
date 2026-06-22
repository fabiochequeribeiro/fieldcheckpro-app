import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { obterEmpresaAtual } from '../utils/sessaoOperacional';
import { enviarFotosOcorrencia } from '../services/campoMidiaService';
import { capturarLocalizacaoCampo } from '../services/campoLocalizacaoService';


const STORAGE_OCORRENCIAS = '@fieldcheck_ocorrencias_obra';
const STORAGE_OCORRENCIAS_FILA = '@fieldcheck_ocorrencias_obra_fila_sync';
const STORAGE_PEDIDOS_CACHE = '@fieldcheck_cache_pedidos';

const TIPOS_OCORRENCIA = [
  'Peça faltante',
  'Peça danificada',
  'Peça perdida em obra',
  'Erro de envio',
  'Avaria no transporte',
  'Montagem incorreta',
  'Outro',
];

const URGENCIAS = ['Normal', 'Alta', 'Crítica'];
const STATUS = ['aberta', 'enviada para matriz', 'em análise', 'resolvida'];

function gerarIdLocal() {
  return `local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function formatarDataBr(dataIso) {
  if (!dataIso) return '';
  try {
    return new Date(dataIso).toLocaleString('pt-BR');
  } catch (erro) {
    return String(dataIso);
  }
}

async function lerJson(chave, fallback) {
  try {
    const texto = await AsyncStorage.getItem(chave);
    return texto ? JSON.parse(texto) : fallback;
  } catch (erro) {
    console.log('Erro lendo storage:', chave, erro);
    return fallback;
  }
}

async function salvarJson(chave, valor) {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.log('Erro salvando storage:', chave, erro);
  }
}

function normalizarOcorrencia(item = {}) {
  const criadoEm = item.created_at || item.criado_em || new Date().toISOString();
  return {
    id: item.local_id || item.id || gerarIdLocal(),
    numero_pedido: String(item.numero_pedido || item.numeroPedido || '').trim(),
    cliente: item.cliente || '',
    cidade: item.cidade || '',
    tecnico: item.tecnico || '',
    tipo_ocorrencia: item.tipo_ocorrencia || item.tipo || 'Peça faltante',
    equipamento: item.equipamento || '',
    peca: item.peca || item.peça || '',
    codigo_peca: item.codigo_peca || item.codigo || '',
    quantidade: String(item.quantidade || ''),
    urgencia: item.urgencia || 'Normal',
    descricao: item.descricao || '',
    fotos: Array.isArray(item.fotos) ? item.fotos : [],
    status: item.status || 'aberta',
    created_at: criadoEm,
    sincronizado: item.sincronizado === true,
    empresa: item.empresa || obterEmpresaAtual(),
    localizacao: item.localizacao || null,
  };
}


function extensaoParaMime(uri = '') {
  const texto = String(uri || '').toLowerCase();
  if (texto.includes('.png')) return 'image/png';
  if (texto.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function montarDataUri(base64, mime = 'image/jpeg') {
  if (!base64) return '';
  const texto = String(base64 || '');
  if (texto.startsWith('data:image')) return texto;
  return `data:${mime};base64,${texto}`;
}

async function converterUriParaDataUri(uri) {
  if (!uri) return '';

  const uriTexto = String(uri || '');
  if (uriTexto.startsWith('data:image')) return uriTexto;
  if (uriTexto.startsWith('http://') || uriTexto.startsWith('https://')) return uriTexto;

  try {
    const info = await FileSystem.getInfoAsync(uriTexto);
    if (!info.exists) {
      console.log('Foto não encontrada para converter:', uriTexto);
      return '';
    }

    const base64 = await FileSystem.readAsStringAsync(uriTexto, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return montarDataUri(base64, extensaoParaMime(uriTexto));
  } catch (erro) {
    console.log('Erro convertendo foto para Base64:', erro);
    return '';
  }
}

async function salvarFotoPermanente(uriOriginal, base64Original = '') {
  if (!uriOriginal) return null;

  const uriTexto = String(uriOriginal);

  if (uriTexto.startsWith('data:image')) {
    return { uri: uriTexto, uriOriginal: uriTexto, dataUri: uriTexto };
  }

  const dataUriInicial = montarDataUri(base64Original, extensaoParaMime(uriTexto));

  try {
    const pasta = `${FileSystem.documentDirectory}ocorrencias_fotos/`;
    const infoPasta = await FileSystem.getInfoAsync(pasta);

    if (!infoPasta.exists) {
      await FileSystem.makeDirectoryAsync(pasta, { intermediates: true });
    }

    const extensao = uriTexto.toLowerCase().includes('.png')
      ? 'png'
      : uriTexto.toLowerCase().includes('.webp')
        ? 'webp'
        : 'jpg';

    const destino = `${pasta}foto_${Date.now()}_${Math.floor(Math.random() * 10000)}.${extensao}`;

    await FileSystem.copyAsync({
      from: uriTexto,
      to: destino,
    });

    const dataUri = dataUriInicial || await converterUriParaDataUri(destino);

    return { uri: destino, uriOriginal: uriTexto, dataUri };
  } catch (erro) {
    console.log('Erro salvando foto permanente:', erro);
    const dataUri = dataUriInicial || await converterUriParaDataUri(uriTexto);
    return { uri: uriTexto, uriOriginal: uriTexto, dataUri };
  }
}

async function prepararFotosParaPdf(fotos = []) {
  const lista = Array.isArray(fotos) ? fotos : [];

  const convertidas = await Promise.all(
    lista.map(async (foto) => {
      const fotoObj = typeof foto === 'object' && foto !== null ? foto : { uri: foto };

      const pronta =
        fotoObj.uriPdf ||
        fotoObj.dataUri ||
        fotoObj.base64Data ||
        montarDataUri(fotoObj.base64, extensaoParaMime(fotoObj.uri || fotoObj.uriOriginal || ''));

      if (pronta) {
        return {
          ...fotoObj,
          uriPdf: pronta,
        };
      }

      const candidatos = [fotoObj.uri, fotoObj.uriOriginal].filter(Boolean);

      for (const uri of candidatos) {
        const dataUri = await converterUriParaDataUri(uri);
        if (dataUri) {
          return {
            ...fotoObj,
            uriPdf: dataUri,
          };
        }
      }

      return {
        ...fotoObj,
        uriPdf: '',
        erroPdf: 'Não foi possível converter a foto para o PDF.',
      };
    })
  );

  return convertidas.filter(Boolean);
}

function montarHtmlOcorrencia(ocorrencia) {
  const fotos = (ocorrencia.fotos || [])
    .map(
      (foto) => {
        const src = String(foto.uriPdf || foto.dataUri || '');
        if (!src || !src.startsWith('data:image')) {
          return `
            <div class="fotoBox">
              <p>Foto indisponível para este relatório.</p>
              <p>${foto.data ? formatarDataBr(foto.data) : ''}</p>
            </div>`;
        }

        return `
          <div class="fotoBox">
            <img src="${src}" />
            <p>${foto.data ? formatarDataBr(foto.data) : ''}</p>
          </div>`;
      }
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
          .topo { border-bottom: 4px solid #123c69; padding-bottom: 12px; margin-bottom: 18px; }
          h1 { color: #123c69; font-size: 24px; margin: 0; }
          h2 { color: #123c69; font-size: 18px; margin-top: 24px; }
          .sub { color: #475569; font-size: 13px; margin-top: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .campo { border: 1px solid #dbe4ea; border-radius: 8px; padding: 10px; background: #f8fafc; }
          .label { font-weight: bold; color: #334155; font-size: 12px; }
          .valor { margin-top: 4px; font-size: 15px; }
          .descricao { white-space: pre-wrap; border: 1px solid #dbe4ea; border-radius: 8px; padding: 12px; min-height: 80px; }
          .status { display: inline-block; background: #fef3c7; padding: 7px 10px; border-radius: 999px; font-weight: bold; }
          .fotos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .fotoBox { border: 1px solid #dbe4ea; border-radius: 10px; padding: 8px; page-break-inside: avoid; }
          .fotoBox img { width: 280px; height: 280px; object-fit: contain; border-radius: 8px; display: block; margin: 0 auto; }
          .rodape { margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #dbe4ea; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="topo">
          <h1>Relatório de Ocorrência de Obra</h1>
          <div class="sub">FieldCheck Pro ⬢ Gerado em ${formatarDataBr(new Date().toISOString())}</div>
        </div>

        <div class="grid">
          <div class="campo"><div class="label">Pedido</div><div class="valor">${ocorrencia.numero_pedido || '-'}</div></div>
          <div class="campo"><div class="label">Cliente</div><div class="valor">${ocorrencia.cliente || '-'}</div></div>
          <div class="campo"><div class="label">Cidade</div><div class="valor">${ocorrencia.cidade || '-'}</div></div>
          <div class="campo"><div class="label">Técnico</div><div class="valor">${ocorrencia.tecnico || '-'}</div></div>
          <div class="campo"><div class="label">Tipo</div><div class="valor">${ocorrencia.tipo_ocorrencia || '-'}</div></div>
          <div class="campo"><div class="label">Urgência</div><div class="valor">${ocorrencia.urgencia || '-'}</div></div>
          <div class="campo"><div class="label">Equipamento</div><div class="valor">${ocorrencia.equipamento || '-'}</div></div>
          <div class="campo"><div class="label">Status</div><div class="valor"><span class="status">${ocorrencia.status || 'aberta'}</span></div></div>
          <div class="campo"><div class="label">Peça</div><div class="valor">${ocorrencia.peca || '-'}</div></div>
          <div class="campo"><div class="label">Código da peça</div><div class="valor">${ocorrencia.codigo_peca || '-'}</div></div>
          <div class="campo"><div class="label">Quantidade</div><div class="valor">${ocorrencia.quantidade || '-'}</div></div>
          <div class="campo"><div class="label">Data</div><div class="valor">${formatarDataBr(ocorrencia.created_at)}</div></div>
        </div>

        <h2>Descrição da ocorrência</h2>
        <div class="descricao">${ocorrencia.descricao || '-'}</div>

        <h2>Solicitação para matriz</h2>
        <div class="descricao">
          Pedido: ${ocorrencia.numero_pedido || '-'}<br/>
          Peça: ${ocorrencia.peca || '-'}<br/>
          Código: ${ocorrencia.codigo_peca || '-'}<br/>
          Quantidade: ${ocorrencia.quantidade || '-'}<br/>
          Urgência: ${ocorrencia.urgencia || '-'}
        </div>

        <h2>Fotos</h2>
        <div class="fotos">${fotos || '<p>Sem fotos anexadas.</p>'}</div>

        <div class="rodape">
          Este relatório foi gerado pelo aplicativo FieldCheck Pro para registrar ocorrências, perdas, avarias e solicitações de peças em obra.
        </div>
      </body>
    </html>
  `;
}

export default function OcorrenciasScreen() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(normalizarOcorrencia());

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return ocorrencias;
    return ocorrencias.filter((item) => {
      const texto = `${item.numero_pedido} ${item.cliente} ${item.cidade} ${item.tipo_ocorrencia} ${item.equipamento} ${item.peca} ${item.status}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, ocorrencias]);

  useFocusEffect(
    useCallback(() => {
      carregarTudo();
    }, [])
  );

  async function carregarTudo() {
    setCarregando(true);
    await Promise.all([carregarPedidos(), carregarOcorrencias()]);
    await processarFilaSync();
    setCarregando(false);
  }

  async function carregarPedidos() {
    let lista = [];
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, cliente, cidade, endereco, estado, telefone, email, responsavel')
        .eq('empresa', obterEmpresaAtual())
        .order('id', { ascending: false });

      if (!error && data) {
        lista = data;
        await salvarJson(STORAGE_PEDIDOS_CACHE, lista);
      }
    } catch (erro) {
      console.log('Erro buscando pedidos online:', erro);
    }

    if (!lista.length) {
      lista = await lerJson(STORAGE_PEDIDOS_CACHE, []);
    }

    setPedidos(Array.isArray(lista) ? lista : []);
  }

  async function carregarOcorrencias() {
    const locais = await lerJson(STORAGE_OCORRENCIAS, []);
    let online = [];

    try {
      const { data, error } = await supabase
        .from('ocorrencias_obra')
        .select('*')
        .eq('empresa', obterEmpresaAtual())
        .order('created_at', { ascending: false });

      if (!error && data) online = data.map((item) => normalizarOcorrencia({ ...item, sincronizado: true }));
      if (error) console.log('Tabela ocorrencias_obra indisponível ou sem permissão:', error.message);
    } catch (erro) {
      console.log('Erro carregando ocorrências online:', erro);
    }

    const mapa = new Map();
    [...(Array.isArray(locais) ? locais : []), ...online]
      .map(normalizarOcorrencia)
      .forEach((item) => mapa.set(item.id, item));

    const lista = Array.from(mapa.values()).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    setOcorrencias(lista);
    await salvarJson(STORAGE_OCORRENCIAS, lista);
  }

  function abrirNovaOcorrencia(pedido = null) {
    setEditandoId(null);
    setForm(normalizarOcorrencia({
      id: gerarIdLocal(),
      numero_pedido: pedido?.numero_pedido || '',
      cliente: pedido?.cliente || '',
      cidade: pedido?.cidade || '',
      created_at: new Date().toISOString(),
    }));
    setModalAberto(true);
  }

  function abrirEdicao(item) {
    setEditandoId(item.id);
    setForm(normalizarOcorrencia(item));
    setModalAberto(true);
  }

  function aplicarPedido(numeroPedido) {
    const pedido = pedidos.find((p) => String(p.numero_pedido) === String(numeroPedido));
    setForm((atual) => ({
      ...atual,
      numero_pedido: String(numeroPedido || ''),
      cliente: pedido?.cliente || atual.cliente || '',
      cidade: pedido?.cidade || atual.cidade || '',
    }));
  }

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Libere a câmera para registrar fotos da ocorrência.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.55,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets?.[0]?.uri) {
      const asset = resultado.assets[0];
      const fotoSalva = await salvarFotoPermanente(asset.uri, asset.base64);

      setForm((atual) => ({
        ...atual,
        fotos: [
          ...(atual.fotos || []),
          {
            uri: fotoSalva?.uri || asset.uri,
            uriOriginal: fotoSalva?.uriOriginal || asset.uri,
            dataUri: fotoSalva?.dataUri || montarDataUri(asset.base64, extensaoParaMime(asset.uri)),
            data: new Date().toISOString(),
          },
        ],
      }));
    }
  }

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Libere as fotos para anexar imagens da ocorrência.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.55,
      allowsMultipleSelection: true,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets?.length) {
      const novas = await Promise.all(
        resultado.assets.map(async (asset) => {
          const fotoSalva = await salvarFotoPermanente(asset.uri, asset.base64);
          return {
            uri: fotoSalva?.uri || asset.uri,
            uriOriginal: fotoSalva?.uriOriginal || asset.uri,
            dataUri: fotoSalva?.dataUri || montarDataUri(asset.base64, extensaoParaMime(asset.uri)),
            data: new Date().toISOString(),
          };
        })
      );

      setForm((atual) => ({ ...atual, fotos: [...(atual.fotos || []), ...novas] }));
    }
  }

  function removerFoto(index) {
    setForm((atual) => ({
      ...atual,
      fotos: (atual.fotos || []).filter((_, i) => i !== index),
    }));
  }

  function validarFormulario() {
    if (!String(form.numero_pedido || '').trim()) return 'Informe o número do pedido.';
    if (!String(form.tipo_ocorrencia || '').trim()) return 'Informe o tipo da ocorrência.';
    if (!String(form.peca || '').trim()) return 'Informe a peça ou material.';
    if (!String(form.quantidade || '').trim()) return 'Informe a quantidade.';
    if (!String(form.descricao || '').trim()) return 'Descreva a ocorrência.';
    return null;
  }

  async function salvarOcorrencia() {
    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      Alert.alert('Atenção', erroValidacao);
      return;
    }

    const localizacao = form.localizacao || await capturarLocalizacaoCampo();
    const registro = normalizarOcorrencia({
      ...form,
      localizacao,
      id: editandoId || form.id || gerarIdLocal(),
      quantidade: String(form.quantidade || '').replace(',', '.'),
      sincronizado: false,
      created_at: form.created_at || new Date().toISOString(),
    });

    const novaLista = [registro, ...ocorrencias.filter((item) => item.id !== registro.id)]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    setOcorrencias(novaLista);
    await salvarJson(STORAGE_OCORRENCIAS, novaLista);
    await sincronizarOuEnfileirar(registro);
    setModalAberto(false);
    Alert.alert('Salvo', 'Ocorrência registrada com sucesso.');
  }

  async function sincronizarOuEnfileirar(registro) {
    const sucesso = await sincronizarOcorrencia(registro);
    if (!sucesso) {
      const fila = await lerJson(STORAGE_OCORRENCIAS_FILA, []);
      const novaFila = [registro, ...(Array.isArray(fila) ? fila : []).filter((item) => item.id !== registro.id)];
      await salvarJson(STORAGE_OCORRENCIAS_FILA, novaFila);
    }
  }

  async function sincronizarOcorrencia(registro) {
    try {
      const empresa = obterEmpresaAtual();
      const fotosRemotas = await enviarFotosOcorrencia({
        fotos: registro.fotos || [],
        empresa,
        ocorrenciaId: registro.id,
      });
      const payload = {
        local_id: registro.id,
        numero_pedido: registro.numero_pedido,
        cliente: registro.cliente,
        cidade: registro.cidade,
        tecnico: registro.tecnico,
        tipo_ocorrencia: registro.tipo_ocorrencia,
        equipamento: registro.equipamento,
        peca: registro.peca,
        codigo_peca: registro.codigo_peca,
        quantidade: Number(registro.quantidade || 0),
        urgencia: registro.urgencia,
        descricao: registro.descricao,
        fotos: fotosRemotas,
        localizacao: registro.localizacao || null,
        status: registro.status || 'aberta',
        created_at: registro.created_at,
      };

      payload.empresa = empresa;
      Object.keys(payload).forEach((chave) => payload[chave] === undefined && delete payload[chave]);

      const { error } = await supabase
        .from('ocorrencias_obra')
        .upsert([payload], { onConflict: 'local_id' });

      if (error) {
        console.log('Erro sincronizando ocorrência:', error.message);
        return false;
      }

      return true;
    } catch (erro) {
      console.log('Erro sincronizar ocorrência:', erro);
      return false;
    }
  }

  async function processarFilaSync() {
    const fila = await lerJson(STORAGE_OCORRENCIAS_FILA, []);
    if (!Array.isArray(fila) || !fila.length) return;

    const pendentes = [];
    for (const item of fila) {
      const sucesso = await sincronizarOcorrencia(item);
      if (!sucesso) pendentes.push(item);
    }
    await salvarJson(STORAGE_OCORRENCIAS_FILA, pendentes);
  }

  async function atualizarStatus(item, status) {
    const atualizado = { ...item, status, sincronizado: false };
    const novaLista = ocorrencias.map((oc) => (oc.id === item.id ? atualizado : oc));
    setOcorrencias(novaLista);
    await salvarJson(STORAGE_OCORRENCIAS, novaLista);
    await sincronizarOuEnfileirar(atualizado);
  }

  async function gerarPdf(item, acao = 'compartilhar') {
    try {
      const itemParaPdf = {
        ...item,
        fotos: await prepararFotosParaPdf(item.fotos || []),
      };

      console.log('FOTO PDF:', itemParaPdf.fotos?.[0]?.uriPdf ? 'convertida para Base64' : 'sem foto convertida');

      const { uri } = await Print.printToFileAsync({ html: montarHtmlOcorrencia(itemParaPdf) });

      if (acao === 'email') {
        const disponivel = await MailComposer.isAvailableAsync();
        if (!disponivel) {
          Alert.alert('E-mail indisponível', 'Não encontrei um aplicativo de e-mail configurado neste aparelho.');
          return;
        }

        await MailComposer.composeAsync({
          subject: `Ocorrência de Obra - Pedido ${item.numero_pedido}`,
          body: `Segue relatório de ocorrência do pedido ${item.numero_pedido}.\n\nPeça: ${item.peca}\nQuantidade: ${item.quantidade}\nStatus: ${item.status}`,
          attachments: [uri],
        });
        await atualizarStatus(item, item.status === 'aberta' ? 'enviada para matriz' : item.status);
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Ocorrência Pedido ${item.numero_pedido}`,
          UTI: 'com.adobe.pdf',
        });
        await atualizarStatus(item, item.status === 'aberta' ? 'enviada para matriz' : item.status);
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em: ${uri}`);
      }
    } catch (erro) {
      Alert.alert('Erro ao gerar PDF', erro?.message || String(erro));
    }
  }

  async function apagarOcorrencia(item) {
    Alert.alert(
      'Apagar ocorrência',
      'Deseja remover esta ocorrência do aparelho? Ela não será apagada do Supabase se já tiver sincronizado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            const novaLista = ocorrencias.filter((oc) => oc.id !== item.id);
            setOcorrencias(novaLista);
            await salvarJson(STORAGE_OCORRENCIAS, novaLista);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerIcone}>
              <Ionicons name="warning" size={28} color="#fff" />
            </View>
            <View style={styles.headerTextoBox}>
              <Text style={styles.titulo}>Ocorrências de Obra</Text>
              <Text style={styles.subtitulo}>Registre peças faltantes, avarias, perdas e solicitação para matriz.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.botaoPrincipal} onPress={() => abrirNovaOcorrencia()}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.botaoPrincipalTexto}>Nova ocorrência</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoSecundario} onPress={carregarTudo}>
            <Ionicons name="refresh" size={18} color="#123c69" />
            <Text style={styles.botaoSecundarioTexto}>{carregando ? 'Atualizando...' : 'Atualizar / sincronizar'}</Text>
          </TouchableOpacity>

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por pedido, cliente, peça ou status"
            style={styles.inputBusca}
          />

          <View style={styles.resumoLinha}>
            <ResumoBox titulo="Total" valor={ocorrencias.length} />
            <ResumoBox titulo="Abertas" valor={ocorrencias.filter((i) => i.status === 'aberta').length} />
            <ResumoBox titulo="Resolvidas" valor={ocorrencias.filter((i) => i.status === 'resolvida').length} />
          </View>

          {ocorrenciasFiltradas.length === 0 ? (
            <View style={styles.cardVazio}>
              <Text style={styles.cardVazioTitulo}>Nenhuma ocorrência encontrada</Text>
              <Text style={styles.cardVazioTexto}>Clique em �SNova ocorrência⬝ para registrar peça faltante, avaria ou solicitação para matriz.</Text>
            </View>
          ) : (
            ocorrenciasFiltradas.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTopo}>
                  <View style={styles.cardTituloBox}>
                    <Text style={styles.cardTitulo}>Pedido {item.numero_pedido || '-'}</Text>
                    <Text style={styles.cardSubtitulo}>{item.cliente || 'Cliente não informado'} {item.cidade ? `⬢ ${item.cidade}` : ''}</Text>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'resolvida' && styles.statusResolvida]}>
                    <Text style={styles.statusTexto}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.linha}><Text style={styles.negrito}>Tipo:</Text> {item.tipo_ocorrencia}</Text>
                <Text style={styles.linha}><Text style={styles.negrito}>Equipamento:</Text> {item.equipamento || '-'}</Text>
                <Text style={styles.linha}><Text style={styles.negrito}>Peça:</Text> {item.peca || '-'} {item.codigo_peca ? `(${item.codigo_peca})` : ''}</Text>
                <Text style={styles.linha}><Text style={styles.negrito}>Qtd:</Text> {item.quantidade || '-'} ⬢ <Text style={styles.negrito}>Urgência:</Text> {item.urgencia}</Text>
                <Text style={styles.descricaoPreview}>{item.descricao}</Text>
                <Text style={styles.dataTexto}>{formatarDataBr(item.created_at)} ⬢ {item.fotos?.length || 0} foto(s)</Text>

                <View style={styles.acoesLinha}>
                  <TouchableOpacity style={styles.botaoAcao} onPress={() => abrirEdicao(item)}>
                    <Text style={styles.botaoAcaoTexto}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoAcao} onPress={() => gerarPdf(item, 'compartilhar')}>
                    <Text style={styles.botaoAcaoTexto}>PDF/WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoAcao} onPress={() => gerarPdf(item, 'email')}>
                    <Text style={styles.botaoAcaoTexto}>E-mail</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.statusLinha}>
                  {STATUS.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusBotao, item.status === status && styles.statusBotaoAtivo]}
                      onPress={() => atualizarStatus(item, status)}
                    >
                      <Text style={[styles.statusBotaoTexto, item.status === status && styles.statusBotaoTextoAtivo]}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.botaoApagar} onPress={() => apagarOcorrencia(item)}>
                  <Text style={styles.botaoApagarTexto}>Apagar local</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalAberto} animationType="slide" onRequestClose={() => setModalAberto(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
              <View style={styles.modalTopo}>
                <Text style={styles.modalTitulo}>{editandoId ? 'Editar ocorrência' : 'Nova ocorrência'}</Text>
                <TouchableOpacity style={styles.fechar} onPress={() => setModalAberto(false)}>
                  <Text style={styles.fecharTexto}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Campo label="Pedido">
                <TextInput
                  value={form.numero_pedido}
                  onChangeText={(texto) => aplicarPedido(texto)}
                  placeholder="Número do pedido"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Campo>

              {pedidos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pedidosSugestoes}>
                  {pedidos.slice(0, 20).map((pedido) => (
                    <TouchableOpacity key={pedido.id || pedido.numero_pedido} style={styles.pedidoChip} onPress={() => aplicarPedido(pedido.numero_pedido)}>
                      <Text style={styles.pedidoChipTexto}>{pedido.numero_pedido}</Text>
                      <Text style={styles.pedidoChipSub}>{pedido.cliente}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Campo label="Cliente">
                <TextInput value={form.cliente} onChangeText={(cliente) => setForm((a) => ({ ...a, cliente }))} placeholder="Cliente" style={styles.input} />
              </Campo>

              <Campo label="Cidade">
                <TextInput value={form.cidade} onChangeText={(cidade) => setForm((a) => ({ ...a, cidade }))} placeholder="Cidade" style={styles.input} />
              </Campo>

              <Campo label="Técnico / responsável">
                <TextInput value={form.tecnico} onChangeText={(tecnico) => setForm((a) => ({ ...a, tecnico }))} placeholder="Nome do técnico" style={styles.input} />
              </Campo>

              <Campo label="Tipo de ocorrência">
                <View style={styles.chipsWrap}>
                  {TIPOS_OCORRENCIA.map((tipo) => (
                    <TouchableOpacity key={tipo} style={[styles.chip, form.tipo_ocorrencia === tipo && styles.chipAtivo]} onPress={() => setForm((a) => ({ ...a, tipo_ocorrencia: tipo }))}>
                      <Text style={[styles.chipTexto, form.tipo_ocorrencia === tipo && styles.chipTextoAtivo]}>{tipo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Campo>

              <Campo label="Equipamento relacionado">
                <TextInput value={form.equipamento} onChangeText={(equipamento) => setForm((a) => ({ ...a, equipamento }))} placeholder="Ex.: Elevador ECB-01" style={styles.input} />
              </Campo>

              <Campo label="Peça / material">
                <TextInput value={form.peca} onChangeText={(peca) => setForm((a) => ({ ...a, peca }))} placeholder="Ex.: Caneca, parafuso, correia" style={styles.input} />
              </Campo>

              <Campo label="Código da peça (opcional)">
                <TextInput value={form.codigo_peca} onChangeText={(codigo_peca) => setForm((a) => ({ ...a, codigo_peca }))} placeholder="Código interno ou referência" style={styles.input} />
              </Campo>

              <Campo label="Quantidade">
                <TextInput value={String(form.quantidade || '')} onChangeText={(quantidade) => setForm((a) => ({ ...a, quantidade }))} placeholder="Quantidade" keyboardType="numeric" style={styles.input} />
              </Campo>

              <Campo label="Urgência">
                <View style={styles.chipsWrap}>
                  {URGENCIAS.map((urgencia) => (
                    <TouchableOpacity key={urgencia} style={[styles.chip, form.urgencia === urgencia && styles.chipAtivo]} onPress={() => setForm((a) => ({ ...a, urgencia }))}>
                      <Text style={[styles.chipTexto, form.urgencia === urgencia && styles.chipTextoAtivo]}>{urgencia}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Campo>

              <Campo label="Descrição técnica da ocorrência">
                <TextInput
                  value={form.descricao}
                  onChangeText={(descricao) => setForm((a) => ({ ...a, descricao }))}
                  placeholder="Descreva o que aconteceu, onde está a peça, o impacto na obra e o que precisa ser enviado."
                  style={styles.textArea}
                  multiline
                />
              </Campo>

              <Campo label="Fotos">
                <View style={styles.fotosAcoes}>
                  <TouchableOpacity style={styles.botaoFoto} onPress={tirarFoto}>
                    <Ionicons name="camera" size={18} color="#fff" />
                    <Text style={styles.botaoFotoTexto}>Câmera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoFoto} onPress={escolherFoto}>
                    <Ionicons name="images" size={18} color="#fff" />
                    <Text style={styles.botaoFotoTexto}>Galeria</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.fotosGrid}>
                  {(form.fotos || []).map((foto, index) => (
                    <View key={`${foto.uri}-${index}`} style={styles.fotoBox}>
                      <Image source={{ uri: foto.uri || foto }} style={styles.fotoPreview} />
                      <TouchableOpacity style={styles.removerFoto} onPress={() => removerFoto(index)}>
                        <Text style={styles.removerFotoTexto}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </Campo>

              <TouchableOpacity style={styles.botaoSalvar} onPress={salvarOcorrencia}>
                <Text style={styles.botaoSalvarTexto}>Salvar ocorrência</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Campo({ label, children }) {
  return (
    <View style={styles.campoBox}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ResumoBox({ titulo, valor }) {
  return (
    <View style={styles.resumoBox}>
      <Text style={styles.resumoValor}>{valor}</Text>
      <Text style={styles.resumoTitulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#eef2f7' },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbe4ea',
    marginBottom: 12,
    elevation: 3,
  },
  headerIcone: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#123c69',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextoBox: { flex: 1 },
  titulo: { fontSize: 22, color: '#123c69', fontWeight: '900' },
  subtitulo: { fontSize: 13, color: '#475569', marginTop: 4, fontWeight: '700' },
  botaoPrincipal: {
    backgroundColor: '#123c69',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  botaoPrincipalTexto: { color: '#fff', fontSize: 16, fontWeight: '900' },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: '#123c69',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  botaoSecundarioTexto: { color: '#123c69', fontWeight: '900' },
  inputBusca: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 13,
    padding: 13,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  resumoLinha: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  resumoBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#dbe4ea' },
  resumoValor: { fontSize: 24, color: '#123c69', fontWeight: '900' },
  resumoTitulo: { fontSize: 12, color: '#64748b', fontWeight: '800' },
  cardVazio: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#dbe4ea' },
  cardVazioTitulo: { fontSize: 18, fontWeight: '900', color: '#123c69', marginBottom: 6 },
  cardVazioTexto: { color: '#475569', fontWeight: '600', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#dbe4ea', elevation: 2 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  cardTituloBox: { flex: 1 },
  cardTitulo: { fontSize: 18, fontWeight: '900', color: '#123c69' },
  cardSubtitulo: { fontSize: 13, color: '#64748b', fontWeight: '700', marginTop: 2 },
  statusBadge: { backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  statusResolvida: { backgroundColor: '#dcfce7' },
  statusTexto: { fontSize: 11, color: '#111827', fontWeight: '900', textTransform: 'uppercase' },
  linha: { fontSize: 14, color: '#334155', marginTop: 3, fontWeight: '600' },
  negrito: { fontWeight: '900', color: '#111827' },
  descricaoPreview: { marginTop: 8, color: '#475569', fontSize: 14, lineHeight: 20 },
  dataTexto: { marginTop: 8, color: '#64748b', fontSize: 12, fontWeight: '700' },
  acoesLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  botaoAcao: { backgroundColor: '#123c69', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  botaoAcaoTexto: { color: '#fff', fontWeight: '900', fontSize: 12 },
  statusLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  statusBotao: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#fff' },
  statusBotaoAtivo: { backgroundColor: '#14532d', borderColor: '#14532d' },
  statusBotaoTexto: { color: '#334155', fontSize: 11, fontWeight: '900' },
  statusBotaoTextoAtivo: { color: '#fff' },
  botaoApagar: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#fee2e2' },
  botaoApagarTexto: { color: '#991b1b', fontSize: 12, fontWeight: '900' },
  modalSafe: { flex: 1, backgroundColor: '#eef2f7' },
  modalContainer: { padding: 16, paddingBottom: 34 },
  modalTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitulo: { fontSize: 22, fontWeight: '900', color: '#123c69' },
  fechar: { backgroundColor: '#b42318', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  fecharTexto: { color: '#fff', fontWeight: '900' },
  campoBox: { marginBottom: 13 },
  label: { fontSize: 13, color: '#334155', fontWeight: '900', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 12, backgroundColor: '#fff', fontSize: 15 },
  textArea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 12, backgroundColor: '#fff', fontSize: 15, minHeight: 120, textAlignVertical: 'top' },
  pedidosSugestoes: { marginBottom: 12 },
  pedidoChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe4ea', borderRadius: 12, padding: 10, marginRight: 8, minWidth: 120 },
  pedidoChipTexto: { color: '#123c69', fontWeight: '900' },
  pedidoChipSub: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 2 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 12 },
  chipAtivo: { backgroundColor: '#123c69', borderColor: '#123c69' },
  chipTexto: { color: '#334155', fontWeight: '900', fontSize: 12 },
  chipTextoAtivo: { color: '#fff' },
  fotosAcoes: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  botaoFoto: { flex: 1, backgroundColor: '#0f766e', borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  botaoFotoTexto: { color: '#fff', fontWeight: '900' },
  fotosGrid: { gap: 10 },
  fotoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#dbe4ea' },
  fotoPreview: { width: '100%', height: 190, borderRadius: 10, backgroundColor: '#e5e7eb', resizeMode: 'contain' },
  removerFoto: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 7 },
  removerFotoTexto: { color: '#991b1b', fontWeight: '900' },
  botaoSalvar: { backgroundColor: '#14532d', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  botaoSalvarTexto: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
