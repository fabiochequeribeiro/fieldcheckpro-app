import React from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useHomeScreen } from './HomeScreenContext';

const LOGO_HISTORICO = require('../../assets/fieldcheck-icon.png');

export default function PedidosView() {
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

            <Text style={styles.titulo}>
              Buscar Ordem/Pedido
            </Text>

            <Text style={styles.subtitulo}>
              Digite o número do pedido para iniciar a serviço técnico
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
                    buscarPedido(pedido.numero_pedido);
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
                            : pedido.status === 'em andamento' || pedido.status === 'em_andamento'
                              ? '#eab308'
                              : '#ff9800',
                      },
                    ]}
                  >
                    ⬢ {pedido.finalizado ? 'finalizado' : pedido.status || 'pendente'}
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

          {pedidoEncontrado && (
            <View style={styles.cardResumoPedido}>
              <Text style={styles.resumoPedidoTitulo}>
                Pedido #{pedidoEncontrado.numero_pedido}
              </Text>

              <Text style={styles.resumoPedidoLinha}>
                Cliente: {pedidoEncontrado.cliente || 'Cliente não informado'}
              </Text>

              <Text style={styles.resumoPedidoLinha}>
                Cidade: {pedidoEncontrado.cidade || 'Cidade não informada'}
              </Text>

              <Text style={styles.resumoPedidoLinha}>
                Equipamentos: {equipamentos?.length || 0}
              </Text>

              <TouchableOpacity
                style={styles.botaoPrincipal}
                onPress={iniciarEntregaTecnicaPedido}
              >
                <Text style={styles.botaoPrincipalTexto}>
                  Iniciar Serviço Técnico
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoMaps}
                onPress={() => abrirMaps(pedidoEncontrado)}
              >
                <Text style={styles.botaoMapsTexto}>
                  �x� Navegar até o cliente
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
}
