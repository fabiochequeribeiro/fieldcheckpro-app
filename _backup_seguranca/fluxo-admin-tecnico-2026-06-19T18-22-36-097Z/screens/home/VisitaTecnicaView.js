import React from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useHomeScreen } from './HomeScreenContext';

const LOGO_HISTORICO = require('../../assets/fieldcheck-icon.png');

export default function VisitaTecnicaView() {
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

    if (etapaVisita === 'equipamento' && equipamentoAtual !== null && equipamento) {
      return (
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              ref={visitaScrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.container,
                { paddingBottom: 110 }
              ]}
            >
              <View style={styles.headerEntregaNovo}>
                <View style={styles.headerTopoEntrega}>
                  <Image source={LOGO_FIXO} style={styles.logoEntregaNovo} />
                  <View style={styles.headerInfoEntrega}>
                    <Text style={styles.tituloEntregaNovo}>
                      {equipamento?.nome || equipamento?.tipo || 'Equipamento'}
                    </Text>
                    <Text style={styles.subtituloEntregaNovo}>
                      Checklist individual do equipamento
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.botaoSecundario} onPress={voltarParaResumoVisita}>
                <Text style={styles.botaoSecundarioTexto}>Voltar sem salvar</Text>
              </TouchableOpacity>

            {equipamento && (
              <Secao titulo="Dados do equipamento selecionado">
                <Campo
                  label="Nome do equipamento"
                  value={equipamento?.nome || ''}
                  onChangeText={(v) => atualizarEquipamento('nome', v)}
                />

                <Campo
                  label="Modelo"
                  value={equipamento?.modelo || ''}
                  onChangeText={(v) => atualizarEquipamento('modelo', v)}
                />

                <Campo
                  label="Número de série"
                  value={equipamento?.serie || ''}
                  onChangeText={(v) => atualizarEquipamento('serie', v)}
                />

                <Campo
                  label="Descritivo"
                  value={equipamento?.descritivo || ''}
                  onChangeText={(v) => atualizarEquipamento('descritivo', v)}
                />

                <TouchableOpacity
                  style={styles.botaoFoto}
                  onPress={escolherFotoEquipamento}
                >
                  <Text style={styles.botaoFotoTexto}>
                    {equipamento?.foto
                      ? 'Trocar foto do equipamento'
                      : 'Adicionar foto do equipamento'}
                  </Text>
                </TouchableOpacity>

                {equipamento?.foto ? (
                  <Image
                    source={{ uri: equipamento.foto }}
                    style={styles.fotoPreview}
                  />
                ) : (
                  <Text style={styles.semFoto}>
                    Sem foto deste equipamento
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.botaoRemoverGrande}
                  onPress={removerEquipamento}
                >
                  <Text style={styles.botaoRemoverTexto}>
                    Remover este equipamento
                  </Text>
                </TouchableOpacity>
              </Secao>
            )}

            <Secao titulo="Adicionar item somente nesta visita">
              <Campo label="Novo item da visita" value={novoItemVisita} onChangeText={setNovoItemVisita} />
              <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarItemVisita}>
                <Text style={styles.botaoPrincipalTexto}>Adicionar item ao equipamento</Text>
              </TouchableOpacity>
            </Secao>


            <Secao titulo="Checklist do equipamento selecionado">
              {(equipamento?.itens || []).map((item, index) => {
                if (!item.ativo) return null;
                return (
                  <View
                    key={`${item.texto}-${index}`}
                    style={[
                      styles.itemBox,
                      item.resposta === 'NAO' ? styles.itemBoxNao : null,
                    ]}
                  >
                    {editandoItemVisita === index ? (
                      <>
                        <TextInput style={styles.input} value={textoEditandoVisita} onChangeText={setTextoEditandoVisita} />
                        <TouchableOpacity style={styles.botaoOkPequeno} onPress={salvarEdicaoItemVisita}>
                          <Text style={styles.botaoPequenoTexto}>Salvar alteração</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>

                        {(
                          index === 0 ||
                          ((equipamento.itens[index - 1] && equipamento.itens[index - 1].categoria
                            ? equipamento.itens[index - 1].categoria.trim()
                            : 'GERAL') !==
                            (item.categoria ? item.categoria.trim() : 'GERAL'))
                        ) ? (
                          <Text style={styles.categoriaTitulo}>
                            {item.categoria ? item.categoria.trim() : 'GERAL'}
                          </Text>
                        ) : null}

                        <Text style={styles.itemTexto}>
                          {item.texto}
                        </Text>

                        <View style={styles.botoesLinha}>
                          <BotaoOpcao texto="OK" ativo={item.resposta === 'OK'} tipo="ok" onPress={() => alterarItemVisita(index, { resposta: 'OK' })} />
                          <BotaoOpcao texto="Não" ativo={item.resposta === 'NAO'} tipo="nao" onPress={() => alterarItemVisita(index, { resposta: 'NAO' })} />
                        </View>
                        <TextInput style={styles.obsItem} placeholder="Observação deste item" placeholderTextColor="#666" value={item.obs} onChangeText={(v) => alterarItemVisita(index, { obs: v })} />
                        <TouchableOpacity style={styles.botaoFotoItem} onPress={() => adicionarFotoItem(index)}>
                          <Text style={styles.botaoFotoItemTexto}>{item.foto ? 'Trocar foto deste item' : 'Adicionar foto deste item'}</Text>
                        </TouchableOpacity>
                        {item.foto ? <Image source={{ uri: item.foto }} style={styles.fotoItem} /> : null}
                        <View style={styles.botoesLinhaInferior}>
                          <TouchableOpacity style={styles.botaoEditar} onPress={() => { setEditandoItemVisita(index); setTextoEditandoVisita(item.texto); }}>
                            <Text style={styles.botaoEditarTexto}>Editar item</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.botaoRemover} onPress={() => removerItemVisita(index)}>
                            <Text style={styles.botaoRemoverTexto}>Remover item</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </Secao>



              <Secao titulo="Observações do equipamento">
                <TextInput
                  style={styles.textArea}
                  placeholder="Digite observações deste equipamento."
                  value={equipamento?.observacoesEquipamento || ''}
                  onChangeText={(v) => atualizarEquipamento('observacoesEquipamento', v)}
                  multiline
                />
              </Secao>

              <TouchableOpacity style={styles.botaoFinalizar} onPress={salvarEquipamentoAtual}>
                <Text style={styles.botaoFinalizarTexto}>Salvar equipamento</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.botaoSecundario} onPress={voltarParaResumoVisita}>
                <Text style={styles.botaoSecundarioTexto}>Voltar sem salvar</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={visitaScrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.container,
              { paddingBottom: 110 }
            ]}
          >
            <View style={styles.dashboardGrid}>

              <View style={styles.dashboardCard}>
                <Text style={styles.dashboardNumero}>
                  {indicadoresVisitaAtual.visitas}
                </Text>

                <Text style={styles.dashboardTexto}>
                  Visitas
                </Text>
              </View>

              <View style={styles.dashboardCard}>
                <Text style={styles.dashboardNumero}>
                  {indicadoresVisitaAtual.equipamentos}
                </Text>

                <Text style={styles.dashboardTexto}>
                  Equipamentos
                </Text>

              </View>
              <View style={styles.dashboardCardAlerta}>
                <Text style={styles.dashboardNumero}>
                  {indicadoresVisitaAtual.pendentes}
                </Text>

                <Text style={styles.dashboardTexto}>
                  Itens pendentes
                </Text>
              </View>

              <View style={styles.dashboardCardErro}>
                <Text style={styles.dashboardNumero}>
                  {indicadoresVisitaAtual.nao}
                </Text>

                <Text style={styles.dashboardTexto}>
                  Não conformidades
                </Text>
              </View>

              <View style={styles.linhaUltimoAtendimento}>

                <View style={styles.infoUltimo}>
                  <Ionicons
                    name="calendar-outline"
                    size={26}
                    color="#c0392b"
                  />

                  <Text style={styles.ultimoAtendimentoTitulo}>
                    �altimo atendimento
                  </Text>

                  <Text style={styles.ultimoAtendimentoTexto}>
                    {ultimoAtendimentoCliente}
                  </Text>
                </View>

                <View style={styles.divisorVertical} />

                <TouchableOpacity
                  onPress={() => {
                    setTela('pedido');
                  }}
                  style={styles.botaoSairMini}
                >
                  <Text style={styles.botaoSairMiniTexto}>
                    Voltar
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

            <View style={styles.headerEntregaNovo}>

              <View style={styles.headerTopoEntrega}>
                <Image source={LOGO_FIXO} style={styles.logoEntregaNovo} />

                <View style={styles.headerInfoEntrega}>
                  <Text style={styles.tituloEntregaNovo}>
                    {dados.empresa}
                  </Text>

                  <Text style={styles.subtituloEntregaNovo}>
                    Serviço técnico industrial
                  </Text>
                </View>
              </View>

              <View style={styles.cardStatusEntrega}>
                <View style={styles.progressoTextoLinha}>
                  <Text style={styles.statusEntregaLabel}>
                    PROGRESSO DA VISITA
                  </Text>

                  <Text style={styles.progressoTextoDestaque}>
                    {progressoVisita.percentual}%
                  </Text>
                </View>

                <Text style={styles.statusEntregaQtd}>
                  {progressoVisita.equipamentosSalvosQtd} de {progressoVisita.totalEquipamentos} equipamento(s) salvos
                </Text>

                <View style={styles.progressoFundo}>
                  <View
                    style={[
                      styles.progressoBarra,
                      { width: `${progressoVisita.percentual}%` },
                    ]}
                  />
                </View>
              </View>

            </View>

            <TouchableOpacity
              style={styles.botaoHistorico}
              onPress={() => {
                carregarHistorico();
                setTela('historico');
              }}
            >
              <Text style={styles.botaoFinalizarTexto}>Abrir Histórico de Visitas</Text>
            </TouchableOpacity>

            <View style={styles.cardResumo}>
              <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.ok}</Text><Text style={styles.resumoTexto}>OK</Text></View>
              <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.nao}</Text><Text style={styles.resumoTexto}>Não</Text></View>
              <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.pendentes}</Text><Text style={styles.resumoTexto}>Pendentes</Text></View>
            </View>

            <Secao titulo="Dados do cliente e da visita">

                <Picker
                  selectedValue={clienteSelecionado}
                  onValueChange={(itemValue) => {

                    setClienteSelecionado(itemValue);

                    const clienteEscolhido = listaClientes.find(
                      (c) => c.id === itemValue
                    );

                    if (clienteEscolhido) {

                      atualizarCampo('cliente', clienteEscolhido.nome);
                      atualizarCampo('cidade', clienteEscolhido.cidade || '');
                      atualizarCampo('emailCliente', clienteEscolhido.email || '');


                    }
                  }}
                >

                  <Picker.Item
                    label="Selecione um cliente"
                    value={null}
                  />

                  {clientesUnicos.map((item) => (
                    <Picker.Item
                      key={item.id}
                      label={item.nome}
                      value={item.id}
                    />
                  ))}
                </Picker>

              <Campo label="Cliente" value={dados.cliente} onChangeText={(v) => atualizarCampo('cliente', v)} />
              <Campo label="Endereço" value={dados.endereco} onChangeText={(v) => atualizarCampo('endereco', v)} />
              <Campo label="Cidade" value={dados.cidade} onChangeText={(v) => atualizarCampo('cidade', v)} />
              <Campo label="Estado" value={dados.estado} onChangeText={(v) => atualizarCampo('estado', v)} />
              <Campo label="Telefone" value={dados.telefone} onChangeText={(v) => atualizarCampo('telefone', v)} />
              <Campo label="E-mail do cliente" value={dados.emailCliente} onChangeText={(v) => atualizarCampo('emailCliente', v)} />
              <Campo label="Responsável" value={dados.responsavel} onChangeText={(v) => atualizarCampo('responsavel', v)} />
              <Campo label="Técnico responsável" value={dados.tecnico} onChangeText={(v) => atualizarCampo('tecnico', v)} />
              <Campo label="Data" value={dados.data} onChangeText={(v) => atualizarCampo('data', v)} />
            </Secao>

            <Secao titulo="Equipamentos desta visita">
              <BotoesEquipamentos />
              <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarEquipamento}>
                <Text style={styles.botaoPrincipalTexto}>Adicionar outro equipamento</Text>
              </TouchableOpacity>
            </Secao>




            <Secao titulo="Observações gerais da visita">
              <TextInput style={styles.textArea} placeholder="Digite observações gerais da visita." value={dados.observacoes} onChangeText={(v) => atualizarCampo('observacoes', v)} multiline />
            </Secao>

            <Secao titulo="Assinatura do cliente / responsável">
              {assinatura ? <Image source={{ uri: assinatura }} style={styles.assinaturaPreview} /> : <Text style={styles.semFoto}>Nenhuma assinatura registrada</Text>}
              <TouchableOpacity style={styles.botaoFinalizar} onPress={() => setAssinaturaAberta(true)}>
                <Text style={styles.botaoFinalizarTexto}>{assinatura ? 'Refazer assinatura' : 'Abrir tela de assinatura'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSecundario} onPress={limparAssinatura}>
                <Text style={styles.botaoSecundarioTexto}>Limpar assinatura</Text>
              </TouchableOpacity>
            </Secao>

            <TouchableOpacity style={styles.botaoFinalizar} onPress={finalizarChecklist}>

              <Text style={styles.botaoFinalizarTexto}>Finalizar checklist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoPdf} onPress={() => gerarPdf(false)}>
              <Text style={styles.botaoFinalizarTexto}>Gerar PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoEmail} onPress={() => gerarPdf(true)}>
              <Text style={styles.botaoFinalizarTexto}>Enviar PDF por e-mail</Text>
            </TouchableOpacity>
          </ScrollView>

          <Modal visible={assinaturaAberta} animationType="slide">
            <SafeAreaView style={styles.modalAssinatura}>
              <View style={styles.modalTopo}>
                <Text style={styles.modalTitulo}>Assinatura do cliente</Text>
                <TouchableOpacity style={styles.botaoFechar} onPress={() => setAssinaturaAberta(false)}>
                  <Text style={styles.botaoFecharTexto}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.assinaturaTelaCheia}>
                <SignatureScreen
                  ref={assinaturaRef}
                  onOK={salvarAssinatura}
                  onEmpty={() => Alert.alert('Assinatura vazia', 'Assine antes de salvar.')}
                  descriptionText="Assine dentro do quadro"
                  clearText=""
                  confirmText=""
                  webStyle={`.m-signature-pad { box-shadow: none; border: none; height: 100%; } .m-signature-pad--body { border: 2px solid #123c69; border-radius: 12px; top: 0; bottom: 0; } .m-signature-pad--footer { display: none; } body,html { background-color: #fff; width: 100%; height: 100%; }`}
                />
              </View>

              <View style={styles.botoesAssinaturaModal}>
                <TouchableOpacity style={styles.botaoLimparAssinatura} onPress={() => assinaturaRef.current?.clearSignature()}>
                  <Text style={styles.botaoFinalizarTexto}>Limpar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoSalvarAssinatura} onPress={confirmarAssinatura}>
                  <Text style={styles.botaoFinalizarTexto}>Salvar assinatura</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

        </KeyboardAvoidingView>
      </SafeAreaView>
    );
}
