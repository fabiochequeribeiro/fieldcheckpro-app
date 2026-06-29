import React, { useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, ProgressBar } from '../components/fieldcheck/AppComponents';
import { fieldCheckTheme as theme } from '../theme/fieldCheckTheme';

const LOGO = require('../assets/fieldcheckpro-icon.png');

const SLIDES = [
  {
    title: 'Bem-vindo ao FieldCheck Pro 2.0',
    text: 'Inteligencia Operacional para empresas que executam servicos, inspeções e checklists em campo.',
  },
  {
    title: 'App para tecnicos',
    text: 'Checklists, fotos, assinaturas, PDF, historico e modo offline para proteger os dados da visita.',
  },
  {
    title: 'FieldCheck Hub',
    text: 'Portal para gestores acompanharem operacao, usuarios, empresas, relatorios, aprovacoes e feedbacks.',
  },
  {
    title: 'FieldCheck AI',
    text: 'Copiloto para sugerir checklist, gerar resumo inteligente, revisar pendencias e apoiar relatorios.',
  },
];

export default function BetaOnboardingScreen({ onFinish }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function next() {
    if (isLast) onFinish?.();
    else setIndex((value) => value + 1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={LOGO} style={styles.logo} />
        <AppCard style={styles.card}>
          <Text style={styles.eyebrow}>Programa Beta 2.0</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.text}>{slide.text}</Text>
          <ProgressBar value={((index + 1) / SLIDES.length) * 100} tone="green" />
          <View style={styles.actions}>
            <AppButton title={isLast ? 'Começar teste' : 'Continuar'} icon="arrow-forward" onPress={next} />
            <AppButton title="Já tenho login" icon="log-in-outline" variant="secondary" onPress={onFinish} />
          </View>
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.navy },
  container: { flex: 1, justifyContent: 'center', padding: 20, gap: 18 },
  logo: { width: 190, height: 110, resizeMode: 'contain', alignSelf: 'center', backgroundColor: '#fff', borderRadius: 18 },
  card: { gap: 12 },
  eyebrow: { color: theme.colors.green, fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  title: { color: theme.colors.text, fontSize: 27, fontWeight: '900', lineHeight: 33 },
  text: { color: theme.colors.muted, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  actions: { gap: 10, marginTop: 8 },
});
