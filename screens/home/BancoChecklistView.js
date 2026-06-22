import React from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useHomeScreen } from './HomeScreenContext';

const LOGO_HISTORICO = require('../../assets/fieldcheck-icon.png');

export default function BancoChecklistView() {
  const {
    styles,
    LOGO_FIXO,
    historico,
    historicoFiltrado,
    setTela,
    buscaHistorico,
    setBuscaHistorico,
    Secao,
    normalizarVisitaHistorico,
    visualizarVisitaFinalizada,
    gerarPdfVisitaHistorico,
    continuarVisita,
    emailLogin,
    setEmailLogin,
    senhaLogin,
    setSenhaLogin,
    fazerLogin,
    listaPedidos,
    setNumeroPedido,
    buscarPedido,
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
    equipamento,
    equipamentoAtual,
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
    BotaoOpcao,
    Campo,
    removerEquipamento
  } = useHomeScreen();

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image source={LOGO_FIXO} style={styles.logo} />
            <Text style={styles.titulo}>Banco de Checklists</Text>
            <Text style={styles.subtitulo}>Modelos inteligentes por tipo de equipamento</Text>
          </View>

          <TouchableOpacity style={styles.botaoConfig} onPress={() => setTela('pedido')}>
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
            <Text style={styles.botaoSecundarioTexto}>Restaurar banco inicial</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
}
