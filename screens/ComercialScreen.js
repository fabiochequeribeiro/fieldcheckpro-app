import React, { useCallback, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE = '@fieldcheck_comercial_pipeline';

const EMPTY = {
  cliente: '',
  contato: '',
  telefone: '',
  email: '',
  oportunidade: '',
  equipamento: '',
  valor: '',
  etapa: 'Lead',
  proximoPasso: '',
  dataFollowUp: '',
  observacoes: '',
};

const SEED = [
  {
    id: 'engindustrie-demo-1',
    cliente: 'Cliente industrial exemplo',
    contato: 'Responsavel de manutencao',
    telefone: '',
    email: '',
    oportunidade: 'Venda de maquina + entrega tecnica',
    equipamento: 'Serra industrial / acionamento mecanico',
    valor: '',
    etapa: 'Proposta',
    proximoPasso: 'Validar escopo de instalacao, treinamento e preventiva inicial.',
    dataFollowUp: '',
    observacoes: 'Modelo para demonstrar o fluxo comercial da EngIndustrie.',
    createdAt: new Date().toISOString(),
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

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a97a8"
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function ComercialScreen() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(useCallback(() => { readList().then(setItems); }, []));

  const metrics = useMemo(() => ({
    leads: items.length,
    propostas: items.filter((item) => item.etapa === 'Proposta').length,
    followUps: items.filter((item) => item.proximoPasso).length,
  }), [items]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    if (!form.cliente.trim() || !form.oportunidade.trim()) {
      Alert.alert('Atenção', 'Informe cliente e oportunidade.');
      return;
    }
    const record = { id: `com-${Date.now()}`, ...form, createdAt: new Date().toISOString() };
    const next = [record, ...items];
    setItems(next);
    await saveList(next);
    setForm(EMPTY);
    setShowForm(false);
    Alert.alert('Comercial', 'Oportunidade salva no pipeline.');
  }

  async function advance(item) {
    const flow = ['Lead', 'Qualificacao', 'Proposta', 'Negociacao', 'Ganho'];
    const nextStage = flow[Math.min(flow.indexOf(item.etapa) + 1, flow.length - 1)] || 'Qualificacao';
    const next = items.map((row) => row.id === item.id ? { ...row, etapa: nextStage } : row);
    setItems(next);
    await saveList(next);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>FieldCheck Comercial</Text>
            <Text style={styles.title}>Pipeline de vendas</Text>
            <Text style={styles.subtitle}>Leads, propostas, follow-up e maquinas vendidas para virar entrega tecnica.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((value) => !value)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.metrics}>
          <Metric label="Leads" value={metrics.leads} />
          <Metric label="Propostas" value={metrics.propostas} />
          <Metric label="Follow-ups" value={metrics.followUps} />
        </View>

        {showForm ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nova oportunidade</Text>
            <Field label="Cliente" value={form.cliente} onChangeText={(v) => update('cliente', v)} placeholder="Empresa cliente" />
            <Field label="Contato" value={form.contato} onChangeText={(v) => update('contato', v)} placeholder="Responsavel" />
            <Field label="Telefone" value={form.telefone} onChangeText={(v) => update('telefone', v)} placeholder="WhatsApp" keyboardType="phone-pad" />
            <Field label="E-mail" value={form.email} onChangeText={(v) => update('email', v)} placeholder="email@cliente.com" keyboardType="email-address" />
            <Field label="Oportunidade" value={form.oportunidade} onChangeText={(v) => update('oportunidade', v)} placeholder="Venda, instalacao ou contrato" />
            <Field label="Equipamento" value={form.equipamento} onChangeText={(v) => update('equipamento', v)} placeholder="Maquina / modelo" />
            <Field label="Valor estimado" value={form.valor} onChangeText={(v) => update('valor', v)} placeholder="R$" keyboardType="numeric" />
            <Field label="Proximo passo" value={form.proximoPasso} onChangeText={(v) => update('proximoPasso', v)} placeholder="Ex.: enviar proposta" />
            <Field label="Data follow-up" value={form.dataFollowUp} onChangeText={(v) => update('dataFollowUp', v)} placeholder="dd/mm/aaaa" />
            <Field label="Observacoes" value={form.observacoes} onChangeText={(v) => update('observacoes', v)} placeholder="Detalhes da conversa" multiline />
            <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Salvar oportunidade</Text></TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Pipeline ativo</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{item.cliente}</Text>
                <Text style={styles.cardSubtitle}>{item.oportunidade}</Text>
              </View>
              <Text style={styles.badge}>{item.etapa}</Text>
            </View>
            <Info label="Equipamento" value={item.equipamento || '-'} />
            <Info label="Contato" value={`${item.contato || '-'} ${item.telefone ? `• ${item.telefone}` : ''}`} />
            <Info label="Próximo passo" value={item.proximoPasso || 'Definir follow-up'} />
            {item.observacoes ? <Text style={styles.note}>{item.observacoes}</Text> : null}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => advance(item)}><Text style={styles.secondaryText}>Avançar etapa</Text></TouchableOpacity>
          </View>
        ))}
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
  header: { backgroundColor: '#123c69', borderRadius: 18, padding: 18, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: '#8ee6b0', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#dbeafe', fontSize: 13, marginTop: 6, lineHeight: 18, maxWidth: 270 },
  addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#087f3a', alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metric: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#dbe4ea' },
  metricValue: { color: '#123c69', fontSize: 24, fontWeight: '900' },
  metricLabel: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#dbe4ea', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitle: { color: '#123c69', fontSize: 18, fontWeight: '900' },
  cardSubtitle: { color: '#475569', fontSize: 13, marginTop: 3, fontWeight: '700' },
  sectionTitle: { color: '#123c69', fontSize: 20, fontWeight: '900', marginBottom: 10, marginTop: 4 },
  badge: { overflow: 'hidden', backgroundColor: '#e7f7ee', color: '#087f3a', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
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
  note: { marginTop: 10, color: '#64748b', fontSize: 12, lineHeight: 18, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 },
});
