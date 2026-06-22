import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { abrirGerenciamentoAssinatura, GOOGLE_PLAY_SUBSCRIPTION_ID } from '../services/assinaturaService';
import { abrirSuporteWhatsApp } from '../utils/suporteWhatsApp';

function textoStatus(acesso) {
  if (!acesso) return 'Verificando acesso';
  if (acesso.status === 'ativo') return 'Assinatura ativa';
  if (acesso.status === 'trial') return 'Teste grátis ativo';
  return 'Acesso expirado';
}

function corStatus(acesso) {
  if (!acesso) return '#64748b';
  if (acesso.status === 'ativo') return '#087f3a';
  if (acesso.status === 'trial') return '#1f7ae0';
  return '#b42318';
}

export default function AssinaturaScreen({
  usuarioLogado,
  acessoComercial,
  onAtualizar,
  onLogout,
  modoBloqueado = false,
}) {
  const [carregando, setCarregando] = useState(false);
  const cor = corStatus(acessoComercial);
  const diasRestantes = acessoComercial?.diasRestantes ?? 0;

  async function atualizar() {
    try {
      setCarregando(true);
      await onAtualizar?.();
    } finally {
      setCarregando(false);
    }
  }

  async function assinar() {
    Alert.alert(
      'Assinatura pela Play Store',
      'Produto configurado: ' + GOOGLE_PLAY_SUBSCRIPTION_ID + '. Depois de criar a assinatura no Play Console, conecte a compra com Google Play Billing.',
    );
  }

  async function restaurar() {
    try {
      await abrirGerenciamentoAssinatura();
    } catch (_erro) {
      Alert.alert('Assinatura', 'Não foi possível abrir o gerenciamento de assinaturas agora.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconeTopo, { backgroundColor: cor + '18' }]}>
            <Ionicons name={acessoComercial?.status === 'trial' ? 'time' : 'card'} size={34} color={cor} />
          </View>
          <Text style={styles.titulo}>Assinatura</Text>
          <Text style={styles.subtitulo}>Gerencie o teste grátis e o acesso da empresa</Text>
        </View>

        <View style={styles.painel}>
          <View style={[styles.statusBadge, { backgroundColor: cor + '18' }]}>
            <View style={[styles.statusPonto, { backgroundColor: cor }]} />
            <Text style={[styles.statusTexto, { color: cor }]}>{textoStatus(acessoComercial)}</Text>
          </View>

          {acessoComercial?.status === 'trial' ? (
            <View style={styles.diasBox}>
              <Text style={styles.diasNumero}>{diasRestantes}</Text>
              <Text style={styles.diasTexto}>dia(s) restantes</Text>
              <Text style={styles.diasSubTexto}>Teste grátis liberado para esta empresa</Text>
            </View>
          ) : (
            <Text style={styles.mensagem}>{acessoComercial?.mensagem || 'Verificando assinatura...'}</Text>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="business-outline" size={20} color="#123c69" />
              <Text style={styles.infoLabel}>Empresa</Text>
              <Text style={styles.infoValor} numberOfLines={2}>{acessoComercial?.empresa || usuarioLogado?.empresa || '-'}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="pricetag-outline" size={20} color="#123c69" />
              <Text style={styles.infoLabel}>Plano</Text>
              <Text style={styles.infoValor} numberOfLines={2}>{acessoComercial?.plano || 'trial_30_dias'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.beneficios}>
          {[
            ['checkmark-circle', 'Checklists e ordens de serviço'],
            ['image', 'Fotos, ocorrências e assinaturas'],
            ['document-text', 'Relatórios PDF e exportações'],
            ['cloud-done', 'Controle por empresa e sincronização'],
          ].map(([icone, texto]) => (
            <View style={styles.beneficioItem} key={texto}>
              <Ionicons name={icone} size={20} color="#087f3a" />
              <Text style={styles.beneficioTexto}>{texto}</Text>
            </View>
          ))}
        </View>

        <View style={styles.acoes}>
          {modoBloqueado && (
            <TouchableOpacity style={styles.botaoPrincipal} onPress={assinar} activeOpacity={0.86}>
              <Ionicons name="card-outline" size={20} color="#fff" />
              <Text style={styles.botaoPrincipalTexto}>Assinar agora</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.botaoWhatsApp}
            onPress={() => abrirSuporteWhatsApp('Olá, preciso de suporte sobre a assinatura do FieldCheck Pro.')}
            activeOpacity={0.86}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
            <Text style={styles.botaoWhatsAppTexto}>Suporte por WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoSecundario} onPress={restaurar} activeOpacity={0.86}>
            <Ionicons name="refresh" size={20} color="#123c69" />
            <Text style={styles.botaoSecundarioTexto}>Restaurar assinatura</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoSecundario} onPress={atualizar} activeOpacity={0.86}>
            {carregando ? (
              <ActivityIndicator size="small" color="#123c69" />
            ) : (
              <Ionicons name="sync" size={20} color="#123c69" />
            )}
            <Text style={styles.botaoSecundarioTexto}>Atualizar acesso</Text>
          </TouchableOpacity>

          {onLogout && (
            <TouchableOpacity style={styles.botaoTexto} onPress={onLogout} activeOpacity={0.86}>
              <Text style={styles.botaoTextoLabel}>Sair desta conta</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.observacao}>
          O teste grátis é calculado por empresa. A compra comercial deve ser conectada ao Google Play Billing antes da publicação com cobrança.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  container: {
    flexGrow: 1,
    padding: 18,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 18,
  },
  iconeTopo: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 29,
    fontWeight: '900',
    color: '#062a66',
  },
  subtitulo: {
    marginTop: 5,
    color: '#667085',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  painel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    marginBottom: 14,
  },
  statusPonto: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },
  statusTexto: {
    fontSize: 14,
    fontWeight: '900',
  },
  mensagem: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
  },
  diasBox: {
    alignItems: 'center',
    backgroundColor: '#eaf3ff',
    borderRadius: 8,
    paddingVertical: 18,
    marginBottom: 8,
  },
  diasNumero: {
    fontSize: 48,
    color: '#1f7ae0',
    fontWeight: '900',
  },
  diasTexto: {
    color: '#123c69',
    fontSize: 16,
    fontWeight: '900',
  },
  diasSubTexto: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  infoLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  infoValor: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  beneficios: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 14,
    gap: 10,
  },
  beneficioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  beneficioTexto: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  acoes: {
    gap: 10,
    marginTop: 14,
  },
  botaoPrincipal: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#123c69',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  botaoPrincipalTexto: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  botaoWhatsApp: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  botaoWhatsAppTexto: {
    color: '#15803d',
    fontWeight: '900',
    fontSize: 15,
  },
  botaoSecundario: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  botaoSecundarioTexto: {
    color: '#123c69',
    fontWeight: '900',
    fontSize: 15,
  },
  botaoTexto: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  botaoTextoLabel: {
    color: '#667085',
    fontWeight: '800',
  },
  observacao: {
    textAlign: 'center',
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
});
