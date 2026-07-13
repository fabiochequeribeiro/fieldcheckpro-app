import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
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
import { gerarPdfVisita } from '../services/relatorioVisitaPdf';
import { DEMO_ORDERS, DEMO_USER, montarEquipamentosDemo } from '../data/demoFieldCheckData';

const LOGO = require('../assets/fieldcheckpro-icon.png');
const STORAGE_DEMO_HISTORY = '@fieldcheck_demo_historico';
const WHATSAPP_URL = 'https://wa.me/5543984594216?text=Ol%C3%A1%2C%20testei%20o%20APK%20Demo%20do%20FieldCheck%20Pro%20e%20quero%20uma%20demonstra%C3%A7%C3%A3o%20completa.';
const SITE_URL = 'https://fieldcheckpro.com.br/';

function resumoEquipamentos(equipamentos) {
  const itens = (equipamentos || []).flatMap((eq) => eq.itens || []);
  return {
    total: itens.length,
    ok: itens.filter((item) => item.resposta === 'OK').length,
    nao: itens.filter((item) => item.resposta === 'NAO').length,
    pendentes: itens.filter((item) => !item.resposta).length,
  };
}

function montarAssinaturaDemo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="160" viewBox="0 0 520 160"><rect width="520" height="160" fill="white"/><path d="M45 94 C92 42 126 134 174 82 C211 42 222 112 258 82 C305 42 331 108 384 72 C412 53 435 55 474 70" fill="none" stroke="#123c69" stroke-width="7" stroke-linecap="round"/><text x="50" y="137" font-family="Arial" font-size="18" fill="#64748b">Assinatura demo do cliente</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function DemoExperienceScreen({ onExit }) {
  const [step, setStep] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [historico, setHistorico] = useState([]);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const resumo = useMemo(() => resumoEquipamentos(equipamentos), [equipamentos]);
  const equipamentoAtual = equipamentos[0] || null;

  function selecionarPedido(pedido) {
    setSelectedOrder(pedido);
    setEquipamentos(montarEquipamentosDemo(pedido));
    setAssinatura(null);
    setObservacoes('');
    setStep('checklist');
  }

  function alterarItem(index, resposta) {
    setEquipamentos((lista) => {
      const novaLista = [...lista];
      const eq = { ...novaLista[0], itens: [...(novaLista[0]?.itens || [])] };
      eq.itens[index] = { ...eq.itens[index], resposta };
      novaLista[0] = eq;
      return novaLista;
    });
  }

  function adicionarFotoDemo(index) {
    setEquipamentos((lista) => {
      const novaLista = [...lista];
      const eq = { ...novaLista[0], itens: [...(novaLista[0]?.itens || [])] };
      eq.itens[index] = {
        ...eq.itens[index],
        foto: 'demo-foto',
        obs: eq.itens[index].obs || 'Foto demo adicionada para apresentar evidência no fluxo.',
      };
      novaLista[0] = eq;
      return novaLista;
    });
  }

  function atualizarObsItem(index, obs) {
    setEquipamentos((lista) => {
      const novaLista = [...lista];
      const eq = { ...novaLista[0], itens: [...(novaLista[0]?.itens || [])] };
      eq.itens[index] = { ...eq.itens[index], obs };
      novaLista[0] = eq;
      return novaLista;
    });
  }

  async function finalizarDemo() {
    if (resumo.pendentes > 0) {
      Alert.alert('Checklist incompleto', 'Responda todos os itens para seguir para assinatura.');
      return;
    }
    setAssinatura(montarAssinaturaDemo());
    setStep('finish');
  }

  async function gerarPdfDemo() {
    if (!selectedOrder) return;
    setGerandoPdf(true);
    const dados = {
      numeroPedido: selectedOrder.numero_pedido,
      cliente: selectedOrder.cliente,
      endereco: selectedOrder.endereco,
      cidade: selectedOrder.cidade,
      estado: selectedOrder.estado,
      telefone: selectedOrder.telefone,
      emailCliente: selectedOrder.emailCliente,
      responsavel: selectedOrder.responsavel,
      tecnico: DEMO_USER.nome,
      empresa: 'FieldCheck Demo',
      data: new Date().toLocaleDateString('pt-BR'),
      observacoes: observacoes || 'Visita demo concluída com dados fictícios.',
    };
    try {
      await gerarPdfVisita({
        enviarEmail: false,
        equipamentos,
        dados,
        pedidoEncontrado: selectedOrder,
        logoModule: LOGO,
        numeroPedido: selectedOrder.numero_pedido,
        usuario: DEMO_USER,
        assinatura,
        resumoInteligente: 'Demo comercial: checklist executado com evidências, assinatura e relatório PDF. Em uma operação real, esses dados ficam vinculados ao cliente, equipamento, técnico e histórico da empresa.',
        gerarNumeroEntrega: async () => `DEMO-${Date.now().toString().slice(-6)}`,
      });

      const registro = {
        id: `${selectedOrder.numero_pedido}-${Date.now()}`,
        numero_pedido: selectedOrder.numero_pedido,
        cliente: selectedOrder.cliente,
        tipo: selectedOrder.tipo,
        data: new Date().toLocaleString('pt-BR'),
        resumo,
      };
      const novaLista = [registro, ...historico].slice(0, 8);
      setHistorico(novaLista);
      await AsyncStorage.setItem(STORAGE_DEMO_HISTORY, JSON.stringify(novaLista));
    } catch (error) {
      console.log('Erro no PDF demo:', error);
    } finally {
      setGerandoPdf(false);
    }
  }

  function abrirWhatsApp() {
    Linking.openURL(WHATSAPP_URL);
  }

  function abrirSite() {
    Linking.openURL(SITE_URL);
  }

  function reiniciar() {
    setSelectedOrder(null);
    setEquipamentos([]);
    setAssinatura(null);
    setObservacoes('');
    setStep('orders');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Image source={LOGO} style={styles.logo} />
            <TouchableOpacity style={styles.exitButton} onPress={onExit} activeOpacity={0.86}>
              <Ionicons name="close" size={22} color="#123c69" />
            </TouchableOpacity>
          </View>
          <Text style={styles.eyebrow}>Modo demonstração</Text>
          <Text style={styles.title}>Entenda o FieldCheck Pro em menos de 5 minutos.</Text>
          <Text style={styles.subtitle}>
            Dados 100% fictícios, sem banco de produção, sem login real e sem alterar operações existentes.
          </Text>
          <View style={styles.progressRow}>
            {['orders', 'checklist', 'finish', 'history'].map((item, index) => (
              <View key={item} style={[styles.progressDot, step === item && styles.progressDotActive]}>
                <Text style={[styles.progressText, step === item && styles.progressTextActive]}>{index + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        {step === 'orders' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione um pedido fictício</Text>
            {DEMO_ORDERS.map((pedido) => (
              <TouchableOpacity key={pedido.id} style={styles.orderCard} onPress={() => selecionarPedido(pedido)} activeOpacity={0.88}>
                <View style={styles.orderIcon}>
                  <Ionicons name="business" size={24} color="#087f3a" />
                </View>
                <View style={styles.orderText}>
                  <Text style={styles.orderNumber}>{pedido.numero_pedido}</Text>
                  <Text style={styles.orderClient}>{pedido.cliente}</Text>
                  <Text style={styles.orderMeta}>{pedido.tipo} - {pedido.cidade}/{pedido.estado}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#123c69" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {step === 'checklist' && equipamentoAtual ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{selectedOrder?.cliente}</Text>
            <Text style={styles.sectionSubtitle}>{equipamentoAtual.nome} - {equipamentoAtual.tag}</Text>
            <View style={styles.summaryRow}>
              <Metric label="OK" value={resumo.ok} tone="green" />
              <Metric label="Não" value={resumo.nao} tone="red" />
              <Metric label="Pendentes" value={resumo.pendentes} tone="amber" />
            </View>
            {(equipamentoAtual.itens || []).map((item, index) => (
              <View key={`${item.texto}-${index}`} style={styles.checkCard}>
                <Text style={styles.category}>{item.categoria}</Text>
                <Text style={styles.checkText}>{item.texto}</Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.choiceButton, item.resposta === 'OK' && styles.choiceOk]} onPress={() => alterarItem(index, 'OK')}>
                    <Text style={[styles.choiceText, item.resposta === 'OK' && styles.choiceTextActive]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.choiceButton, item.resposta === 'NAO' && styles.choiceNo]} onPress={() => alterarItem(index, 'NAO')}>
                    <Text style={[styles.choiceText, item.resposta === 'NAO' && styles.choiceTextActive]}>Não</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.photoButton, item.foto && styles.photoButtonActive]} onPress={() => adicionarFotoDemo(index)}>
                    <Ionicons name={item.foto ? 'image' : 'camera-outline'} size={18} color={item.foto ? '#fff' : '#123c69'} />
                    <Text style={[styles.photoText, item.foto && styles.photoTextActive]}>{item.foto ? 'Foto demo' : 'Foto'}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.obsInput}
                  placeholder="Observação do item"
                  placeholderTextColor="#8a97a8"
                  value={item.obs}
                  onChangeText={(value) => atualizarObsItem(index, value)}
                />
              </View>
            ))}
            <TextInput
              style={styles.bigInput}
              placeholder="Observações gerais da visita demo"
              placeholderTextColor="#8a97a8"
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
            />
            <TouchableOpacity style={styles.primaryButton} onPress={finalizarDemo}>
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.primaryText}>Assinar e finalizar checklist</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'finish' ? (
          <View style={styles.section}>
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={56} color="#087f3a" />
              <Text style={styles.successTitle}>Obrigado por testar o FieldCheck Pro.</Text>
              <Text style={styles.successText}>Gostou? Solicite uma demonstração completa para ver app, portal, IA, automação e relatórios em um fluxo real da sua empresa.</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={gerarPdfDemo} disabled={gerandoPdf}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.primaryText}>{gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF demo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('history')}>
              <Ionicons name="time-outline" size={20} color="#123c69" />
              <Text style={styles.secondaryText}>Visualizar histórico demo</Text>
            </TouchableOpacity>
            <View style={styles.ctaGrid}>
              <TouchableOpacity style={styles.ctaButton} onPress={abrirWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="#087f3a" />
                <Text style={styles.ctaText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaButton} onPress={abrirWhatsApp}>
                <Ionicons name="briefcase-outline" size={20} color="#087f3a" />
                <Text style={styles.ctaText}>Comercial</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaButton} onPress={abrirSite}>
                <Ionicons name="globe-outline" size={20} color="#087f3a" />
                <Text style={styles.ctaText}>Site</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.linkButton} onPress={reiniciar}>
              <Text style={styles.linkText}>Testar outro segmento</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'history' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico demo</Text>
            {(historico.length ? historico : [{ id: 'empty', numero_pedido: selectedOrder?.numero_pedido || 'DEMO', cliente: selectedOrder?.cliente || 'Cliente demo', tipo: selectedOrder?.tipo || 'Demo', data: 'PDF ainda não gerado', resumo }]).map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <Text style={styles.orderNumber}>{item.numero_pedido}</Text>
                <Text style={styles.orderClient}>{item.cliente}</Text>
                <Text style={styles.orderMeta}>{item.tipo} - {item.data}</Text>
                <Text style={styles.historyMeta}>OK {item.resumo?.ok || 0} | Não {item.resumo?.nao || 0} | Pendentes {item.resumo?.pendentes || 0}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('finish')}>
              <Text style={styles.primaryText}>Voltar para apresentação final</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, tone }) {
  return (
    <View style={[styles.metric, styles[`metric_${tone}`]]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f7fb' },
  container: { paddingBottom: 28 },
  hero: { backgroundColor: '#123c69', padding: 20, paddingBottom: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 138, height: 76, resizeMode: 'contain' },
  exitButton: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  eyebrow: { color: '#7ee787', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginTop: 14 },
  title: { color: '#fff', fontSize: 29, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#d8e7f8', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 10 },
  progressRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  progressDot: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: '#fff' },
  progressText: { color: '#fff', fontWeight: '900' },
  progressTextActive: { color: '#123c69' },
  section: { padding: 16, gap: 12 },
  sectionTitle: { color: '#123c69', fontSize: 23, fontWeight: '900' },
  sectionSubtitle: { color: '#64748b', fontSize: 14, fontWeight: '800', marginTop: -5 },
  orderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14 },
  orderIcon: { width: 46, height: 46, borderRadius: 8, backgroundColor: '#e7f7ee', alignItems: 'center', justifyContent: 'center' },
  orderText: { flex: 1 },
  orderNumber: { color: '#087f3a', fontSize: 13, fontWeight: '900' },
  orderClient: { color: '#111827', fontSize: 17, fontWeight: '900', marginTop: 2 },
  orderMeta: { color: '#64748b', fontSize: 13, fontWeight: '700', marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, borderRadius: 8, padding: 12, borderWidth: 1 },
  metric_green: { backgroundColor: '#e7f7ee', borderColor: '#bbf7d0' },
  metric_red: { backgroundColor: '#fff1f0', borderColor: '#fecaca' },
  metric_amber: { backgroundColor: '#fff7e6', borderColor: '#fed7aa' },
  metricValue: { color: '#111827', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  metricLabel: { color: '#475467', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  checkCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, gap: 10 },
  category: { color: '#087f3a', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  checkText: { color: '#111827', fontSize: 16, fontWeight: '900', lineHeight: 21 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceButton: { minHeight: 42, minWidth: 76, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  choiceOk: { backgroundColor: '#087f3a', borderColor: '#087f3a' },
  choiceNo: { backgroundColor: '#b42318', borderColor: '#b42318' },
  choiceText: { color: '#123c69', fontWeight: '900' },
  choiceTextActive: { color: '#fff' },
  photoButton: { minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoButtonActive: { backgroundColor: '#123c69', borderColor: '#123c69' },
  photoText: { color: '#123c69', fontWeight: '900' },
  photoTextActive: { color: '#fff' },
  obsInput: { minHeight: 46, borderWidth: 1, borderColor: '#dbe4ea', borderRadius: 8, paddingHorizontal: 12, color: '#111827', backgroundColor: '#f8fafc' },
  bigInput: { minHeight: 92, borderWidth: 1, borderColor: '#dbe4ea', borderRadius: 8, padding: 12, color: '#111827', backgroundColor: '#fff', textAlignVertical: 'top' },
  primaryButton: { minHeight: 52, borderRadius: 8, backgroundColor: '#087f3a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 15, textAlign: 'center' },
  secondaryButton: { minHeight: 52, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  secondaryText: { color: '#123c69', fontWeight: '900', fontSize: 15 },
  successCard: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', padding: 18, alignItems: 'center', gap: 10 },
  successTitle: { color: '#123c69', fontSize: 24, fontWeight: '900', textAlign: 'center', lineHeight: 29 },
  successText: { color: '#64748b', fontSize: 15, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  ctaGrid: { flexDirection: 'row', gap: 8 },
  ctaButton: { flex: 1, minHeight: 72, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ctaText: { color: '#087f3a', fontWeight: '900' },
  linkButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: '#123c69', fontWeight: '900' },
  historyCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14 },
  historyMeta: { color: '#123c69', fontSize: 13, fontWeight: '900', marginTop: 8 },
});
