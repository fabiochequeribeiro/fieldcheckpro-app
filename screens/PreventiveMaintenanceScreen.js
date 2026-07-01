import React, { useCallback, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE = '@fieldcheck_preventivas_industriais';

const EMPTY = {
  cliente: '',
  equipamento: '',
  fabricante: '',
  modelo: '',
  serie: '',
  horimetro: '',
  periodicidadeDias: '90',
  ultimaManutencao: '',
  proximaManutencao: '',
  plano: 'Inspecao geral, lubrificacao, seguranca, limpeza, ajustes e recomendacoes.',
  responsavel: '',
};

const SEED = [
  {
    id: 'prev-demo-1',
    cliente: 'Cliente industrial exemplo',
    equipamento: 'Serra industrial',
    fabricante: 'Representada EngIndustrie',
    modelo: 'Modelo a confirmar',
    serie: 'SERIE-001',
    horimetro: '1200',
    periodicidadeDias: '90',
    ultimaManutencao: '01/07/2026',
    proximaManutencao: '30/09/2026',
    plano: 'Verificar alinhamento, lubrificacao, protecoes, vazamentos, ruido, aquecimento e desgaste de componentes.',
    responsavel: 'Tecnico FieldCheck',
    status: 'Programada',
  },
];

async function readList() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE);
    if (!raw) return SEED;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : SEED;
  } catch {
    return SEED;
  }
}

async function saveList(list) {
  await AsyncStorage.setItem(STORAGE, JSON.stringify(list));
}

function parseDateBR(value) {
  const [day, month, year] = String(value || '').split('/').map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  return Number.isFinite(date.getTime()) ? date : null;
}

function daysUntil(value) {
  const date = parseDateBR(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function statusFor(plan) {
  const days = daysUntil(plan.proximaManutencao);
  if (days === null) return { label: plan.status || 'Sem prazo', tone: 'neutral' };
  if (days < 0) return { label: 'Vencida', tone: 'danger' };
  if (days <= 7) return { label: '7 dias', tone: 'warning' };
  return { label: 'Programada', tone: 'ok' };
}

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a97a8"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function PreventiveMaintenanceScreen() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(useCallback(() => { readList().then(setPlans); }, []));

  const metrics = useMemo(() => ({
    total: plans.length,
    overdue: plans.filter((item) => statusFor(item).tone === 'danger').length,
    week: plans.filter((item) => statusFor(item).tone === 'warning').length,
  }), [plans]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    if (!form.cliente.trim() || !form.equipamento.trim()) {
      Alert.alert('Atenção', 'Informe cliente e equipamento.');
      return;
    }
    const record = { id: `prev-${Date.now()}`, ...form, status: 'Programada', createdAt: new Date().toISOString() };
    const next = [record, ...plans];
    setPlans(next);
    await saveList(next);
    setForm(EMPTY);
    setShowForm(false);
  }

  async function complete(plan) {
    const today = new Date().toLocaleDateString('pt-BR');
    const next = plans.map((item) => item.id === plan.id ? { ...item, ultimaManutencao: today, status: 'Executada' } : item);
    setPlans(next);
    await saveList(next);
    Alert.alert('Preventiva', 'Manutenção marcada como executada. Ajuste a próxima data se necessário.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View>
            <Text style={styles.eyebrow}>Manutenção industrial</Text>
            <Text style={styles.title}>Preventivas</Text>
            <Text style={styles.subtitle}>Planos por máquina, série, horímetro e próxima manutenção.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((value) => !value)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.metrics}>
          <Metric label="Planos" value={metrics.total} />
          <Metric label="Vencidas" value={metrics.overdue} />
          <Metric label="7 dias" value={metrics.week} />
        </View>

        {showForm ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Novo plano preventivo</Text>
            <Field label="Cliente" value={form.cliente} onChangeText={(v) => update('cliente', v)} />
            <Field label="Equipamento" value={form.equipamento} onChangeText={(v) => update('equipamento', v)} />
            <Field label="Fabricante" value={form.fabricante} onChangeText={(v) => update('fabricante', v)} />
            <Field label="Modelo" value={form.modelo} onChangeText={(v) => update('modelo', v)} />
            <Field label="Número de série" value={form.serie} onChangeText={(v) => update('serie', v)} />
            <Field label="Horímetro" value={form.horimetro} onChangeText={(v) => update('horimetro', v)} keyboardType="numeric" />
            <Field label="Periodicidade dias" value={form.periodicidadeDias} onChangeText={(v) => update('periodicidadeDias', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
            <Field label="Última manutenção" value={form.ultimaManutencao} onChangeText={(v) => update('ultimaManutencao', v)} placeholder="dd/mm/aaaa" />
            <Field label="Próxima manutenção" value={form.proximaManutencao} onChangeText={(v) => update('proximaManutencao', v)} placeholder="dd/mm/aaaa" />
            <Field label="Responsável" value={form.responsavel} onChangeText={(v) => update('responsavel', v)} />
            <Field label="Plano de manutenção" value={form.plano} onChangeText={(v) => update('plano', v)} multiline />
            <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Salvar plano</Text></TouchableOpacity>
          </View>
        ) : null}

        {plans.map((plan) => {
          const status = statusFor(plan);
          return (
            <View key={plan.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{plan.equipamento}</Text>
                  <Text style={styles.cardSubtitle}>{plan.cliente}</Text>
                </View>
                <Text style={[styles.badge, styles[status.tone]]}>{status.label}</Text>
              </View>
              <Info label="Modelo / série" value={`${plan.modelo || '-'} • ${plan.serie || '-'}`} />
              <Info label="Horímetro" value={plan.horimetro || '-'} />
              <Info label="Última" value={plan.ultimaManutencao || '-'} />
              <Info label="Próxima" value={plan.proximaManutencao || '-'} />
              <Text style={styles.plan}>{plan.plano}</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => complete(plan)}><Text style={styles.secondaryText}>Marcar como executada</Text></TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Info({ label, value }) {
  return <Text style={styles.info}><Text style={styles.infoLabel}>{label}: </Text>{value}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#eef4f8' },
  container: { padding: 14, paddingBottom: 30 },
  hero: { backgroundColor: '#123c69', borderRadius: 18, padding: 18, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: '#8ee6b0', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#dbeafe', fontSize: 13, marginTop: 6, lineHeight: 18, maxWidth: 280 },
  addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#087f3a', alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metric: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#dbe4ea' },
  metricValue: { color: '#123c69', fontSize: 24, fontWeight: '900' },
  metricLabel: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#dbe4ea', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitle: { color: '#123c69', fontSize: 18, fontWeight: '900' },
  cardSubtitle: { color: '#475569', fontSize: 13, marginTop: 3, fontWeight: '700' },
  badge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
  ok: { backgroundColor: '#e7f7ee', color: '#087f3a' },
  warning: { backgroundColor: '#fff7e6', color: '#92400e' },
  danger: { backgroundColor: '#fee2e2', color: '#991b1b' },
  neutral: { backgroundColor: '#eef2f7', color: '#334155' },
  field: { marginTop: 10 },
  label: { color: '#334155', fontSize: 12, fontWeight: '900', marginBottom: 5 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, color: '#0f172a', fontWeight: '700' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#087f3a', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 14 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  secondaryButton: { borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 12 },
  secondaryText: { color: '#123c69', fontWeight: '900' },
  info: { color: '#475569', fontSize: 13, marginTop: 8, lineHeight: 18 },
  infoLabel: { color: '#123c69', fontWeight: '900' },
  plan: { marginTop: 10, color: '#64748b', fontSize: 12, lineHeight: 18, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 },
});
