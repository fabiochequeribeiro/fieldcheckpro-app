import React from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useHomeScreen } from './HomeScreenContext';

const LOGO_HISTORICO = require('../../assets/fieldcheck-icon.png');

export default function LoginTecnicoView() {
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
