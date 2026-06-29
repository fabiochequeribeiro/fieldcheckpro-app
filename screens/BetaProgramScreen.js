import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton, AppCard, AppHeader, SectionTitle, StatusBadge } from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';
import { abrirSuporteWhatsApp } from '../utils/suporteWhatsApp';
import { carregarControleBeta, solicitarProrrogacaoBeta } from '../services/BetaProgramService';
import TrialStatusBanner from '../components/fieldcheck/TrialStatusBanner';

const LOGO = require('../assets/fieldcheckpro-icon.png');

export default function BetaProgramScreen({ usuarioLogado }) {
  const [beta, setBeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setBeta(await carregarControleBeta(usuarioLogado));
    } catch (error) {
      Alert.alert('Programa Beta', error?.message || 'Nao foi possivel carregar o controle beta.');
    } finally {
      setLoading(false);
    }
  }, [usuarioLogado]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function pedir(dias) {
    try {
      await solicitarProrrogacaoBeta(usuarioLogado, dias);
      Alert.alert('Solicitacao registrada', `Seu pedido de +${dias} dias foi salvo. Nossa equipe entrara em contato.`);
    } catch (error) {
      Alert.alert('Nao foi possivel solicitar', error?.message || 'Tente novamente mais tarde.');
    }
  }

  const inicio = beta?.trial_start ? new Date(beta.trial_start).toLocaleDateString('pt-BR') : '-';
  const fim = beta?.trial_end ? new Date(beta.trial_end).toLocaleDateString('pt-BR') : '-';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader logo={LOGO} title="Programa Beta" subtitle="FieldCheck Pro 2.0 - Inteligencia Operacional" />
        <View style={styles.body}>
          <AppCard style={styles.hero}>
            <StatusBadge status={beta?.is_expired ? 'critico' : 'concluido'} label={beta?.trial_status || 'Carregando'} />
            <Text style={styles.title}>{beta?.beta_plan || 'Beta 2.0'}</Text>
            <Text style={styles.text}>{beta?.is_expired ? 'Seu periodo de testes venceu. Os dados estao preservados para renovacao.' : `${beta?.days_remaining ?? '-'} dia(s) restante(s) para testar com sua equipe.`}</Text>
          </AppCard>

          <TrialStatusBanner
            trial={beta}
            onExtension={() => pedir(15)}
            onWhatsApp={() => abrirSuporteWhatsApp('Ola, quero falar sobre meu periodo de teste do FieldCheck Pro.')}
            onProposal={() => abrirSuporteWhatsApp('Ola, quero receber uma proposta comercial do FieldCheck Pro.')}
          />

          <SectionTitle title="Controle do teste" />
          <AppCard>
            <Info label="Empresa" value={beta?.empresa || '-'} />
            <Info label="Inicio" value={inicio} />
            <Info label="Fim" value={fim} />
            <Info label="Status" value={beta?.trial_status || '-'} />
            <Info label="Plano" value={beta?.plan_status || '-'} />
            <Info label="Origem da data" value={beta?.server_time_source === 'supabase_rpc' ? 'Servidor Supabase' : 'Fallback local'} />
          </AppCard>

          <SectionTitle title="Modulos liberados" />
          <View style={styles.modules}>
            {(beta?.modules_enabled || []).map((item) => <Text key={item} style={styles.moduleChip}>{item}</Text>)}
          </View>

          <SectionTitle title="Solicitar prorrogacao" subtitle="O pedido nao altera a data automaticamente; ele fica registrado para avaliacao." />
          <View style={styles.actions}>
            <AppButton title="Solicitar +15 dias" icon="time" onPress={() => pedir(15)} disabled={loading} />
            <AppButton title="Solicitar +30 dias" icon="calendar" variant="secondary" onPress={() => pedir(30)} disabled={loading} />
            <AppButton title="Falar no WhatsApp" icon="logo-whatsapp" variant="secondary" onPress={() => abrirSuporteWhatsApp('Ola, quero falar sobre o Programa Beta FieldCheck Pro 2.0.')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }) {
  return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 28 },
  body: { padding: 14, gap: 12 },
  hero: { gap: 8 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
  text: { color: theme.colors.muted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  info: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#edf0f3' },
  infoLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '800' },
  infoValue: { color: theme.colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  modules: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moduleChip: { color: theme.colors.navy, backgroundColor: '#edf4fb', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, fontSize: 12, fontWeight: '900', overflow: 'hidden' },
  actions: { gap: 10 },
});
