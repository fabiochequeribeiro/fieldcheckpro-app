import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard, AppHeader, SectionTitle, SyncStatusBadge } from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';
import { abrirSuporteWhatsApp } from '../utils/suporteWhatsApp';

const LOGO = require('../assets/fieldcheckpro-icon.png');
const APP_VERSION = '1.0.7';

export default function ProfileScreen({ navigation, usuarioLogado, onLogout }) {
  const tecnico = usuarioLogado?.tecnico || {};
  const nome = tecnico.nome || usuarioLogado?.nome || usuarioLogado?.email || 'Usuario FieldCheck';
  const email = tecnico.email || usuarioLogado?.email || '-';
  const empresa = tecnico.empresa || usuarioLogado?.empresa || 'Conta individual';
  const perfil = tecnico.perfil || tecnico.papel || usuarioLogado?.perfil || usuarioLogado?.papel || 'tecnico';

  function confirmarSaida() {
    Alert.alert('Sair do FieldCheck Pro', 'Deseja encerrar sua sessao neste aparelho?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: onLogout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader
          logo={LOGO}
          title="Perfil"
          subtitle="Conta, empresa, sincronizacao e suporte."
        />

        <View style={styles.body}>
          <AppCard style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{String(nome).slice(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{nome}</Text>
            <Text style={styles.email}>{email}</Text>
            <View style={styles.badges}>
              <SyncStatusBadge status="sincronizado" />
              <Text style={styles.roleBadge}>{perfil}</Text>
            </View>
          </AppCard>

          <SectionTitle title="Empresa" subtitle="Dados do tenant atual" />
          <AppCard>
            <InfoRow icon="business" label="Empresa" value={empresa} />
            <InfoRow icon="shield-checkmark" label="Perfil" value={perfil} />
            <InfoRow icon="cloud-done" label="Sincronizacao" value="Pronta para offline-first" />
            <InfoRow icon="phone-portrait" label="Versao do app" value={APP_VERSION} />
          </AppCard>

          <SectionTitle title="Seguranca e suporte" subtitle="Acoes rapidas" />
          <View style={styles.actions}>
            <AppButton
              title="Central FieldCheck"
              icon="grid"
              onPress={() => navigation.navigate('Central FieldCheck', { usuarioLogado })}
            />
            <AppButton
              title="Programa Beta"
              icon="flask"
              variant="secondary"
              onPress={() => navigation.navigate('Programa Beta', { usuarioLogado })}
            />
            <AppButton
              title="Enviar Feedback"
              icon="chatbox-ellipses"
              variant="secondary"
              onPress={() => navigation.navigate('Feedback', { usuarioLogado })}
            />
            <AppButton
              title="Status do App"
              icon="pulse"
              variant="secondary"
              onPress={() => navigation.navigate('Status do App', { usuarioLogado })}
            />
            <AppButton
              title="Falar com suporte"
              icon="logo-whatsapp"
              onPress={() => abrirSuporteWhatsApp('Ola, preciso de suporte no FieldCheck Pro.')}
            />
            <AppButton
              title="Politica de privacidade"
              icon="document-text"
              variant="secondary"
              onPress={() => Alert.alert('Politica de privacidade', 'Link preparado para politica oficial do FieldCheck Pro.')}
            />
            <AppButton title="Sair" icon="log-out-outline" variant="secondary" onPress={confirmarSaida} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={theme.colors.navy} /></View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { backgroundColor: theme.colors.background, paddingBottom: 28 },
  body: { padding: 14, gap: 12 },
  profileCard: { alignItems: 'center', gap: 8 },
  avatar: { width: 76, height: 76, borderRadius: 24, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  name: { color: theme.colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  email: { color: theme.colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  roleBadge: { color: theme.colors.navy, backgroundColor: '#edf4fb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#edf0f3' },
  infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1 },
  infoLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '800' },
  infoValue: { color: theme.colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  actions: { gap: 10 },
});
