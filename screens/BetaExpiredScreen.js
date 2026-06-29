import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppHeader, StatusBadge } from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';
import { abrirSuporteWhatsApp } from '../utils/suporteWhatsApp';
import { solicitarProrrogacaoBeta } from '../services/BetaProgramService';

const LOGO = require('../assets/fieldcheckpro-icon.png');

export default function BetaExpiredScreen({ usuarioLogado, beta, onLogout, onRefresh }) {
  const [loading, setLoading] = useState(false);

  async function solicitar(dias) {
    if (loading) return;
    setLoading(true);
    try {
      await solicitarProrrogacaoBeta(usuarioLogado, dias);
      Alert.alert('Solicitacao enviada', `Pedido de +${dias} dias registrado. Seus dados continuam preservados.`);
      onRefresh?.();
    } catch (error) {
      Alert.alert('Nao foi possivel solicitar', error?.message || 'Fale conosco pelo WhatsApp.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <AppHeader logo={LOGO} title="Seu periodo de teste terminou" subtitle="Os dados da sua empresa estao preservados." />
        <AppCard style={styles.card}>
          <StatusBadge status="critico" label="Acesso operacional bloqueado" />
          <Text style={styles.title}>Seu periodo de teste terminou</Text>
          <Text style={styles.text}>
            Os dados da sua empresa estao preservados. Para continuar utilizando o FieldCheck Pro,
            solicite a prorrogacao do teste ou fale com nossa equipe comercial.
          </Text>
          <Text style={styles.text}>
            Funcionalidades bloqueadas: iniciar nova visita, criar checklist, editar dados, gerar novos relatorios, usar IA e sincronizar novas operacoes.
          </Text>
          <Text style={styles.meta}>Fim do teste: {beta?.trial_end ? new Date(beta.trial_end).toLocaleDateString('pt-BR') : '-'}</Text>
          <View style={styles.actions}>
            <AppButton title="Solicitar mais 15 dias" icon="time" onPress={() => solicitar(15)} disabled={loading} />
            <AppButton title="Solicitar mais 30 dias" icon="calendar" variant="secondary" onPress={() => solicitar(30)} disabled={loading} />
            <AppButton title="Falar com o comercial" icon="logo-whatsapp" variant="secondary" onPress={() => abrirSuporteWhatsApp('Ola, meu beta FieldCheck Pro venceu e quero renovar ou comprar o app.')} />
            <AppButton title="Ver proposta" icon="document-text" variant="secondary" onPress={() => abrirSuporteWhatsApp('Ola, quero receber uma proposta comercial do FieldCheck Pro.')} />
            <AppButton title="Sair" icon="log-out-outline" variant="secondary" onPress={onLogout} />
          </View>
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  card: { margin: 14, gap: 10 },
  title: { color: theme.colors.text, fontSize: 23, fontWeight: '900', lineHeight: 29 },
  text: { color: theme.colors.muted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  meta: { color: theme.colors.navy, fontSize: 13, fontWeight: '900' },
  actions: { gap: 10, marginTop: 8 },
});
