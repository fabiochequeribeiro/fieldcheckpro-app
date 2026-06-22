import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { abrirSuporteWhatsApp } from '../utils/suporteWhatsApp';
import { comTempoLimite, erroDeTempoLimite } from '../utils/tempoLimite';

const LOGO = require('../assets/fieldcheck-icon.png');

export default function AppLoginScreen({ onLogin, modoCarregando = false }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    const emailLimpo = email.trim().toLowerCase();
    const senhaLimpa = senha.trim();

    if (!emailLimpo || !senhaLimpa) {
      Alert.alert('Atenção', 'Informe o e-mail e a senha do técnico.');
      return;
    }

    try {
      setCarregando(true);

      const { data: sessao, error: erroLogin } = await comTempoLimite(
        supabase.auth.signInWithPassword({ email: emailLimpo, password: senhaLimpa }),
        12000,
        'O login demorou mais que o esperado.',
      );

      if (erroLogin || !sessao?.user) {
        Alert.alert('Erro no login', 'E-mail ou senha inválidos.');
        return;
      }

      const { data: tecnico, error: erroTecnico } = await comTempoLimite(
        supabase
          .from('tecnicos')
          .select('*')
          .eq('email', emailLimpo)
          .eq('ativo', true)
          .maybeSingle(),
        7000,
        'A consulta do perfil demorou mais que o esperado.',
      );

      if (erroTecnico) throw erroTecnico;

      if (!tecnico) {
        await supabase.auth.signOut();
        Alert.alert('Erro no login', 'Técnico inativo ou sem acesso ao aplicativo.');
        return;
      }

      await onLogin?.({
        ...sessao.user,
        nome: tecnico.nome,
        empresa: tecnico.empresa || tecnico.cliente || 'Conta individual',
        tecnico,
      });
    } catch (erro) {
      console.log('Erro no login:', erro);
      Alert.alert(
        erroDeTempoLimite(erro) ? 'Conexão lenta' : 'Erro no login',
        erroDeTempoLimite(erro) ? 'Não foi possível concluir agora. Verifique a internet e tente novamente.' : (erro?.message || 'Falha ao fazer login.'),
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <Image source={LOGO} style={styles.logo} />

          <Text style={styles.titulo}>FieldCheck Pro</Text>
          <Text style={styles.subtitulo}>Acesse sua rotina de campo</Text>

          {modoCarregando ? (
            <View style={styles.carregandoBox}>
              <ActivityIndicator size="large" color="#123c69" />
              <Text style={styles.carregandoTexto}>Verificando acesso...</Text>
            </View>
          ) : (
            <>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="E-mail do técnico"
                  placeholderTextColor="#8a97a8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Senha"
                  placeholderTextColor="#8a97a8"
                  value={senha}
                  onChangeText={setSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  textContentType="password"
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                style={[styles.botao, carregando && styles.botaoDesabilitado]}
                onPress={entrar}
                disabled={carregando}
                activeOpacity={0.88}
              >
                {carregando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                )}
                <Text style={styles.botaoTexto}>
                  {carregando ? 'Entrando...' : 'Entrar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoSuporte}
                onPress={() => abrirSuporteWhatsApp('Olá, preciso de suporte para acessar o FieldCheck Pro.')}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
                <Text style={styles.botaoSuporteTexto}>Falar com suporte</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.rodape}>Teste grátis, checklists, relatórios e suporte em campo</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#123c69',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f4f7fb',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logo: {
    width: 190,
    height: 104,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 27,
    fontWeight: '900',
    color: '#123c69',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 15,
    color: '#5d6b7a',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    fontWeight: '700',
  },
  inputBox: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  botao: {
    minHeight: 54,
    backgroundColor: '#123c69',
    borderRadius: 8,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
    textAlign: 'center',
  },
  botaoSuporte: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    flexDirection: 'row',
    gap: 8,
  },
  botaoSuporteTexto: {
    color: '#15803d',
    fontWeight: '900',
    fontSize: 15,
  },
  carregandoBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  carregandoTexto: {
    marginTop: 14,
    color: '#5d6b7a',
    fontWeight: '700',
  },
  rodape: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 16,
    fontSize: 12,
    fontWeight: '700',
  },
});
