import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard } from './AppComponents';
import { fieldCheckTheme as theme } from '../../theme/fieldCheckTheme';
import { shouldShowTrialWarning } from '../../services/trialAccessService';

function getCopy(trial) {
  const status = String(trial?.trial_status || 'active_trial');
  const days = Number(trial?.days_remaining ?? 0);

  if (status === 'active_paid') return { title: 'Plano ativo', text: 'Uso liberado conforme os modulos contratados.', tone: 'paid', icon: 'shield-checkmark' };
  if (status === 'extended_trial') return { title: `Teste prorrogado: faltam ${days} dia(s)`, text: 'Periodo adicional liberado para avaliacao com sua equipe.', tone: 'active', icon: 'time' };
  if (status === 'trial_expiring') return { title: `Seu teste termina em ${days} dia(s).`, text: 'Solicite prorrogacao ou proposta antes do bloqueio operacional.', tone: 'warn', icon: 'alert-circle' };
  if (['trial_expired', 'suspended', 'cancelled'].includes(status)) return { title: 'Teste expirado', text: 'Dados preservados. Solicite prorrogacao ou contratacao para continuar.', tone: 'blocked', icon: 'lock-closed' };
  return { title: `Teste ativo: faltam ${days} dia(s)`, text: 'Use o FieldCheck Pro normalmente durante o periodo beta.', tone: 'active', icon: 'flask' };
}

export default function TrialStatusBanner({ trial, onExtension, onWhatsApp, onProposal }) {
  if (!trial) return null;
  const copy = getCopy(trial);
  const warning = shouldShowTrialWarning(trial);

  return (
    <AppCard style={[styles.card, styles[copy.tone]]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, styles[`${copy.tone}Icon`]]}>
          <Ionicons name={copy.icon} size={20} color="#fff" />
        </View>
        <View style={styles.textBox}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.text}>{copy.text}</Text>
          <Text style={styles.source}>Validacao: {trial.server_time_source === 'supabase_rpc' ? 'servidor' : 'fallback seguro local'}</Text>
        </View>
      </View>

      {warning || trial.blocks_app ? (
        <View style={styles.actions}>
          <AppButton title="Solicitar prorrogacao" icon="time" onPress={onExtension} />
          <AppButton title="WhatsApp" icon="logo-whatsapp" variant="secondary" onPress={onWhatsApp} />
          <AppButton title="Solicitar proposta" icon="document-text" variant="secondary" onPress={onProposal} />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  textBox: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: '900' },
  text: { color: theme.colors.muted, fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 3 },
  source: { color: '#7c8999', fontSize: 11, fontWeight: '800', marginTop: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  active: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  warn: { backgroundColor: '#fffbeb', borderColor: '#fed7aa' },
  blocked: { backgroundColor: '#fff1f0', borderColor: '#fecaca' },
  paid: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  activeIcon: { backgroundColor: '#087f3a' },
  warnIcon: { backgroundColor: '#b45309' },
  blockedIcon: { backgroundColor: '#b42318' },
  paidIcon: { backgroundColor: '#1f7ae0' },
});
