import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard, AppHeader, SectionTitle, SyncStatusBadge } from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';
import { salvarFeedbackBeta } from '../services/FeedbackService';

const LOGO = require('../assets/fieldcheckpro-icon.png');
const TAGS = ['app', 'portal', 'IA', 'PDF', 'fotos', 'offline', 'historico'];
const MODULES = ['Checklists', 'Fotos', 'Assinatura', 'PDF', 'Historico', 'Offline', 'IA Assistente', 'Portal'];

export default function FeedbackScreen({ usuarioLogado, trialAccess }) {
  const [nota, setNota] = useState(5);
  const [modulo, setModulo] = useState('Checklists');
  const [comentario, setComentario] = useState('');
  const [dificuldade, setDificuldade] = useState('');
  const [sugestao, setSugestao] = useState('');
  const [tags, setTags] = useState(['app']);
  const [saving, setSaving] = useState(false);
  const [lastStatus, setLastStatus] = useState('');

  function toggleTag(tag) {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  async function enviar() {
    if (saving) return;
    if (!comentario.trim() && !dificuldade.trim() && !sugestao.trim()) {
      Alert.alert('Feedback', 'Escreva um comentario, dificuldade ou sugestao para enviar.');
      return;
    }
    setSaving(true);
    try {
      const result = await salvarFeedbackBeta({
        nota,
        modulo,
        comentario,
        dificuldade,
        sugestao,
        tags,
        empresa: usuarioLogado?.tecnico?.empresa || usuarioLogado?.empresa || '',
        empresa_id: usuarioLogado?.tecnico?.empresa_id || usuarioLogado?.empresa_id || null,
        usuario_id: usuarioLogado?.id || usuarioLogado?.tecnico?.user_id || null,
        usuario: usuarioLogado?.email || usuarioLogado?.tecnico?.email || '',
        versao_app: '1.0.7',
        trial_status: trialAccess?.trial_status || '',
      });
      setLastStatus(result.sync_status);
      Alert.alert('Obrigado pelo feedback', result.sync_status === 'sincronizado' ? 'Enviado com sucesso.' : 'Salvo localmente e sera sincronizado depois.');
      setComentario('');
      setDificuldade('');
      setSugestao('');
    } catch (error) {
      Alert.alert('Nao foi possivel enviar', error?.message || 'Seu feedback nao foi perdido. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader logo={LOGO} title="Enviar Feedback" subtitle="Ajude a melhorar o FieldCheck Pro 2.0." />
        <View style={styles.body}>
          {lastStatus ? <SyncStatusBadge status={lastStatus === 'sincronizado' ? 'sincronizado' : 'local'} /> : null}

          <SectionTitle title="Nota" subtitle="Como foi sua experiencia?" />
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity key={value} onPress={() => setNota(value)} activeOpacity={0.8}>
                <Ionicons name={value <= nota ? 'star' : 'star-outline'} size={34} color="#f59e0b" />
              </TouchableOpacity>
            ))}
          </View>

          <SectionTitle title="Modulo usado" />
          <View style={styles.chips}>{MODULES.map((item) => <Chip key={item} label={item} active={modulo === item} onPress={() => setModulo(item)} />)}</View>

          <AppCard>
            <Field label="Comentario" value={comentario} onChangeText={setComentario} placeholder="O que funcionou bem?" />
            <Field label="Dificuldade encontrada" value={dificuldade} onChangeText={setDificuldade} placeholder="Onde travou, ficou confuso ou lento?" />
            <Field label="Sugestao de melhoria" value={sugestao} onChangeText={setSugestao} placeholder="O que deixaria o app melhor no campo?" />
          </AppCard>

          <SectionTitle title="Marcar areas" />
          <View style={styles.chips}>{TAGS.map((item) => <Chip key={item} label={item} active={tags.includes(item)} onPress={() => toggleTag(item)} />)}</View>

          <AppButton title={saving ? 'Enviando...' : 'Enviar feedback'} icon="send" onPress={enviar} disabled={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8a97a8" multiline style={styles.input} />
    </View>
  );
}

function Chip({ label, active, onPress }) {
  return <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 28 },
  body: { padding: 14, gap: 12 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  chipText: { color: theme.colors.navy, fontSize: 12, fontWeight: '900' },
  chipTextActive: { color: '#fff' },
  field: { marginBottom: 12 },
  label: { color: theme.colors.text, fontSize: 13, fontWeight: '900', marginBottom: 6 },
  input: { minHeight: 84, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, backgroundColor: theme.colors.surfaceAlt, color: theme.colors.text, textAlignVertical: 'top', fontWeight: '700' },
});
