import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';

const EMPRESA_ATUAL = 'FieldCheck';

const STORAGE_PEDIDOS_CACHE = '@fieldcheck_cache_pedidos';
const STORAGE_PEDIDOS_CAMPO = '@fieldcheck_pedidos_campo';
const STORAGE_PEDIDOS_CAMPO_FILA = '@fieldcheck_pedidos_campo_fila_sync';
const STORAGE_EQUIPAMENTOS_CACHE = '@fieldcheck_cache_equipamentos_pedido';

const pedidoVazio = {
  numero_pedido: '',
  cliente: '',
  endereco: '',
  cidade: '',
  estado: '',
  telefone: '',
  email: '',
  responsavel: '',
  tecnico: '',
  observacoes: '',
};

const equipamentoVazio = {
  nome: '',
  tag: '',
  modelo: '',
  serie: '',
  codigo: '',
  descritivo: '',
  quantidade: '1',
};

function gerarNumeroCampo() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `CAMPO-${ano}${mes}${dia}-${hora}${minuto}`;
}

function chaveCacheSegura(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_');
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

function normalizarPedido(item = {}) {
  return {
    id: item.id || item.local_id || `local-${Date.now()}`,
    numero_pedido: String(item.numero_pedido || item.numeroPedido || '').trim(),
    cliente: item.cliente || '',
    endereco: item.endereco || '',
    cidade: item.cidade || '',
    estado: item.estado || '',
    telefone: item.telefone || '',
    email: item.email || item.emailCliente || '',
    responsavel: item.responsavel || '',
    tecnico: item.tecnico || '',
    observacoes: item.observacoes || '',
    status: item.status || 'pendente',
    origem: item.origem || 'campo',
    pedido_campo: item.pedido_campo !== false,
    created_at: item.created_at || new Date().toISOString(),
    sincronizado: item.sincronizado === true,
    empresa: item.empresa || EMPRESA_ATUAL,
    equipamentos: Array.isArray(item.equipamentos) ? item.equipamentos : [],
  };
}

function normalizarEquipamento(eq = {}, numeroPedido = '') {
  return {
    numero_pedido: numeroPedido,
    nome: eq.nome || '',
    tag: eq.tag || '',
    modelo: eq.modelo || '',
    serie: eq.serie || '',
    codigo: eq.codigo || '',
    descritivo: eq.descritivo || '',
    quantidade: Number(eq.quantidade || 1) || 1,
    origem: 'campo',
    empresa: EMPRESA_ATUAL,
  };
}

function validarEmailSimples(email) {
  if (!email) return true;
  return /\S+@\S+\.\S+/.test(email);
}

export default function CadastroPedidoObraScreen() {
  const [pedido, setPedido] = useState({ ...pedidoVazio, numero_pedido: gerarNumeroCampo() });
  const [equipamentos, setEquipamentos] = useState([{ ...equipamentoVazio }]);
  const [pedidosCampo, setPedidosCampo] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);

  const totalEquipamentosValidos = useMemo(
    () => equipamentos.filter((eq) => String(eq.nome || eq.tag || '').trim()).length,
    [equipamentos]
  );

  useFocusEffect(
    useCallback(() => {
      carregarPedidosCampo();
      processarFila();
    }, [])
  );

  useEffect(() => {
    carregarPedidosCampo();
  }, []);

  function atualizarCampo(campo, valor) {
    setPedido((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarEquipamento(index, campo, valor) {
    setEquipamentos((atual) => {
      const lista = [...atual];
      lista[index] = { ...lista[index], [campo]: valor };
      return lista;
    });
  }

  function adicionarEquipamento() {
    setEquipamentos((atual) => [...atual, { ...equipamentoVazio }]);
  }

  function removerEquipamento(index) {
    setEquipamentos((atual) => {
      if (atual.length <= 1) return atual;
      return atual.filter((_, i) => i !== index);
    });
  }

  function limparFormulario() {
    setPedido({ ...pedidoVazio, numero_pedido: gerarNumeroCampo() });
    setEquipamentos([{ ...equipamentoVazio }]);
  }

  async function carregarPedidosCampo() {
    const lista = await lerJson(STORAGE_PEDIDOS_CAMPO, []);
    setPedidosCampo((Array.isArray(lista) ? lista : []).map(normalizarPedido));
  }

  async function salvarNoCacheGeral(registro) {
    const pedidosCache = await lerJson(STORAGE_PEDIDOS_CACHE, []);
    const pedidoParaLista = {
      id: registro.id,
      numero_pedido: registro.numero_pedido,
      cliente: registro.cliente,
      cidade: registro.cidade,
      status: registro.status || 'pendente',
      endereco: registro.endereco,
      estado: registro.estado,
      telefone: registro.telefone,
      email: registro.email,
      responsavel: registro.responsavel,
      origem: 'campo',
      pedido_campo: true,
      empresa: EMPRESA_ATUAL,
    };

    const novaLista = [
      pedidoParaLista,
      ...(Array.isArray(pedidosCache) ? pedidosCache : []).filter(
        (item) => String(item.numero_pedido) !== String(registro.numero_pedido)
      ),
    ];

    await salvarJson(STORAGE_PEDIDOS_CACHE, novaLista);

    const chaveEquipamentos = `${STORAGE_EQUIPAMENTOS_CACHE}_${String(registro.numero_pedido).trim()}`;
    await salvarJson(chaveEquipamentos, registro.equipamentos || []);
  }

  async function adicionarNaFila(registro) {
    const fila = await lerJson(STORAGE_PEDIDOS_CAMPO_FILA, []);
    const novaFila = [
      { ...registro, aguardando_sync: true, sincronizado: false },
      ...(Array.isArray(fila) ? fila : []).filter(
        (item) => String(item.numero_pedido) !== String(registro.numero_pedido)
      ),
    ].slice(0, 100);
    await salvarJson(STORAGE_PEDIDOS_CAMPO_FILA, novaFila);
  }

  async function sincronizarSupabase(registro) {
    try {
      const payloadPedido = {
        numero_pedido: registro.numero_pedido,
        cliente: registro.cliente,
        cidade: registro.cidade,
        status: registro.status || 'pendente',
        endereco: registro.endereco,
        estado: registro.estado,
        telefone: registro.telefone,
        email: registro.email,
        responsavel: registro.responsavel,
        origem: 'campo',
        pedido_campo: true,
        observacoes: registro.observacoes,
        empresa: EMPRESA_ATUAL,
      };

      const { data: existente, error: erroBusca } = await supabase
        .from('pedidos')
        .select('id')
        .eq('numero_pedido', registro.numero_pedido)
        .eq('empresa', EMPRESA_ATUAL)
        .maybeSingle();

      if (erroBusca) {
        console.log('Erro buscando pedido de campo:', erroBusca);
      }

      if (existente?.id) {
        const { error: erroUpdate } = await supabase
          .from('pedidos')
          .update(payloadPedido)
          .eq('id', existente.id)
          .eq('empresa', EMPRESA_ATUAL);
        if (erroUpdate) throw erroUpdate;
      } else {
        const { error: erroInsert } = await supabase
          .from('pedidos')
          .insert([payloadPedido]);
        if (erroInsert) throw erroInsert;
      }

      const equipamentosPayload = (registro.equipamentos || []).map((eq) => normalizarEquipamento(eq, registro.numero_pedido));

      if (equipamentosPayload.length > 0) {
        const { error: erroLimparEquipamentos } = await supabase
          .from('equipamentos')
          .delete()
          .eq('numero_pedido', registro.numero_pedido)
          .eq('empresa', EMPRESA_ATUAL);

        if (erroLimparEquipamentos) throw erroLimparEquipamentos;

        const { error: erroEq } = await supabase
          .from('equipamentos')
          .insert(equipamentosPayload);
        if (erroEq) throw erroEq;
      }

      return true;
    } catch (erro) {
      console.log('Erro sincronizando pedido de obra:', erro);
      return false;
    }
  }

  async function processarFila() {
    const fila = await lerJson(STORAGE_PEDIDOS_CAMPO_FILA, []);
    if (!Array.isArray(fila) || fila.length === 0) return;

    const pendentes = [];
    for (const item of fila) {
      const sucesso = await sincronizarSupabase(item);
      if (!sucesso) pendentes.push(item);
    }
    await salvarJson(STORAGE_PEDIDOS_CAMPO_FILA, pendentes);
  }

  async function salvarPedidoCampo() {
    const numero = String(pedido.numero_pedido || '').trim();
    const cliente = String(pedido.cliente || '').trim();

    if (!numero) {
      Alert.alert('Atenção', 'Informe o número do pedido.');
      return;
    }

    if (!cliente) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }

    if (!validarEmailSimples(pedido.email)) {
      Alert.alert('Atenção', 'Confira o e-mail do cliente.');
      return;
    }

    const equipamentosValidos = equipamentos
      .filter((eq) => String(eq.nome || eq.tag || '').trim())
      .map((eq) => normalizarEquipamento(eq, numero));

    if (equipamentosValidos.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um equipamento.');
      return;
    }

    setSalvando(true);

    const registro = normalizarPedido({
      ...pedido,
      numero_pedido: numero,
      status: 'pendente',
      origem: 'campo',
      pedido_campo: true,
      created_at: new Date().toISOString(),
      equipamentos: equipamentosValidos,
      empresa: EMPRESA_ATUAL,
    });

    try {
      const listaAtual = await lerJson(STORAGE_PEDIDOS_CAMPO, []);
      const novaLista = [
        registro,
        ...(Array.isArray(listaAtual) ? listaAtual : []).filter(
          (item) => String(item.numero_pedido) !== numero
        ),
      ];

      await salvarJson(STORAGE_PEDIDOS_CAMPO, novaLista);
      await salvarNoCacheGeral(registro);

      const sincronizado = await sincronizarSupabase(registro);
      if (!sincronizado) {
        await adicionarNaFila(registro);
      }

      setPedidosCampo(novaLista.map(normalizarPedido));
      setSalvando(false);

      Alert.alert(
        'Pedido salvo',
        sincronizado
          ? 'Pedido de obra salvo no celular e sincronizado com o Supabase.'
          : 'Pedido salvo no celular. Sem internet ou tabela incompleta: ele ficou na fila para sincronizar depois.'
      );

      limparFormulario();
    } catch (erro) {
      setSalvando(false);
      console.log('Erro salvando pedido de campo:', erro);
      Alert.alert('Erro', 'Não foi possível salvar o pedido de obra.');
    }
  }

  function abrirPedidoDaLista(item) {
    setPedido({
      numero_pedido: item.numero_pedido,
      cliente: item.cliente,
      endereco: item.endereco,
      cidade: item.cidade,
      estado: item.estado,
      telefone: item.telefone,
      email: item.email,
      responsavel: item.responsavel,
      tecnico: item.tecnico,
      observacoes: item.observacoes,
    });
    setEquipamentos(item.equipamentos?.length ? item.equipamentos.map((eq) => ({ ...eq, quantidade: String(eq.quantidade || 1) })) : [{ ...equipamentoVazio }]);
    setMostrarLista(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View>
              <Text style={styles.titulo}>Pedido em Obra</Text>
              <Text style={styles.subtitulo}>Cadastre pedido e equipamentos direto no campo.</Text>
            </View>
            <TouchableOpacity style={styles.botaoLista} onPress={() => setMostrarLista((v) => !v)}>
              <Ionicons name="list" size={18} color="#123c69" />
              <Text style={styles.botaoListaTexto}>{mostrarLista ? 'Formulário' : 'Salvos'}</Text>
            </TouchableOpacity>
          </View>

          {mostrarLista ? (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Pedidos cadastrados no campo</Text>
              {pedidosCampo.length === 0 ? (
                <Text style={styles.vazio}>Nenhum pedido de obra cadastrado neste celular.</Text>
              ) : (
                pedidosCampo.map((item) => (
                  <TouchableOpacity key={`${item.numero_pedido}-${item.id}`} style={styles.itemLista} onPress={() => abrirPedidoDaLista(item)}>
                    <View style={styles.itemTopo}>
                      <Text style={styles.itemPedido}>{item.numero_pedido}</Text>
                      <Text style={[styles.badge, item.sincronizado ? styles.badgeOk : styles.badgePendente]}>
                        {item.sincronizado ? 'sync' : 'local'}
                      </Text>
                    </View>
                    <Text style={styles.itemCliente}>{item.cliente}</Text>
                    <Text style={styles.itemMeta}>{item.cidade || 'Cidade não informada'} • {item.equipamentos?.length || 0} equipamentos</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Dados do pedido</Text>

                <Campo label="Número do pedido" value={pedido.numero_pedido} onChangeText={(v) => atualizarCampo('numero_pedido', v)} placeholder="Ex: 514 ou CAMPO-20260609-1830" />
                <Campo label="Cliente *" value={pedido.cliente} onChangeText={(v) => atualizarCampo('cliente', v)} placeholder="Nome do cliente" />
                <Campo label="Endereço" value={pedido.endereco} onChangeText={(v) => atualizarCampo('endereco', v)} placeholder="Endereço da obra" />

                <View style={styles.linha}>
                  <View style={styles.metade}>
                    <Campo label="Cidade" value={pedido.cidade} onChangeText={(v) => atualizarCampo('cidade', v)} placeholder="Cidade" />
                  </View>
                  <View style={styles.metade}>
                    <Campo label="Estado" value={pedido.estado} onChangeText={(v) => atualizarCampo('estado', v.toUpperCase())} placeholder="UF" />
                  </View>
                </View>

                <Campo label="Telefone" value={pedido.telefone} onChangeText={(v) => atualizarCampo('telefone', v)} placeholder="Telefone/WhatsApp" keyboardType="phone-pad" />
                <Campo label="E-mail" value={pedido.email} onChangeText={(v) => atualizarCampo('email', v)} placeholder="email@cliente.com" keyboardType="email-address" autoCapitalize="none" />
                <Campo label="Responsável" value={pedido.responsavel} onChangeText={(v) => atualizarCampo('responsavel', v)} placeholder="Responsável no cliente" />
                <Campo label="Técnico" value={pedido.tecnico} onChangeText={(v) => atualizarCampo('tecnico', v)} placeholder="Técnico em campo" />
                <Campo label="Observações" value={pedido.observacoes} onChangeText={(v) => atualizarCampo('observacoes', v)} placeholder="Observações gerais da obra" multiline />
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderLinha}>
                  <View>
                    <Text style={styles.cardTitulo}>Equipamentos</Text>
                    <Text style={styles.cardSub}>{totalEquipamentosValidos} equipamento(s) válido(s)</Text>
                  </View>
                  <TouchableOpacity style={styles.botaoPequeno} onPress={adicionarEquipamento}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.botaoPequenoTexto}>Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {equipamentos.map((eq, index) => (
                  <View key={`eq-${index}`} style={styles.equipamentoBox}>
                    <View style={styles.equipamentoTopo}>
                      <Text style={styles.equipamentoTitulo}>Equipamento {index + 1}</Text>
                      {equipamentos.length > 1 && (
                        <TouchableOpacity onPress={() => removerEquipamento(index)}>
                          <Ionicons name="trash" size={20} color="#b91c1c" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Campo label="Nome do equipamento *" value={eq.nome} onChangeText={(v) => atualizarEquipamento(index, 'nome', v)} placeholder="Ex: Elevador de Corrente" />
                    <View style={styles.linha}>
                      <View style={styles.metade}>
                        <Campo label="Tag" value={eq.tag} onChangeText={(v) => atualizarEquipamento(index, 'tag', v.toUpperCase())} placeholder="ECB-01" />
                      </View>
                      <View style={styles.metade}>
                        <Campo label="Quantidade" value={eq.quantidade} onChangeText={(v) => atualizarEquipamento(index, 'quantidade', v.replace(/[^0-9]/g, ''))} placeholder="1" keyboardType="numeric" />
                      </View>
                    </View>
                    <Campo label="Modelo" value={eq.modelo} onChangeText={(v) => atualizarEquipamento(index, 'modelo', v)} placeholder="Modelo" />
                    <Campo label="Série" value={eq.serie} onChangeText={(v) => atualizarEquipamento(index, 'serie', v)} placeholder="Número de série" />
                    <Campo label="Código" value={eq.codigo} onChangeText={(v) => atualizarEquipamento(index, 'codigo', v)} placeholder="Código interno" />
                    <Campo label="Descritivo" value={eq.descritivo} onChangeText={(v) => atualizarEquipamento(index, 'descritivo', v)} placeholder="Observação do equipamento" multiline />
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]} onPress={salvarPedidoCampo} disabled={salvando}>
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar pedido em obra'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.botaoLimpar} onPress={limparFormulario}>
                <Text style={styles.botaoLimparTexto}>Limpar formulário</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Campo({ label, value, onChangeText, placeholder, multiline = false, ...props }) {
  return (
    <View style={styles.campoBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#eef4f8' },
  flex: { flex: 1 },
  container: { padding: 14, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titulo: { fontSize: 24, fontWeight: '900', color: '#123c69' },
  subtitulo: { fontSize: 13, color: '#475569', marginTop: 2, maxWidth: 230 },
  botaoLista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#bdd2df',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  botaoListaTexto: { color: '#123c69', fontWeight: '800', fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#dbe4ea',
  },
  cardTitulo: { fontSize: 18, fontWeight: '900', color: '#123c69', marginBottom: 8 },
  cardSub: { color: '#64748b', fontSize: 12, marginTop: -4 },
  cardHeaderLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  campoBox: { marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  inputMultiline: { minHeight: 80, paddingTop: 10 },
  linha: { flexDirection: 'row', gap: 10 },
  metade: { flex: 1 },
  equipamentoBox: {
    borderWidth: 1,
    borderColor: '#dbe4ea',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    backgroundColor: '#f8fafc',
  },
  equipamentoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  equipamentoTitulo: { fontWeight: '900', color: '#123c69', fontSize: 15 },
  botaoPequeno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#123c69',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  botaoPequenoTexto: { color: '#fff', fontWeight: '900', fontSize: 12 },
  botaoSalvar: {
    backgroundColor: '#166534',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoSalvarTexto: { color: '#fff', fontSize: 16, fontWeight: '900' },
  botaoLimpar: { padding: 14, alignItems: 'center' },
  botaoLimparTexto: { color: '#64748b', fontWeight: '800' },
  vazio: { color: '#64748b', paddingVertical: 14 },
  itemLista: {
    borderWidth: 1,
    borderColor: '#dbe4ea',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  itemTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPedido: { fontSize: 16, fontWeight: '900', color: '#123c69' },
  itemCliente: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 3 },
  badge: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, fontSize: 11, fontWeight: '900' },
  badgeOk: { backgroundColor: '#dcfce7', color: '#166534' },
  badgePendente: { backgroundColor: '#fef3c7', color: '#92400e' },
});
