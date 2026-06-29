import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton, AppCard, AppHeader, SectionTitle, SyncStatusBadge } from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';
import { carregarDiagnosticoApp, tentarSincronizarTudo } from '../services/AppDiagnosticsService';

const LOGO = require('../assets/fieldcheckpro-icon.png');

export default function AppStatusScreen({ usuarioLogado }) {
  const [diag, setDiag] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setDiag(await carregarDiagnosticoApp(usuarioLogado));
    } catch (error) {
      Alert.alert('Status do App', error?.message || 'Nao foi possivel carregar diagnostico.');
    } finally {
      setLoading(false);
    }
  }, [usuarioLogado]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function sincronizar() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await tentarSincronizarTudo();
      Alert.alert('Sincronizacao', `Feedbacks enviados: ${result.feedback.sent}. Pendentes: ${result.feedback.pending}.`);
      await carregar();
    } catch (error) {
      Alert.alert('Falha ao sincronizar', error?.message || 'Tente novamente quando houver internet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader logo={LOGO} title="Status do App" subtitle="Diagnostico para o periodo beta." />
        <View style={styles.body}>
          <SyncStatusBadge status={diag?.conexao === 'online' ? 'sincronizado' : 'offline'} />
          <SectionTitle title="Diagnostico" />
          <AppCard>
            <Info label="Conexao" value={diag?.conexao || 'verificando'} />
            <Info label="Usuario" value={diag?.usuario || '-'} />
            <Info label="Empresa" value={diag?.empresa || '-'} />
            <Info label="Versao" value={diag?.versao || '1.0.7'} />
            <Info label="Pendencias de sincronizacao" value={String(diag?.pendencias_sync ?? '-')} />
            <Info label="Feedbacks pendentes" value={String(diag?.feedbacks_pendentes ?? '-')} />
            <Info label="Ultimo sync" value={diag?.ultimo_sync || '-'} />
            <Info label="Armazenamento local" value={diag?.armazenamento_local || '-'} />
          </AppCard>
          <AppButton title={loading ? 'Verificando...' : 'Tentar sincronizar'} icon="sync" onPress={sincronizar} disabled={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }) {
  return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 28 },
  body: { padding: 14, gap: 12 },
  info: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#edf0f3' },
  label: { color: theme.colors.muted, fontSize: 12, fontWeight: '800' },
  value: { color: theme.colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
});
