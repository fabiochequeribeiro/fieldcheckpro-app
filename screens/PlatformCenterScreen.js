import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard, AppHeader, SectionTitle, SyncStatusBadge } from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';
import { carregarManifestoPlataforma, compararVersaoInstalada, PLATFORM_FALLBACK } from '../services/platformManifestService';

const LOGO = require('../assets/fieldcheckpro-icon.png');
const CURRENT_VERSION = '1.0.7';
const CURRENT_VERSION_CODE = 8;

async function openUrl(url, unavailableMessage) {
  if (!url) {
    Alert.alert('Em preparacao', unavailableMessage || 'Este acesso sera ativado na publicacao do Portal.');
    return;
  }
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Nao foi possivel abrir', 'Confira sua conexao ou fale com o suporte FieldCheck Pro.');
    return;
  }
  await Linking.openURL(url);
}

function ActionCard({ icon, title, description, onPress, accent = '#123c69' }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.actionIcon, { backgroundColor: `${accent}16` }]}><Ionicons name={icon} size={23} color={accent} /></View>
      <View style={styles.actionText}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionDescription}>{description}</Text></View>
      <Ionicons name="chevron-forward" size={21} color="#64748b" />
    </TouchableOpacity>
  );
}

export default function PlatformCenterScreen({ usuarioLogado, acessoComercial, configuracaoModular }) {
  const [manifest, setManifest] = useState(PLATFORM_FALLBACK);
  const [refreshing, setRefreshing] = useState(false);
  const company = usuarioLogado?.tecnico?.empresa || usuarioLogado?.empresa || 'Conta individual';
  const profile = usuarioLogado?.tecnico?.perfil || usuarioLogado?.perfil || usuarioLogado?.tecnico?.papel || 'tecnico';
  const versionStatus = compararVersaoInstalada(manifest, CURRENT_VERSION_CODE);
  const modules = configuracaoModular?.modulos_ativos || [];

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setManifest(await carregarManifestoPlataforma());
    setRefreshing(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <AppHeader logo={LOGO} title="Central FieldCheck" subtitle="Empresa, licenca, Portal, atualizacao e suporte." />
        <View style={styles.body}>
          <AppCard style={styles.identityCard}>
            <View style={styles.identityTop}><View><Text style={styles.eyebrow}>EMPRESA CONECTADA</Text><Text style={styles.company}>{company}</Text></View><SyncStatusBadge status={manifest.source === 'remote' ? 'sincronizado' : 'local'} /></View>
            <View style={styles.metaRow}><Text style={styles.meta}>{profile}</Text><Text style={styles.meta}>{modules.length || 'Modulos padrao'} modulo(s)</Text><Text style={styles.meta}>{acessoComercial?.status || 'verificando'}</Text></View>
          </AppCard>

          <SectionTitle title="Aplicativo" subtitle="Versao e distribuicao oficial" />
          <AppCard>
            <View style={styles.versionRow}><View style={styles.versionIcon}><Ionicons name="phone-portrait" size={28} color="#fff" /></View><View style={styles.versionText}><Text style={styles.versionTitle}>Instalada: {CURRENT_VERSION}</Text><Text style={styles.versionSubtitle}>Disponivel: {manifest.version} • canal {manifest.channel}</Text></View></View>
            <View style={[styles.updateBanner, versionStatus.updateAvailable ? styles.updateAvailable : styles.updateCurrent]}><Ionicons name={versionStatus.updateAvailable ? 'cloud-download' : 'checkmark-circle'} size={19} color={versionStatus.updateAvailable ? '#b45309' : '#087f3a'} /><Text>{versionStatus.updateAvailable ? `Atualizacao ${versionStatus.mandatory ? 'obrigatoria' : 'disponivel'}` : 'Aplicativo atualizado'}</Text></View>
          </AppCard>

          <SectionTitle title="Acessos" subtitle="Um ecossistema para campo e gestao" />
          <View style={styles.actions}>
            <ActionCard icon="desktop" title="Abrir Portal FieldCheck" description={manifest.portal_url ? 'Gestao, equipe, ordens e relatorios.' : 'Endereco definitivo sera ativado apos a homologacao.'} onPress={() => openUrl(manifest.portal_url)} />
            <ActionCard icon="cube" title="Expedicao inteligente" description="Pedidos, OFs, lotes, paletes e carregamento." accent="#0f766e" onPress={() => openUrl(manifest.expedition_url)} />
            <ActionCard icon="download" title="Pagina de instalacao" description={`APK oficial do canal ${manifest.channel}.`} accent="#087f3a" onPress={() => openUrl(manifest.download_page_url)} />
            <ActionCard icon="school" title="Como funciona" description="Veja o fluxo completo entre Site, Portal e Aplicativo." accent="#7c3aed" onPress={() => openUrl(manifest.platform_page_url)} />
            <ActionCard icon="logo-whatsapp" title="Suporte FieldCheck" description="Implantacao, acesso e duvidas operacionais." accent="#087f3a" onPress={() => openUrl(manifest.support_url)} />
            <ActionCard icon="document-text" title="Privacidade e termos" description="Consulte as regras de uso e tratamento de dados." onPress={() => openUrl(manifest.privacy_url)} />
          </View>

          {manifest.release_notes?.length ? <><SectionTitle title="Notas da versao" subtitle={`FieldCheck Pro ${manifest.version}`} /><AppCard>{manifest.release_notes.map((note) => <View key={note} style={styles.note}><Ionicons name="checkmark-circle" size={18} color="#087f3a" /><Text>{note}</Text></View>)}</AppCard></> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 32 },
  body: { padding: 14, gap: 12 },
  identityCard: { backgroundColor: '#0b2847' },
  identityTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: '#a7f3d0', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  company: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 15 },
  meta: { color: '#dbeafe', backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  versionIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: '#123c69', alignItems: 'center', justifyContent: 'center' },
  versionText: { flex: 1 },
  versionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '900' },
  versionSubtitle: { color: theme.colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  updateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 11, marginTop: 13 },
  updateAvailable: { backgroundColor: '#fff7e6' },
  updateCurrent: { backgroundColor: '#e7f7ee' },
  actions: { gap: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ec', borderRadius: 16, padding: 14 },
  actionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '900' },
  actionDescription: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 3 },
  note: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingVertical: 7 },
});
