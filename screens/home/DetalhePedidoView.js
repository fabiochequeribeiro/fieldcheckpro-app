import React from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useHomeScreen } from './HomeScreenContext';

const LOGO_HISTORICO = require('../../assets/fieldcheckpro-icon.png');

export default function DetalhePedidoView() {
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
    BotaoOpcao,
    Campo,
    removerEquipamento
  } = useHomeScreen();

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerEntregaNovo}>
            <View style={styles.headerTopoEntrega}>
              <Image source={LOGO_FIXO} style={styles.logoEntregaNovo} />
              <View style={styles.headerInfoEntrega}>
                <Text style={styles.tituloEntregaNovo}>Pedido #{pedidoEncontrado.numero_pedido}</Text>
                <Text style={styles.subtituloEntregaNovo}>Confira os dados antes de iniciar</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardResumoPedido}>
            <Text style={styles.resumoPedidoTitulo}>Dados do pedido</Text>
            <Text style={styles.resumoPedidoLinha}>Cliente: {pedidoEncontrado.cliente || 'Cliente não informado'}</Text>
            <Text style={styles.resumoPedidoLinha}>Cidade: {pedidoEncontrado.cidade || 'Cidade não informada'}</Text>
            <Text style={styles.resumoPedidoLinha}>Estado: {pedidoEncontrado.estado || '-'}</Text>
            <Text style={styles.resumoPedidoLinha}>Endereço: {pedidoEncontrado.endereco || '-'}</Text>
            <Text style={styles.resumoPedidoLinha}>Telefone: {pedidoEncontrado.telefone || '-'}</Text>
            <Text style={styles.resumoPedidoLinha}>E-mail: {pedidoEncontrado.email || '-'}</Text>
            <Text style={styles.resumoPedidoLinha}>Responsável: {pedidoEncontrado.responsavel || '-'}</Text>
            <Text style={styles.resumoPedidoLinha}>Equipamentos: {equipamentos?.length || 0}</Text>
          </View>

          <TouchableOpacity
            style={styles.botaoPrincipal}
            onPress={iniciarEntregaTecnicaPedido}
          >
            <Text style={styles.botaoPrincipalTexto}>Iniciar serviço técnico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoMaps}
            onPress={() => abrirMaps(pedidoEncontrado)}
          >
            <Text style={styles.botaoMapsTexto}>Navegar até o cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() => setTela('pedido')}
          >
            <Text style={styles.botaoSecundarioTexto}>Voltar para pedidos</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
}
