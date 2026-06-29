import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

    headerEntregaNovo: {
      backgroundColor: '#ffffff',
      borderRadius: 22,
      padding: 20,
      marginBottom: 18,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 4,
    },

    headerTopoEntrega: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    logoEntregaNovo: {
      width: 72,
      height: 72,
      resizeMode: 'contain',
    },

    headerInfoEntrega: {
      marginLeft: 14,
      flex: 1,
    },

    tituloEntregaNovo: {
      fontSize: 22,
      fontWeight: '900',
      color: '#123c69',
    },

    subtituloEntregaNovo: {
      fontSize: 14,
      color: '#64748b',
      marginTop: 4,
    },

    cardStatusEntrega: {
      marginTop: 18,
      backgroundColor: '#eff6ff',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: '#bfdbfe',
    },

    statusEntregaLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: '#1d4ed8',
      marginBottom: 4,
    },

    statusEntregaQtd: {
      fontSize: 18,
      fontWeight: '900',
      color: '#123c69',
    },

    progressoTextoLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },

    progressoTextoDestaque: {
      fontSize: 16,
      fontWeight: '900',
      color: '#1d4ed8',
    },

    progressoFundo: {
      height: 12,
      backgroundColor: '#dbeafe',
      borderRadius: 999,
      overflow: 'hidden',
      marginTop: 10,
    },

    progressoBarra: {
      height: '100%',
      backgroundColor: '#16a34a',
      borderRadius: 999,
    },

    dashboardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },

    categoriaTituloTexto: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },

    itemBoxNao: {
      borderColor: '#b42318',
      borderWidth: 2,
      backgroundColor: '#fff5f5',
    },

    botaoOkAtivo: {
      backgroundColor: '#1f7a4d',
      borderColor: '#1f7a4d',
    },

    botaoNaoAtivo: {
      backgroundColor: '#b42318',
      borderColor: '#b42318',
    },

    categoriaTitulo: {
      backgroundColor: '#1f3f6d',
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 12,
      marginBottom: 8,
      textTransform: 'uppercase',
    },

    cardPedido: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#d9e2ef',
    },

    tituloPedido: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1f3f68',
    },

    clientePedido: {
      fontSize: 13,
      color: '#333',
      marginTop: 4,
    },

    statusPedido: {
      fontSize: 12,
      color: '#f59e0b',
      marginTop: 4,
      fontWeight: 'bold',
    },

    inputBusca: {
      backgroundColor: '#fff',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: '#dbe4ea',
      fontSize: 15,
    },

    divisorVertical: {
      width: 1,
      height: 70,
      backgroundColor: '#dbe4ea',
      marginHorizontal: 18,
    },

    linhaUltimoAtendimento: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: '#dbe4ea',
      minHeight: 95,
      width: '100%',
    },

    infoUltimo: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    botaoSairMini: {
      backgroundColor: '#c62828',
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 90,
    },

    botaoSairMiniTexto: {
      color: '#fff',
      fontWeight: 'bold',
    },

    dashboardCardAlerta: {
      backgroundColor: '#f59e0b',
      width: '48%',
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },

    dashboardCardErro: {
      backgroundColor: '#b42318',
      width: '48%',
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },

    ultimoAtendimentoCard: {
      backgroundColor: '#fff',
      width: '48%',
      minHeight: 90,
      borderRadius: 14,
      padding: 16,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: '#dbe4ea',
      alignItems: 'center',
      justifyContent: 'center',
    },

    ultimoAtendimentoIcone: {
      fontSize: 22,
      marginBottom: 4,
    },

    ultimoAtendimentoTitulo: {
      fontSize: 12,
      color: '#64748b',
      fontWeight: '800',
      textAlign: 'center',
    },

    ultimoAtendimentoTexto: {
      fontSize: 18,
      color: '#123c69',
      fontWeight: '900',
      textAlign: 'center',
    },

    dashboardCard: {
      backgroundColor: '#1f3f70',
      width: '48%',
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginBottom: 10,
    },

    dashboardNumero: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '900',
    },

    dashboardTexto: {
      color: '#dbeafe',
      marginTop: 6,
      fontWeight: '700',
    },

    logoPdf: {
      width: 280,
      height: 180,
      resizeMode: 'contain',
      alignSelf: 'center',
      marginBottom: 10,
    },

    flex: { flex: 1 },
    safe: { flex: 1, backgroundColor: '#eef2f7' },
    container: { padding: 16, paddingBottom: 40 },
    header: {
      backgroundColor: '#ffffff',
      borderRadius: 22,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#dbe4ea',
      elevation: 4,
    },

    pickerContainer: {
      backgroundColor: '#fff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#dbe4ea',
      marginBottom: 16,
      overflow: 'hidden',
    },

    abaNaoIniciado: {
      backgroundColor: '#dc2626',
    },

    abaPendente: {
      backgroundColor: '#fef3c7',
    },

    abaConcluido: {
      backgroundColor: '#dcfce7',
    },

    abaTextoNaoIniciado: {
      color: '#fff',
    },

    logo: { width: 140, height: 60, resizeMode: 'contain', marginBottom: 10 },
    titulo: { fontSize: 25, color: '#14532d', fontWeight: '900', textAlign: 'center' },
    subtitulo: { fontSize: 16, color: '#334155', marginTop: 6, textAlign: 'center', fontWeight: '700' },
    equipamento: { fontSize: 14, color: '#475569', marginTop: 8, textAlign: 'center', fontWeight: '600' },
    botaoConfig: { backgroundColor: '#f59e0b', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 14 },
    botaoConfigTexto: { color: '#111827', fontWeight: '900' },
    botaoHistorico: { backgroundColor: '#334155', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 14 },
    cardResumo: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 14, elevation: 2 },
    resumoBox: { flex: 1, alignItems: 'center' },
    resumoNumero: { fontSize: 24, fontWeight: '900', color: '#123c69' },
    resumoTexto: { fontSize: 12, color: '#586273', marginTop: 3 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, elevation: 2 },
    secaoTitulo: { fontSize: 18, fontWeight: '900', color: '#123c69', marginBottom: 12 },
    campoBox: { marginBottom: 10 },
    label: { fontSize: 13, color: '#4b5563', marginBottom: 5, fontWeight: '800' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: '#f9fafb' },
    abasEquipamentos: { gap: 10, marginBottom: 10 },
    abaEquipamento: { backgroundColor: '#e5e7eb', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, elevation: 2 },
    abaAtiva: { borderWidth: 2, borderColor: '#123c69' },
    abaTexto: { color: '#111827', fontWeight: '900', fontSize: 15 },
    abaSubTexto: { fontSize: 12, fontWeight: '800', marginTop: 4, opacity: 0.92 },
    abaTextoAtivo: { color: '#fff' },
    tiposContainer: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    tipoBotao: { backgroundColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 8 },
    tipoBotaoAtivo: { backgroundColor: '#14532d' },
    tipoBotaoTexto: { color: '#1e293b', fontWeight: '800' },
    tipoBotaoTextoAtivo: { color: '#fff' },
    botaoPrincipal: { backgroundColor: '#123c69', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10 },
    botaoPrincipalTexto: { color: '#fff', fontWeight: '900' },
    configItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
    itemBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
    itemTexto: { fontSize: 15, color: '#111827', fontWeight: '800', marginBottom: 10 },
    historicoCard: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 14, padding: 12, marginBottom: 12, backgroundColor: '#f8fafc' },
    historicoTitulo: { fontSize: 17, fontWeight: '900', color: '#14532d', marginBottom: 8 },
    historicoEquipamento: { color: '#334155', fontWeight: '700', marginTop: 4 },
    acoesHistorico: { marginTop: 12, gap: 10 },
    botaoPdfHistorico: { backgroundColor: '#f59e0b', padding: 14, borderRadius: 12, alignItems: 'center' },
    botaoPdfHistoricoTexto: { color: '#111827', fontWeight: '900' },
    botaoEmailHistorico: { backgroundColor: '#15803d', padding: 14, borderRadius: 12, alignItems: 'center' },
    botaoEmailHistoricoTexto: { color: '#fff', fontWeight: '900' },
    botoesLinha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    botoesLinhaInferior: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
    botaoOpcao: { flex: 1, minWidth: 90, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: '#fff' },
    botaoOkAtivo: { backgroundColor: '#12805c', borderColor: '#12805c' },
    botaoNaoAtivo: { backgroundColor: '#b42318', borderColor: '#b42318' },
    botaoOpcaoTexto: { fontWeight: '900', color: '#334155' },
    botaoOpcaoTextoAtivo: { color: '#fff' },
    botaoEditar: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
    botaoEditarTexto: { color: '#fff', fontWeight: '900' },
    botaoRemover: { backgroundColor: '#b42318', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
    botaoRemoverGrande: { backgroundColor: '#b42318', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
    botaoRemoverTexto: { color: '#fff', fontWeight: '900' },
    botaoOkPequeno: { backgroundColor: '#12805c', borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'center' },
    botaoPequenoTexto: { color: '#fff', fontWeight: '900' },
    obsItem: { marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 9, backgroundColor: '#fff' },
    botaoFoto: { backgroundColor: '#123c69', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
    botaoFotoTexto: { color: '#fff', fontWeight: '900' },
    botaoFotoItem: { backgroundColor: '#0f766e', borderRadius: 10, padding: 11, alignItems: 'center', marginTop: 10 },
    botaoFotoItemTexto: { color: '#fff', fontWeight: '900' },
    fotoPreview: { width: '100%', height: 190, borderRadius: 12, marginTop: 12, backgroundColor: '#e5e7eb' },
    fotoItem: { width: '100%', height: 180, borderRadius: 12, marginTop: 10, backgroundColor: '#e5e7eb' },
    semFoto: { marginTop: 10, color: '#6b7280', fontStyle: 'italic' },
    textArea: { minHeight: 120, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: '#f9fafb', textAlignVertical: 'top' },
    assinaturaPreview: { width: '100%', height: 150, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#fff', resizeMode: 'contain' },
    modalAssinatura: { flex: 1, backgroundColor: '#eef2f7', paddingHorizontal: 14, paddingBottom: 14, paddingTop: 45, },
    modalTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitulo: { fontSize: 22, fontWeight: '900', color: '#123c69' },
    botaoFechar: { backgroundColor: '#b42318', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
    botaoFecharTexto: { color: '#fff', fontWeight: '900' },
    assinaturaTelaCheia: { flex: 1, marginTop: 35, paddingTop: 15, minHeight: 430, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db' },
    botoesAssinaturaModal: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 },
    botaoLimparAssinatura: { flex: 1, backgroundColor: '#64748b', borderRadius: 14, padding: 16, alignItems: 'center' },
    botaoSalvarAssinatura: { flex: 2, backgroundColor: '#12805c', borderRadius: 14, padding: 16, alignItems: 'center' },
    botaoSecundario: { marginTop: 10, borderWidth: 1, borderColor: '#123c69', borderRadius: 10, padding: 12, alignItems: 'center' },
    botaoSecundarioTexto: { color: '#123c69', fontWeight: '900' },
    botaoFinalizar: { backgroundColor: '#123c69', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 4 },
    botaoPdf: { backgroundColor: '#14532d', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
    botaoEmail: { backgroundColor: '#2563eb', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
    botaoFinalizarTexto: { color: '#fff', fontSize: 17, fontWeight: '900' },
    botaoResumoInteligente: { backgroundColor: '#7c3aed', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
    botaoIA: { backgroundColor: '#123c69', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
    botaoSalvarResumoInteligente: { backgroundColor: '#0f766e', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
    botaoDesabilitado: { opacity: 0.65 },
    resumoInteligenteAjuda: { color: '#475569', fontSize: 13, fontWeight: '700', lineHeight: 19, marginBottom: 10 },
    textAreaResumoInteligente: { minHeight: 150, borderWidth: 1, borderColor: '#c4b5fd', borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: '#faf5ff', textAlignVertical: 'top', color: '#111827', marginTop: 10 },
    iaBox: { marginTop: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 16, padding: 14, backgroundColor: '#f8fbff' },
    iaBoxTitulo: { color: '#123c69', fontSize: 16, fontWeight: '900', marginBottom: 6 },
    iaSugestoesLista: { marginTop: 12, gap: 8 },
    iaSugestaoItem: { borderWidth: 1, borderColor: '#dbeafe', borderRadius: 12, padding: 12, backgroundColor: '#ffffff' },
    iaSugestaoTitulo: { color: '#111827', fontSize: 14, fontWeight: '900', lineHeight: 20 },
    iaSugestaoMeta: { color: '#0f766e', fontSize: 12, fontWeight: '800', marginTop: 5 },

    cardResumoPedido: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 18,
      marginTop: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#d9e2ec',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },

    resumoPedidoTitulo: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#0b1f3a',
      marginBottom: 12,
    },

    resumoPedidoLinha: {
      fontSize: 16,
      color: '#1f2933',
      marginBottom: 8,
      fontWeight: '600',
    },

    botaoMaps: {
      backgroundColor: '#eaeaff',
      borderWidth: 1,
      borderColor: '#1f3f6d',
      borderRadius: 10,
      paddingVertical: 16,
      marginTop: 16,
      alignItems: 'center',
    },

    botaoMapsTexto: {
      color: '#1f3f6d',
      fontSize: 15,
      fontWeight: 'bold',
    },

  });
