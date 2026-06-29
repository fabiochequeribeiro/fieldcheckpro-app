import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fieldCheckTheme as theme } from '../../theme/fieldCheckTheme';

export function AppCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppButton({ title, icon, onPress, variant = 'primary', disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' && styles.buttonSecondary, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.86}
    >
      {icon ? <Ionicons name={icon} size={19} color={variant === 'secondary' ? theme.colors.navy : '#fff'} /> : null}
      <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonSecondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function AppHeader({ logo, eyebrow = 'FieldCheck Pro', title, subtitle, right }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {logo ? <Image source={logo} style={styles.logo} /> : null}
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function MetricCard({ label, value, icon, tone = 'blue' }) {
  const palette = tonePalette(tone);
  return (
    <AppCard style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon || 'analytics'} size={20} color={palette.color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </AppCard>
  );
}

export function ModuleCard({ title, description, icon, tone = 'blue', onPress }) {
  const palette = tonePalette(tone);
  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.moduleIcon, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon || 'apps'} size={24} color={palette.color} />
      </View>
      <View style={styles.moduleText}>
        <Text style={styles.moduleTitle}>{title}</Text>
        {description ? <Text style={styles.moduleDescription}>{description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={palette.color} />
    </TouchableOpacity>
  );
}

export function StatusBadge({ status = 'pendente', label }) {
  const key = String(status || 'pendente').toLowerCase().replace(/\s+/g, '_');
  const palette = theme.statusColors[key] || theme.statusColors.pendente;
  return <Text style={[styles.badge, palette]}>{label || status}</Text>;
}

export function SyncStatusBadge({ status = 'local' }) {
  const labels = {
    local: 'Salvo localmente',
    sincronizando: 'Sincronizando',
    sincronizado: 'Sincronizado',
    erro: 'Erro ao sincronizar',
    pendente: 'Pendente de envio',
  };
  return <StatusBadge status={status} label={labels[status] || status} />;
}

export function EmptyState({ title, description, icon = 'file-tray-outline' }) {
  return (
    <View style={styles.state}>
      <Ionicons name={icon} size={28} color={theme.colors.muted} />
      <Text style={styles.stateTitle}>{title}</Text>
      {description ? <Text style={styles.stateDescription}>{description}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = 'Carregando...' }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={theme.colors.navy} />
      <Text style={styles.stateDescription}>{label}</Text>
    </View>
  );
}

export function ErrorState({ title = 'Algo deu errado', description }) {
  return <EmptyState title={title} description={description} icon="alert-circle-outline" />;
}

export function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionBar} />
      <View>
        <Text style={styles.sectionTitleText}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function AiCard({ title = 'Assistente FieldCheck', description, onPress }) {
  return (
    <TouchableOpacity style={styles.aiCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.aiIcon}>
        <Ionicons name="sparkles" size={23} color="#fff" />
      </View>
      <View style={styles.moduleText}>
        <Text style={styles.aiTitle}>{title}</Text>
        <Text style={styles.aiDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

export function ProgressBar({ value = 0, tone = 'green' }) {
  const numeric = Math.max(0, Math.min(100, Number(value || 0)));
  const palette = tonePalette(tone);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${numeric}%`, backgroundColor: palette.color }]} />
    </View>
  );
}

export function ChecklistItemCard({ title, group, status = 'pendente', required, photos = 0, onPress }) {
  return (
    <TouchableOpacity style={styles.checklistCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardTopRow}>
        <View style={styles.moduleText}>
          {group ? <Text style={styles.metaText}>{group}</Text> : null}
          <Text style={styles.cardStrong}>{title}</Text>
        </View>
        <StatusBadge status={status} />
      </View>
      <View style={styles.cardFooterRow}>
        {required ? <Text style={styles.requiredText}>Obrigatorio</Text> : <Text style={styles.metaText}>Opcional</Text>}
        <Text style={styles.metaText}>{photos} foto(s)</Text>
      </View>
    </TouchableOpacity>
  );
}

export function EquipmentCard({ name, tag, model, manufacturer, progress = 0, status = 'pendente', photos = 0, pending = 0, onOpen, onAi }) {
  const tone = progress >= 100 ? 'green' : progress > 0 ? 'amber' : 'red';
  return (
    <AppCard style={styles.equipmentCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.moduleText}>
          <Text style={styles.cardStrong}>{name || 'Equipamento'}</Text>
          <Text style={styles.metaText}>TAG {tag || '-'} · {model || 'Modelo nao informado'}</Text>
          {manufacturer ? <Text style={styles.metaText}>{manufacturer}</Text> : null}
        </View>
        <StatusBadge status={status} />
      </View>
      <ProgressBar value={progress} tone={tone} />
      <View style={styles.cardFooterRow}>
        <Text style={styles.metaText}>{Math.round(progress)}% concluido</Text>
        <Text style={styles.metaText}>{photos} foto(s) · {pending} pendencia(s)</Text>
      </View>
      <View style={styles.actionRow}>
        <AppButton title="Abrir checklist" icon="open-outline" onPress={onOpen} />
        <AppButton title="Sugerir IA" icon="sparkles" variant="secondary" onPress={onAi} />
      </View>
    </AppCard>
  );
}

export function VisitCard({ client, order, city, technician, status = 'pendente', progress = 0, moduleName, date, syncStatus = 'local', onPrimary, primaryLabel = 'Continuar' }) {
  return (
    <AppCard style={styles.visitCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.moduleText}>
          <Text style={styles.cardStrong}>{client || 'Cliente nao informado'}</Text>
          <Text style={styles.metaText}>Pedido/OS {order || '-'} · {city || '-'}</Text>
        </View>
        <StatusBadge status={status} />
      </View>
      <ProgressBar value={progress} tone={progress >= 100 ? 'green' : 'amber'} />
      <View style={styles.cardFooterRow}>
        <Text style={styles.metaText}>{moduleName || 'Servico de campo'} · {technician || 'Tecnico'}</Text>
        <Text style={styles.metaText}>{date || ''}</Text>
      </View>
      <View style={styles.cardFooterRow}>
        <SyncStatusBadge status={syncStatus} />
        <AppButton title={primaryLabel} icon="play" onPress={onPrimary} />
      </View>
    </AppCard>
  );
}

export function TimelineCard({ time, title, description, status = 'concluido', icon = 'time-outline', onPress }) {
  return (
    <TouchableOpacity style={styles.timelineCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.timelineIcon}><Ionicons name={icon} size={18} color={theme.colors.navy} /></View>
      <View style={styles.moduleText}>
        <Text style={styles.metaText}>{time}</Text>
        <Text style={styles.cardStrong}>{title}</Text>
        {description ? <Text style={styles.moduleDescription}>{description}</Text> : null}
      </View>
      <StatusBadge status={status} />
    </TouchableOpacity>
  );
}

export function PhotoPreview({ uri, label = 'Foto', status = 'local', onAdd, onRemove }) {
  return (
    <AppCard style={styles.photoCard}>
      {uri ? <Image source={{ uri }} style={styles.photoImage} /> : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="image-outline" size={30} color={theme.colors.muted} />
          <Text style={styles.metaText}>Nenhuma foto adicionada</Text>
        </View>
      )}
      <View style={styles.cardFooterRow}>
        <View>
          <Text style={styles.cardStrong}>{label}</Text>
          <Text style={styles.metaText}>IA podera analisar esta foto futuramente.</Text>
        </View>
        <SyncStatusBadge status={status} />
      </View>
      <View style={styles.actionRow}>
        <AppButton title="Adicionar foto" icon="camera" onPress={onAdd} />
        {uri ? <AppButton title="Remover" icon="trash" variant="secondary" onPress={onRemove} /> : null}
      </View>
    </AppCard>
  );
}

export function SignatureBox({ title, signed, required, status = 'local', onClear, onSave }) {
  return (
    <AppCard>
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.cardStrong}>{title}</Text>
          <Text style={styles.metaText}>{required && !signed ? 'Assinatura obrigatoria pendente' : signed ? 'Assinatura salva' : 'Aguardando assinatura'}</Text>
        </View>
        <SyncStatusBadge status={status} />
      </View>
      <View style={[styles.signatureArea, signed && styles.signatureAreaSigned]}>
        <Ionicons name={signed ? 'checkmark-circle' : 'create-outline'} size={26} color={signed ? theme.colors.green : theme.colors.muted} />
        <Text style={styles.metaText}>{signed ? 'Pronta para relatorio' : 'Toque em salvar apos assinar'}</Text>
      </View>
      <View style={styles.actionRow}>
        <AppButton title="Salvar" icon="save" onPress={onSave} />
        <AppButton title="Limpar" icon="refresh" variant="secondary" onPress={onClear} />
      </View>
    </AppCard>
  );
}

export function FloatingActionButton({ icon = 'add', onPress, label }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.86}>
      <Ionicons name={icon} size={24} color="#fff" />
      {label ? <Text style={styles.fabLabel}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

function tonePalette(tone) {
  const map = {
    green: { color: theme.colors.green, bg: theme.colors.greenSoft },
    amber: { color: '#b45309', bg: theme.colors.amberSoft },
    red: { color: theme.colors.red, bg: theme.colors.redSoft },
    purple: { color: theme.colors.purple, bg: theme.colors.purpleSoft },
    navy: { color: theme.colors.navy, bg: '#edf4fb' },
    blue: { color: theme.colors.blue, bg: theme.colors.blueSoft },
  };
  return map[tone] || map.blue;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  button: {
    minHeight: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  buttonSecondaryText: { color: theme.colors.navy },
  disabled: { opacity: 0.62 },
  header: { backgroundColor: theme.colors.navy, padding: 18, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 54, height: 54, resizeMode: 'contain', backgroundColor: '#fff', borderRadius: 10 },
  headerText: { flex: 1 },
  eyebrow: { color: '#c7d5e0', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2 },
  headerSubtitle: { color: '#dbeafe', fontSize: 13, fontWeight: '700', marginTop: 4 },
  metricCard: { flex: 1, minHeight: 112, alignItems: 'center', justifyContent: 'center', padding: 12 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  metricValue: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
  metricLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moduleText: { flex: 1 },
  moduleTitle: { color: theme.colors.navy, fontSize: 16, fontWeight: '900' },
  moduleDescription: { color: theme.colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3, lineHeight: 17 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  state: { alignItems: 'center', justifyContent: 'center', padding: 22, gap: 8 },
  stateTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  stateDescription: { color: theme.colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  sectionBar: { width: 5, height: 28, borderRadius: 99, backgroundColor: theme.colors.green },
  sectionTitleText: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { color: theme.colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  aiCard: {
    borderRadius: theme.radius.lg,
    padding: 16,
    backgroundColor: theme.colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  aiIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.purple, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  aiDescription: { color: '#dbeafe', fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 3 },
  progressTrack: { height: 8, borderRadius: 99, backgroundColor: '#e5e9ee', overflow: 'hidden', marginVertical: 10 },
  progressFill: { height: '100%', borderRadius: 99 },
  checklistCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 14, gap: 8 },
  equipmentCard: { gap: 10 },
  visitCard: { gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  cardStrong: { color: theme.colors.text, fontSize: 15, fontWeight: '900' },
  metaText: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
  requiredText: { color: theme.colors.red, fontSize: 12, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  timelineCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 13, flexDirection: 'row', gap: 12, alignItems: 'center' },
  timelineIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  photoCard: { gap: 12 },
  photoImage: { height: 170, borderRadius: 12, backgroundColor: '#e5e9ee' },
  photoPlaceholder: { height: 150, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.surfaceAlt },
  signatureArea: { minHeight: 92, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.surfaceAlt, marginTop: 10 },
  signatureAreaSigned: { borderColor: '#bbf7d0', backgroundColor: theme.colors.greenSoft },
  fab: { position: 'absolute', right: 18, bottom: 22, minWidth: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.green, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18, elevation: 4, shadowColor: '#102f52', shadowOpacity: .2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  fabLabel: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
