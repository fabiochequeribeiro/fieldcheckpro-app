import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AiCard,
  AppCard,
  AppHeader,
  ModuleCard,
  SectionTitle,
  StatusBadge,
} from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';
import {
  FIELD_CHECK_AI_CAPABILITIES,
  askFieldCheckAi,
  answerTechnicalCopilot,
  buildAiReadiness,
  suggestPendingActions,
} from '../services/fieldCheckAiService';
import { getAIBackendReadiness } from '../services/AIService';
import { inspectEquipmentPhoto } from '../services/PhotoInspectionService';
import { recommendMaintenanceActions } from '../services/RecommendationService';
import { generateBudgetDraft } from '../services/BudgetAssistant';
import { getMockNotificationCenter } from '../services/NotificationCenterService';

const LOGO = require('../assets/fieldcheckpro-icon.png');

export default function AiAssistantScreen({ navigation, usuarioLogado }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const readiness = useMemo(() => buildAiReadiness(), []);
  const backendReadiness = useMemo(() => getAIBackendReadiness(), []);
  const pendingMock = useMemo(() => suggestPendingActions({}), []);
  const notifications = useMemo(() => getMockNotificationCenter(), []);
  const [photoMock, setPhotoMock] = useState(null);
  const [budgetMock, setBudgetMock] = useState(null);
  const [maintenanceMock, setMaintenanceMock] = useState(null);

  async function runCopilot() {
    if (!question.trim() || asking) return;
    setAsking(true);
    try {
      setAnswer(await askFieldCheckAi(question, {
        empresa: usuarioLogado?.tecnico?.empresa || usuarioLogado?.empresa || '',
        perfil: usuarioLogado?.tecnico?.perfil || usuarioLogado?.perfil || 'tecnico',
      }));
    } catch (error) {
      setAnswer(`${answerTechnicalCopilot(question)}\n\nModo offline: ${error?.message || 'backend indisponivel'}`);
    } finally { setAsking(false); }
  }

  async function runPhotoMock() {
    setPhotoMock(await inspectEquipmentPhoto({ equipamento: { nome: 'Equipamento exemplo' }, modulo: 'inspecao' }));
  }

  async function runBudgetMock() {
    setBudgetMock(await generateBudgetDraft({ cliente: 'Cliente exemplo', equipamento: { nome: 'Equipamento exemplo' }, pendencias: ['Verificar desgaste visual'] }));
  }

  async function runMaintenanceMock() {
    setMaintenanceMock(await recommendMaintenanceActions({ equipamento: { nome: 'Equipamento exemplo' }, historico: [{ modulo: 'corretiva' }, { modulo: 'corretiva' }, { modulo: 'corretiva' }] }));
  }

  function openChecklistFlow() {
    Alert.alert(
      'Sugestao de checklist',
      'Abra um equipamento em Servicos ou Modelos. O app perguntara se existe foto e exibira sugestoes revisaveis antes de aplicar.',
      [
        { text: 'Depois', style: 'cancel' },
        { text: 'Ir para Servicos', onPress: () => navigation.navigate('Serviços', { telaInicial: 'pedido', usuarioLogado }) },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader
          logo={LOGO}
          eyebrow="FieldCheck Hub"
          title="IA Assistente"
          subtitle="Copiloto seguro para checklists, pendencias e relatorios."
        />

        <View style={styles.body}>
          <AiCard
            title="Assistente FieldCheck"
            description="IA real via backend seguro, sem chave no app. O modo manual continua funcionando sempre."
            onPress={openChecklistFlow}
          />

          <View style={styles.badges}>
            <StatusBadge status="concluido" label="Manual preservado" />
            <StatusBadge status="local" label={readiness.mode} />
            <StatusBadge status="sincronizando" label={backendReadiness.recommendedBackend} />
          </View>

          <SectionTitle title="Recursos de IA" subtitle="Todos opcionais e com revisao humana antes de aplicar." />
          <View style={styles.cards}>
            {FIELD_CHECK_AI_CAPABILITIES.map((item) => (
              <ModuleCard
                key={item.id}
                title={item.title}
                description={item.description}
                icon={item.icon}
                tone={item.id === 'checklist' ? 'green' : item.id === 'summary' ? 'purple' : 'blue'}
                onPress={item.id === 'checklist' ? openChecklistFlow : undefined}
              />
            ))}
          </View>

          <SectionTitle title="Copiloto tecnico" subtitle="Conectado ao backend seguro, com orientacao local quando estiver offline." />
          <AppCard>
            <Text style={styles.label}>Perguntar a IA</Text>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ex.: Como tratar uma nao conformidade em EPI?"
              placeholderTextColor="#8a97a8"
              multiline
              style={styles.input}
            />
            <TouchableOpacity style={styles.askButton} onPress={runCopilot} activeOpacity={0.86} disabled={asking}>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.askText}>{asking ? 'Analisando...' : 'Perguntar ao FieldCheck AI'}</Text>
            </TouchableOpacity>
            {answer ? <Text style={styles.answer}>{answer}</Text> : null}
          </AppCard>

          <SectionTitle title="Pendencias" subtitle="Mock para gravidade, recomendacao, responsavel e prazo." />
          {pendingMock.map((item) => (
            <AppCard key={item.item} style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>{item.item}</Text>
              <Text style={styles.pendingMeta}>Gravidade: {item.gravidade} · Responsavel: {item.responsavel} · Prazo: {item.prazo}</Text>
              <Text style={styles.pendingText}>{item.recomendacao}</Text>
            </AppCard>
          ))}

          <SectionTitle title="IA operacional" subtitle="Fotos, manutencao, orcamentos e notificacoes preparados para backend." />
          <View style={styles.cards}>
            <ModuleCard title="Analisar foto" description="Mock para vazamento, corrosao, desgaste, protecao ausente e pecas faltando." icon="camera" tone="purple" onPress={runPhotoMock} />
            <ModuleCard title="Sugerir manutencao" description="Detecta muitas corretivas e recomenda plano preventivo." icon="build" tone="amber" onPress={runMaintenanceMock} />
            <ModuleCard title="Rascunho de orcamento" description="Gera pecas, mao de obra, descricao tecnica, prazo e observacoes." icon="cash" tone="green" onPress={runBudgetMock} />
          </View>

          {photoMock ? <AppCard><Text style={styles.backendTitle}>Analise de foto</Text><Text style={styles.backendText}>{photoMock.recommendation}</Text></AppCard> : null}
          {maintenanceMock ? <AppCard><Text style={styles.backendTitle}>Manutencao</Text><Text style={styles.backendText}>{maintenanceMock[0]?.titulo} - {maintenanceMock[0]?.motivo}</Text></AppCard> : null}
          {budgetMock ? <AppCard><Text style={styles.backendTitle}>Orcamento</Text><Text style={styles.backendText}>{budgetMock.descricaoTecnica}</Text></AppCard> : null}

          <SectionTitle title="Notification Center" subtitle="Push, email, WhatsApp e alertas em estrutura modular." />
          {notifications.map((item) => (
            <AppCard key={item.id}>
              <Text style={styles.pendingTitle}>{item.title}</Text>
              <Text style={styles.pendingText}>{item.message}</Text>
            </AppCard>
          ))}

          <AppCard style={styles.backendCard}>
            <Text style={styles.backendTitle}>Preparado para producao</Text>
            <Text style={styles.backendText}>
              A IA real deve entrar por Supabase Edge Function ou API propria. Nenhuma chave OpenAI deve ficar dentro do aplicativo.
            </Text>
          </AppCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { backgroundColor: theme.colors.background, paddingBottom: 28 },
  body: { padding: 14, gap: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cards: { gap: 10 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '900', marginBottom: 8 },
  input: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    fontWeight: '700',
  },
  askButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  askText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  answer: { marginTop: 10, color: theme.colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  pendingCard: { gap: 6 },
  pendingTitle: { color: theme.colors.navy, fontSize: 15, fontWeight: '900' },
  pendingMeta: { color: theme.colors.purple, fontSize: 12, fontWeight: '900' },
  pendingText: { color: theme.colors.muted, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  backendCard: { backgroundColor: '#f8fbff', borderColor: '#bfdbfe' },
  backendTitle: { color: theme.colors.navy, fontSize: 15, fontWeight: '900' },
  backendText: { color: theme.colors.muted, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 5 },
});
