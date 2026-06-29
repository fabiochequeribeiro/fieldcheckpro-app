import React from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useHomeScreen } from './HomeScreenContext';
import { SectionTitle, TimelineCard } from '../../components/fieldcheck/AppComponents';

const LOGO_HISTORICO = require('../../assets/fieldcheckpro-icon.png');

function horarioHistorico(visita = {}) {
  const valor = visita.finalizado_em || visita.enviado_em || visita.created_at || visita.data_visita || visita.data;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Agora';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoricoVisitasView() {
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
            <Image source={LOGO_HISTORICO} style={styles.logo} />
            <Text style={styles.titulo}>Histórico de Visitas</Text>
            <Text style={styles.subtitulo}>Entregas técnicas salvas no celular</Text>
          </View>

          <TouchableOpacity style={styles.botaoConfig} onPress={() => setTela('pedido')}>
            <Text style={styles.botaoConfigTexto}>Voltar para a visita</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar cliente, cidade ou técnico..."
            value={buscaHistorico}
            onChangeText={setBuscaHistorico}
          />

          <SectionTitle title="Timeline inteligente" subtitle="Eventos recentes salvos neste aparelho" />
          {(historicoFiltrado || []).slice(0, 4).map((visita) => (
            <TimelineCard
              key={`timeline-${visita.id || visita.numero_pedido || visita.numero_os}`}
              time={horarioHistorico(visita)}
              title={visita.cliente || 'Cliente não informado'}
              description={`Pedido ${visita.numero_pedido || '-'} · ${normalizarVisitaHistorico(visita).finalizado ? 'Relatório pronto' : 'Serviço em andamento'}`}
              status={normalizarVisitaHistorico(visita).finalizado ? 'concluido' : 'em_andamento'}
              icon={normalizarVisitaHistorico(visita).finalizado ? 'document-text' : 'construct'}
              onPress={() => normalizarVisitaHistorico(visita).finalizado ? visualizarVisitaFinalizada(visita) : continuarVisita(visita)}
            />
          ))}

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
                    Equipamentos: {visita.equipamentos?.length || visita.total_equipamentos || 0}
                  </Text>

                  {normalizarVisitaHistorico(visita).finalizado ? (
                    <View style={styles.acoesHistorico}>
                      <TouchableOpacity
                        style={styles.botaoPrincipal}
                        onPress={() => visualizarVisitaFinalizada(visita)}
                      >
                        <Text style={styles.botaoPrincipalTexto}>
                          Visualizar entrega
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.botaoPdfHistorico}
                        onPress={() => gerarPdfVisitaHistorico(visita, false)}
                      >
                        <Text style={styles.botaoPdfHistoricoTexto}>
                          Gerar/Reenviar PDF
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.botaoEmailHistorico}
                        onPress={() => gerarPdfVisitaHistorico(visita, true)}
                      >
                        <Text style={styles.botaoEmailHistoricoTexto}>
                          Enviar por e-mail
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.botaoPrincipal}
                      onPress={() => continuarVisita(visita)}
                    >
                      <Text style={styles.botaoPrincipalTexto}>
                        Continuar visita
                      </Text>
                    </TouchableOpacity>
                  )}

                </View>
              ))
            )}
          </Secao>

          <TouchableOpacity
  style={styles.botaoRemoverGrande}
  onPress={() => Alert.alert('Aviso', 'Função de limpar histórico desativada por enquanto.')}
>
  <Text style={styles.botaoRemoverTexto}>Limpar histórico deste celular</Text>
</TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
}
