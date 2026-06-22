import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { supabase } from '../supabase';
import { obterEmpresaAtual } from '../utils/sessaoOperacional';


const STORAGE_MODELOS = '@fieldcheck_modelos_checklist_v1';

function gerarId() {
  if (globalThis?.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function montarFiltroInSupabase(valores = []) {
  const lista = valores.map((valor) => JSON.stringify(String(valor))).join(',');
  return `(${lista})`;
}

function novoItem() {
  return {
    id: gerarId(),
    texto: '',
    tipoResposta: 'ok_pendente_na',
    exigeFoto: false,
    exigeObservacao: false,
    ordem: 1,
  };
}

function novoModelo() {
  return {
    id: gerarId(),
    nome: '',
    categoria: '',
    descricao: '',
    ativo: true,
    sincronizacao: 'local',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    itens: [novoItem()],
  };
}

function normalizarModelo(modelo) {
  const itens = Array.isArray(modelo?.itens) && modelo.itens.length ? modelo.itens : [novoItem()];
  return {
    ...novoModelo(),
    ...modelo,
    itens: itens.map((item, index) => ({
      ...novoItem(),
      ...item,
      ordem: item?.ordem || index + 1,
    })),
  };
}

export default function ModelosChecklistScreen() {
  const [modelos, setModelos] = useState([]);
  const [modeloAtual, setModeloAtual] = useState(novoModelo());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarModelos();
  }, []);

  const totalItens = useMemo(
    () => (modeloAtual.itens || []).filter((item) => String(item.texto || '').trim()).length,
    [modeloAtual]
  );

  async function lerModelosLocais() {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_MODELOS);
      return salvo ? JSON.parse(salvo) : [];
    } catch (erro) {
      console.log('Erro ao ler modelos locais:', erro);
      return [];
    }
  }

  async function salvarModelosLocais(lista) {
    const ordenada = [...lista].sort((a, b) => new Date(b.atualizadoEm || 0) - new Date(a.atualizadoEm || 0));
    setModelos(ordenada);
    await AsyncStorage.setItem(STORAGE_MODELOS, JSON.stringify(ordenada));
  }

  function mesclarModelos(local = [], nuvem = []) {
    const mapa = new Map();
    [...nuvem, ...local].forEach((modelo) => {
      if (!modelo?.id) return;
      const atual = mapa.get(modelo.id);
      if (!atual) {
        mapa.set(modelo.id, normalizarModelo(modelo));
        return;
      }
      const dataModelo = new Date(modelo.atualizadoEm || modelo.atualizado_em || 0).getTime();
      const dataAtual = new Date(atual.atualizadoEm || atual.atualizado_em || 0).getTime();
      mapa.set(modelo.id, dataModelo >= dataAtual ? normalizarModelo(modelo) : atual);
    });
    return Array.from(mapa.values()).sort((a, b) => new Date(b.atualizadoEm || 0) - new Date(a.atualizadoEm || 0));
  }

  async function carregarModelosSupabase() {
    try {
      const { data: modelosDb, error } = await supabase
        .from('modelos_checklist_genericos')
        .select('*')
        .eq('empresa', obterEmpresaAtual())
        .order('atualizado_em', { ascending: false });

      if (error) throw error;
      if (!Array.isArray(modelosDb) || !modelosDb.length) return [];

      const ids = modelosDb.map((modelo) => modelo.id).filter(Boolean);
      const { data: itensDb, error: erroItens } = await supabase
        .from('modelos_checklist_genericos_itens')
        .select('*')
        .eq('empresa', obterEmpresaAtual())
        .in('modelo_id', ids)
        .order('ordem', { ascending: true });

      if (erroItens) throw erroItens;

      return modelosDb.map((modelo) => ({
        id: modelo.id,
        nome: modelo.nome || '',
        categoria: modelo.categoria || '',
        descricao: modelo.descricao || '',
        ativo: modelo.ativo !== false,
        sincronizacao: 'sincronizado',
        criadoEm: modelo.criado_em || new Date().toISOString(),
        atualizadoEm: modelo.atualizado_em || modelo.criado_em || new Date().toISOString(),
        itens: (itensDb || [])
          .filter((item) => item.modelo_id === modelo.id)
          .map((item, index) => ({
            id: item.id || gerarId(),
            texto: item.texto || '',
            tipoResposta: item.tipo_resposta || 'ok_pendente_na',
            exigeFoto: !!item.exige_foto,
            exigeObservacao: !!item.exige_observacao,
            ordem: item.ordem || index + 1,
          })),
      }));
    } catch (erro) {
      console.log('Modelos genéricos ainda não sincronizaram com o Supabase:', erro?.message || erro);
      return [];
    }
  }

  async function carregarModelos() {
    setCarregando(true);
    const locais = await lerModelosLocais();
    const nuvem = await carregarModelosSupabase();
    const combinados = mesclarModelos(locais, nuvem);
    setModelos(combinados);
    await AsyncStorage.setItem(STORAGE_MODELOS, JSON.stringify(combinados));
    setCarregando(false);
  }

  function atualizarCampo(campo, valor) {
    setModeloAtual((modelo) => ({ ...modelo, [campo]: valor, sincronizacao: 'local' }));
  }

  function atualizarItem(id, campo, valor) {
    setModeloAtual((modelo) => ({
      ...modelo,
      sincronizacao: 'local',
      itens: modelo.itens.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)),
    }));
  }

  function adicionarItem() {
    setModeloAtual((modelo) => ({
      ...modelo,
      sincronizacao: 'local',
      itens: [...modelo.itens, { ...novoItem(), ordem: modelo.itens.length + 1 }],
    }));
  }

  function removerItem(id) {
    setModeloAtual((modelo) => {
      const novaLista = modelo.itens.length <= 1 ? [novoItem()] : modelo.itens.filter((item) => item.id !== id);
      return {
        ...modelo,
        sincronizacao: 'local',
        itens: novaLista.map((item, index) => ({ ...item, ordem: index + 1 })),
      };
    });
  }

  function abrirModelo(modelo) {
    setModeloAtual(normalizarModelo(modelo));
  }

  function limparFormulario() {
    setModeloAtual(novoModelo());
  }

  function validarModelo(modelo) {
    if (!String(modelo.nome || '').trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do modelo de checklist.');
      return null;
    }

    const itensValidos = (modelo.itens || [])
      .filter((item) => String(item.texto || '').trim())
      .map((item, index) => ({ ...item, texto: String(item.texto).trim(), ordem: index + 1 }));

    if (!itensValidos.length) {
      Alert.alert('Itens obrigatórios', 'Cadastre pelo menos um item de verificação.');
      return null;
    }

    return {
      ...modelo,
      nome: String(modelo.nome).trim(),
      categoria: String(modelo.categoria || '').trim(),
      descricao: String(modelo.descricao || '').trim(),
      itens: itensValidos,
      atualizadoEm: new Date().toISOString(),
    };
  }

  async function sincronizarModeloSupabase(modelo) {
    try {
      const agora = new Date().toISOString();
      const { error: erroModelo } = await supabase
        .from('modelos_checklist_genericos')
        .upsert({
          id: modelo.id,
          nome: modelo.nome,
          categoria: modelo.categoria || '',
          descricao: modelo.descricao || '',
          ativo: modelo.ativo !== false,
          criado_em: modelo.criadoEm || agora,
          atualizado_em: agora,
        }, { onConflict: 'id' });

      if (erroModelo) throw erroModelo;

      const itens = modelo.itens.map((item, index) => ({
        id: item.id || gerarId(),
        modelo_id: modelo.id,
        texto: item.texto,
        tipo_resposta: item.tipoResposta || 'ok_pendente_na',
        exige_foto: !!item.exigeFoto,
        exige_observacao: !!item.exigeObservacao,
        ordem: index + 1,
        empresa: obterEmpresaAtual(),
      }));

      if (itens.length > 0) {
        const { error: erroItens } = await supabase
          .from('modelos_checklist_genericos_itens')
          .upsert(itens, { onConflict: 'id' });

        if (erroItens) throw erroItens;
      }

      const idsAtuais = itens.map((item) => item.id).filter(Boolean);
      let removerAntigos = supabase
        .from('modelos_checklist_genericos_itens')
        .delete()
        .eq('modelo_id', modelo.id)
        .eq('empresa', obterEmpresaAtual());

      if (idsAtuais.length > 0) {
        removerAntigos = removerAntigos.not('id', 'in', montarFiltroInSupabase(idsAtuais));
      }

      const { error: erroLimpar } = await removerAntigos;
      if (erroLimpar) throw erroLimpar;
      return { ok: true };
    } catch (erro) {
      console.log('Erro ao sincronizar modelo genérico:', erro?.message || erro);
      return { ok: false, erro };
    }
  }

  async function salvarModelo() {
    const modeloValidado = validarModelo(modeloAtual);
    if (!modeloValidado) return;

    setSalvando(true);
    const resultado = await sincronizarModeloSupabase(modeloValidado);
    const registro = {
      ...modeloValidado,
      sincronizacao: resultado.ok ? 'sincronizado' : 'local',
      erroSincronizacao: resultado.ok ? '' : (resultado.erro?.message || 'Salvo localmente. Supabase não disponível.'),
    };

    const novaLista = [registro, ...modelos.filter((modelo) => modelo.id !== registro.id)];
    await salvarModelosLocais(novaLista);
    setModeloAtual(registro);
    setSalvando(false);

    Alert.alert(
      resultado.ok ? 'Modelo salvo' : 'Salvo no celular',
      resultado.ok
        ? 'O modelo foi salvo e sincronizado.'
        : 'O modelo foi salvo localmente. Depois criamos as tabelas no Supabase para sincronizar.'
    );
  }

  async function excluirModelo(id) {
    Alert.alert('Excluir modelo', 'Deseja remover este modelo de checklist?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const novaLista = modelos.filter((modelo) => modelo.id !== id);
          await salvarModelosLocais(novaLista);
          if (modeloAtual.id === id) limparFormulario();
          try {
            await supabase.from('modelos_checklist_genericos_itens').delete().eq('modelo_id', id).eq('empresa', obterEmpresaAtual());
            await supabase.from('modelos_checklist_genericos').delete().eq('id', id).eq('empresa', obterEmpresaAtual());
          } catch (erro) {
            console.log('Modelo removido localmente. Supabase ignorado:', erro?.message || erro);
          }
        },
      },
    ]);
  }

  function renderBotaoFlag(item, campo, texto, icone) {
    const ativo = !!item[campo];
    return (
      <TouchableOpacity
        style={[styles.flagBotao, ativo && styles.flagBotaoAtivo]}
        onPress={() => atualizarItem(item.id, campo, !ativo)}
      >
        <Ionicons name={icone} size={15} color={ativo ? '#fff' : '#123c69'} />
        <Text style={[styles.flagTexto, ativo && styles.flagTextoAtivo]}>{texto}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.headerIcone}>
            <Ionicons name="options" size={30} color="#fff" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.titulo}>Modelos de Checklist</Text>
            <Text style={styles.subtitulo}>Crie checklists para qualquer empresa: instalação, montagem, vistoria ou manutenção.</Text>
          </View>
        </View>

        <View style={styles.cardDestaque}>
          <Text style={styles.destaqueTitulo}>Plataforma genérica</Text>
          <Text style={styles.destaqueTexto}>Cada empresa pode cadastrar seus próprios serviços, equipamentos e itens de verificação pelo aplicativo.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <Text style={styles.cardTitulo}>Cadastro do modelo</Text>
            <TouchableOpacity onPress={limparFormulario} style={styles.botaoNovo}>
              <Ionicons name="add" size={16} color="#123c69" />
              <Text style={styles.botaoNovoTexto}>Novo</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Nome do modelo. Ex: Instalação de box de vidro"
            placeholderTextColor="#667085"
            value={modeloAtual.nome}
            onChangeText={(valor) => atualizarCampo('nome', valor)}
          />
          <TextInput
            style={styles.input}
            placeholder="Categoria/serviço. Ex: Vidraçaria, marcenaria, ar-condicionado"
            placeholderTextColor="#667085"
            value={modeloAtual.categoria}
            onChangeText={(valor) => atualizarCampo('categoria', valor)}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição opcional do uso deste modelo"
            placeholderTextColor="#667085"
            value={modeloAtual.descricao}
            onChangeText={(valor) => atualizarCampo('descricao', valor)}
            multiline
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <Text style={styles.cardTitulo}>Itens de verificação ({totalItens})</Text>
            <TouchableOpacity onPress={adicionarItem} style={styles.botaoAdicionarPequeno}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.botaoAdicionarTexto}>Item</Text>
            </TouchableOpacity>
          </View>

          {(modeloAtual.itens || []).map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopo}>
                <Text style={styles.itemTitulo}>Item {index + 1}</Text>
                <TouchableOpacity onPress={() => removerItem(item.id)}>
                  <Ionicons name="trash" size={18} color="#c62828" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Ex: conferir nivelamento, testar funcionamento, tirar foto final..."
                placeholderTextColor="#667085"
                value={item.texto}
                onChangeText={(valor) => atualizarItem(item.id, 'texto', valor)}
              />
              <View style={styles.flagsLinha}>
                {renderBotaoFlag(item, 'exigeFoto', 'Foto obrigatória', 'camera')}
                {renderBotaoFlag(item, 'exigeObservacao', 'Obs. obrigatória', 'chatbox-ellipses')}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.botaoSalvar} onPress={salvarModelo} disabled={salvando}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar modelo de checklist'}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <Text style={styles.cardTitulo}>Modelos cadastrados</Text>
            <Text style={styles.contador}>{modelos.length}</Text>
          </View>

          {carregando ? (
            <Text style={styles.vazioTexto}>Carregando modelos...</Text>
          ) : modelos.length === 0 ? (
            <Text style={styles.vazioTexto}>Nenhum modelo cadastrado ainda.</Text>
          ) : (
            modelos.map((modelo) => {
              const sincronizado = modelo.sincronizacao === 'sincronizado';
              return (
                <View key={modelo.id} style={styles.modeloCard}>
                  <View style={styles.modeloTopo}>
                    <View style={styles.modeloIcone}>
                      <Ionicons name="list" size={22} color="#123c69" />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.modeloNome}>{modelo.nome}</Text>
                      <Text style={styles.modeloTexto}>{modelo.categoria || 'Sem categoria'} • {(modelo.itens || []).length} itens</Text>
                      <View style={[styles.syncBadge, sincronizado ? styles.syncOk : styles.syncLocal]}>
                        <Ionicons name={sincronizado ? 'cloud-done' : 'phone-portrait'} size={13} color={sincronizado ? '#2e7d32' : '#ef6c00'} />
                        <Text style={[styles.syncTexto, { color: sincronizado ? '#2e7d32' : '#ef6c00' }]}>{sincronizado ? 'Sincronizado' : 'Salvo no celular'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modeloAcoes}>
                    <TouchableOpacity style={styles.modeloBotao} onPress={() => abrirModelo(modelo)}>
                      <Ionicons name="create" size={16} color="#123c69" />
                      <Text style={styles.modeloBotaoTexto}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modeloBotaoExcluir} onPress={() => excluirModelo(modelo.id)}>
                      <Ionicons name="trash" size={16} color="#c62828" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  titulo: { color: '#fff', fontSize: 20, fontWeight: '900' },
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
  destaqueTexto: { color: '#425466', fontSize: 12, fontWeight: '700', marginTop: 2, lineHeight: 18 },
  cardTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitulo: { color: '#123c69', fontSize: 16, fontWeight: '900' },
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
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  botaoNovo: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 7 },
  botaoNovoTexto: { color: '#123c69', fontWeight: '900', fontSize: 12 },
  botaoAdicionarPequeno: {
    backgroundColor: '#123c69',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  botaoAdicionarTexto: { color: '#fff', fontWeight: '900', fontSize: 12 },
  itemCard: { borderWidth: 1, borderColor: '#d8e2ec', borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
  itemTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  itemTitulo: { color: '#123c69', fontWeight: '900', fontSize: 13 },
  flagsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagBotao: {
    borderWidth: 1,
    borderColor: '#bfd0df',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
  },
  flagBotaoAtivo: { backgroundColor: '#123c69', borderColor: '#123c69' },
  flagTexto: { color: '#123c69', fontWeight: '900', fontSize: 11 },
  flagTextoAtivo: { color: '#fff' },
  botaoSalvar: {
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  botaoSalvarTexto: { color: '#fff', fontSize: 16, fontWeight: '900' },
  contador: { color: '#123c69', fontWeight: '900', fontSize: 16 },
  vazioTexto: { color: '#667085', fontSize: 14, fontWeight: '700' },
  modeloCard: { borderWidth: 1, borderColor: '#d8e2ec', borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
  modeloTopo: { flexDirection: 'row', alignItems: 'center' },
  modeloIcone: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#eaf3ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  modeloNome: { color: '#123c69', fontWeight: '900', fontSize: 15 },
  modeloTexto: { color: '#52616f', fontWeight: '700', fontSize: 12, marginTop: 2 },
  syncBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncOk: { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7' },
  syncLocal: { backgroundColor: '#fff3e0', borderColor: '#ffcc80' },
  syncTexto: { fontSize: 11, fontWeight: '900' },
  modeloAcoes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  modeloBotao: { flex: 1, borderWidth: 1, borderColor: '#bfd0df', borderRadius: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, backgroundColor: '#fff' },
  modeloBotaoTexto: { color: '#123c69', fontWeight: '900', fontSize: 12 },
  modeloBotaoExcluir: { width: 42, borderWidth: 1, borderColor: '#f0c3c3', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5f5' },
});
