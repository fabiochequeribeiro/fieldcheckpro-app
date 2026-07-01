import React, { useCallback, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE = '@fieldcheck_equipamentos_vendidos';

const EMPTY_EQUIPMENT = {
  cliente: '',
  nome: '',
  fabricante: '',
  modelo: '',
  serie: '',
  dataVenda: '',
  dataEntrega: '',
  localInstalacao: '',
  observacoes: '',
};

const SEED = [
  {
    id: 'eq-demo-1',
    cliente: 'Cliente industrial exemplo',
    nome: 'Serra industrial',
    fabricante: 'Representada EngIndustrie',
    modelo: 'Modelo a confirmar',
    serie: 'SERIE-001',
    dataVenda: '01/07/2026',
    dataEntrega: 'A agendar',
    localInstalacao: 'Londrina - PR',
    observacoes: 'Equipamento exemplo para demonstrar historico completo por maquina vendida.',
    events: [
      { id: 'ev-1', type: 'Venda', date: '01/07/2026', description: 'Oportunidade comercial registrada.' },
      { id: 'ev-2', type: 'Entrega', date: 'A agendar', description: 'Checklist, fotos, assinatura e PDF.' },
      { id: 'ev-3', type: 'Preventiva', date: '30/09/2026', description: 'Primeira preventiva recomendada.' },
    ],
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

function Field({ label, value, onChangeText, placeholder, multiline }) {
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
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function EquipmentHistoryScreen() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(EMPTY_EQUIPMENT);
  const [eventText, setEventText] = useState('');
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(useCallback(() => {
    readList().then((list) => {
      setItems(list);
      setSelectedId((current) => current || list[0]?.id || '');
    });
  }, []));

  const selected = items.find((item) => item.id === selectedId) || items[0];
  const metrics = useMemo(() => ({
    total: items.length,
    events: items.reduce((sum, item) => sum + (item.events?.length || 0), 0),
  }), [items]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveEquipment() {
    if (!form.cliente.trim() || !form.nome.trim()) {
      Alert.alert('Atenção', 'Informe cliente e equipamento.');
      return;
    }
    const record = {
      id: `eq-${Date.now()}`,
      ...form,
      events: [
        { id: `ev-${Date.now()}`, type: 'Cadastro', date: new Date().toLocaleDateString('pt-BR'), description: 'Equipamento cadastrado no controle FieldCheck.' },
      ],
    };
    const next = [record, ...items];
    setItems(next);
    setSelectedId(record.id);
    await saveList(next);
    setForm(EMPTY_EQUIPMENT);
    setShowForm(false);
  }

  async function addEvent(type) {
    if (!selected) return;
    const description = eventText.trim() || `${type} registrada no historico da maquina.`;
    const event = { id: `ev-${Date.now()}`, type, date: new Date().toLocaleDateString('pt-BR'), description };
    const next = items.map((item) => item.id === selected.id ? { ...item, events: [event, ...(item.events || [])] } : item);
    setItems(next);
    await saveList(next);
    setEventText('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View>
            <Text style={styles.eyebrow}>Controle por maquina</Text>
            <Text style={styles.title}>Equipamentos vendidos</Text>
            <Text style={styles.subtitle}>Venda, entrega, treinamento, preventivas, corretivas, peças, fotos e PDFs em um historico unico.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((value) => !value)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.metrics}>
          <Metric label="Máquinas" value={metrics.total} />
          <Metric label="Eventos" value={metrics.events} />
        </View>

        {showForm ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cadastrar máquina vendida</Text>
            <Field label="Cliente" value={form.cliente} onChangeText={(v) => update('cliente', v)} />
            <Field label="Equipamento" value={form.nome} onChangeText={(v) => update('nome', v)} />
            <Field label="Fabricante" value={form.fabricante} onChangeText={(v) => update('fabricante', v)} />
            <Field label="Modelo" value={form.modelo} onChangeText={(v) => update('modelo', v)} />
            <Field label="Número de série" value={form.serie} onChangeText={(v) => update('serie', v)} />
            <Field label="Data da venda" value={form.dataVenda} onChangeText={(v) => update('dataVenda', v)} placeholder="dd/mm/aaaa" />
            <Field label="Data da entrega" value={form.dataEntrega} onChangeText={(v) => update('dataEntrega', v)} placeholder="dd/mm/aaaa" />
            <Field label="Local de instalação" value={form.localInstalacao} onChangeText={(v) => update('localInstalacao', v)} />
            <Field label="Observações" value={form.observacoes} onChangeText={(v) => update('observacoes', v)} multiline />
            <TouchableOpacity style={styles.primaryButton} onPress={saveEquipment}><Text style={styles.primaryText}>Salvar equipamento</Text></TouchableOpacity>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {items.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.chip, selected?.id === item.id && styles.chipActive]} onPress={() => setSelectedId(item.id)}>
              <Text style={[styles.chipText, selected?.id === item.id && styles.chipTextActive]}>{item.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selected ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{selected.nome}</Text>
                <Text style={styles.cardSubtitle}>{selected.cliente}</Text>
              </View>
              <Text style={styles.badge}>{selected.serie || 'Sem série'}</Text>
            </View>
            <Info label="Fabricante / modelo" value={`${selected.fabricante || '-'} • ${selected.modelo || '-'}`} />
            <Info label="Venda" value={selected.dataVenda || '-'} />
            <Info label="Entrega" value={selected.dataEntrega || '-'} />
            <Info label="Local" value={selected.localInstalacao || '-'} />
            {selected.observacoes ? <Text style={styles.note}>{selected.observacoes}</Text> : null}

            <Text style={styles.sectionTitle}>Adicionar evento</Text>
            <Field label="Descrição" value={eventText} onChangeText={setEventText} placeholder="Ex.: troca de peça, treinamento, visita corretiva..." />
            <View style={styles.actions}>
              {['Entrega', 'Treinamento', 'Preventiva', 'Corretiva', 'Peça', 'PDF'].map((type) => (
                <TouchableOpacity key={type} style={styles.actionButton} onPress={() => addEvent(type)}>
                  <Text style={styles.actionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Histórico</Text>
            {(selected.events || []).map((event) => (
              <View key={event.id} style={styles.timeline}>
                <Text style={styles.timelineType}>{event.type}</Text>
                <Text style={styles.timelineDate}>{event.date}</Text>
                <Text style={styles.timelineText}>{event.description}</Text>
              </View>
            ))}
          </View>
        ) : null}
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
  title: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 6 },
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
  badge: { overflow: 'hidden', backgroundColor: '#eaf3ff', color: '#123c69', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
  field: { marginTop: 10 },
  label: { color: '#334155', fontSize: 12, fontWeight: '900', marginBottom: 5 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, color: '#0f172a', fontWeight: '700' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#087f3a', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 14 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  info: { color: '#475569', fontSize: 13, marginTop: 8, lineHeight: 18 },
  infoLabel: { color: '#123c69', fontWeight: '900' },
  note: { marginTop: 10, color: '#64748b', fontSize: 12, lineHeight: 18, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 },
  chips: { marginBottom: 12 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8 },
  chipActive: { backgroundColor: '#123c69', borderColor: '#123c69' },
  chipText: { color: '#123c69', fontWeight: '900' },
  chipTextActive: { color: '#fff' },
  sectionTitle: { color: '#123c69', fontSize: 17, fontWeight: '900', marginTop: 16, marginBottom: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionButton: { backgroundColor: '#e7f7ee', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { color: '#087f3a', fontWeight: '900', fontSize: 12 },
  timeline: { borderLeftWidth: 3, borderLeftColor: '#087f3a', paddingLeft: 10, marginTop: 12 },
  timelineType: { color: '#123c69', fontWeight: '900' },
  timelineDate: { color: '#64748b', fontSize: 12, fontWeight: '800', marginTop: 2 },
  timelineText: { color: '#475569', fontSize: 13, lineHeight: 18, marginTop: 4 },
});
