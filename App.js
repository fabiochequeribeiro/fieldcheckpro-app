import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import MainScreen from './screens/MainScreen';
import ClientesScreen from './screens/ClientesScreen';
import OcorrenciasScreen from './screens/OcorrenciasScreen';
import CadastroPedidoObraScreen from './screens/CadastroPedidoObraScreen';
import LevantamentoPecasScreen from './screens/LevantamentoPecasScreen';
import ModelosChecklistScreen from './screens/ModelosChecklistScreen';
import AppLoginScreen from './screens/AppLoginScreen';
import AssinaturaScreen from './screens/AssinaturaScreen';
import { supabase } from './supabase';
import { verificarAcessoComercial } from './services/assinaturaService';
import { carregarConfiguracaoModular } from './services/configuracaoModularService';
import { MODULOS, moduloEstaAtivo, normalizarConfiguracaoModular } from './shared/modulosFieldCheck';
import { definirSessaoOperacional, limparSessaoOperacional } from './utils/sessaoOperacional';
import { comTempoLimite } from './utils/tempoLimite';

const Tab = createBottomTabNavigator();
const PERFIL_CACHE_PREFIX = '@fieldcheck_perfil_sessao_';
const PERFIL_CACHE_TTL = 24 * 60 * 60 * 1000;

function chavePerfil(user) {
  return PERFIL_CACHE_PREFIX + String(user?.id || user?.email || 'desconhecido').toLowerCase();
}

async function salvarPerfilCache(user, tecnico) {
  if (!user || !tecnico) return;
  await AsyncStorage.setItem(chavePerfil(user), JSON.stringify({ tecnico, salvo_em: Date.now() }));
}

async function carregarPerfilCache(user) {
  try {
    const texto = await AsyncStorage.getItem(chavePerfil(user));
    if (!texto) return null;
    const cache = JSON.parse(texto);
    if (!cache?.tecnico || Date.now() - Number(cache.salvo_em || 0) > PERFIL_CACHE_TTL) return null;
    return cache.tecnico;
  } catch (_erro) {
    return null;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [acessoComercial, setAcessoComercial] = useState(null);
  const [configuracaoModular, setConfiguracaoModular] = useState(() => normalizarConfiguracaoModular());

  async function montarUsuarioLogado(user) {
    if (!user) return null;
    const email = String(user.email || '').trim().toLowerCase();
    let tecnico = null;
    try {
      const resultado = await comTempoLimite(
        supabase
          .from('tecnicos')
          .select('id,user_id,nome,email,empresa,papel,ativo')
          .eq('email', email)
          .eq('ativo', true)
          .maybeSingle(),
        7000,
        'A consulta do perfil demorou mais que o esperado.',
      );
      if (resultado.error) throw resultado.error;
      tecnico = resultado.data;
      if (tecnico) await salvarPerfilCache(user, tecnico);
    } catch (erro) {
      tecnico = await carregarPerfilCache(user);
      if (!tecnico) throw erro;
      console.log('Perfil temporariamente carregado do cache local.');
    }

    if (!tecnico) {
      await comTempoLimite(supabase.auth.signOut(), 4000).catch(() => null);
      return null;
    }

    const usuario = {
      ...user,
      nome: tecnico.nome,
      empresa: tecnico.empresa || 'Conta individual',
      papel: tecnico.papel || 'tecnico',
      tecnico,
    };
    definirSessaoOperacional(usuario);
    return usuario;
  }

  async function aplicarAcesso(usuarioBase) {
    if (!usuarioBase) {
      limparSessaoOperacional();
      setUsuarioLogado(null);
      setAcessoComercial(null);
      setConfiguracaoModular(normalizarConfiguracaoModular());
      return null;
    }
    definirSessaoOperacional(usuarioBase);
    if (usuarioBase.tecnico) await salvarPerfilCache(usuarioBase, usuarioBase.tecnico);
    const [acesso, modulos] = await Promise.all([
      verificarAcessoComercial(usuarioBase),
      carregarConfiguracaoModular(usuarioBase?.tecnico?.empresa || usuarioBase?.empresa),
    ]);
    const usuarioFinal = { ...usuarioBase, acessoComercial: acesso };
    setAcessoComercial(acesso);
    setConfiguracaoModular(modulos);
    setUsuarioLogado(usuarioFinal);
    return usuarioFinal;
  }

  async function atualizarAcesso() {
    if (!usuarioLogado) return null;
    return aplicarAcesso(usuarioLogado);
  }

  useEffect(() => {
    let ativo = true;
    const watchdog = setTimeout(() => {
      if (ativo) setCarregandoSessao(false);
    }, 10000);

    async function verificarSessaoInicial() {
      try {
        const { data } = await comTempoLimite(
          supabase.auth.getSession(),
          5000,
          'A sessão demorou mais que o esperado.',
        );
        const usuario = await montarUsuarioLogado(data?.session?.user);
        if (ativo) await aplicarAcesso(usuario);
      } catch (erro) {
        console.log('Erro ao verificar sessão inicial:', erro);
        if (ativo) await aplicarAcesso(null);
      } finally {
        if (ativo) setCarregandoSessao(false);
      }
    }

    verificarSessaoInicial();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // Consultas adicionais dentro deste callback podem bloquear o cliente Supabase.
      if (event === 'SIGNED_OUT') {
        limparSessaoOperacional();
        setUsuarioLogado(null);
        setAcessoComercial(null);
        setConfiguracaoModular(normalizarConfiguracaoModular());
        setCarregandoSessao(false);
      }
    });
    return () => {
      ativo = false;
      clearTimeout(watchdog);
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function sairDoAplicativo() {
    try {
      await supabase.auth.signOut();
    } catch (erro) {
      console.log('Erro ao sair:', erro);
    }
    limparSessaoOperacional();
    setUsuarioLogado(null);
    setAcessoComercial(null);
    setConfiguracaoModular(normalizarConfiguracaoModular());
  }

  if (carregandoSessao) return <AppLoginScreen modoCarregando />;
  if (!usuarioLogado) return <AppLoginScreen onLogin={aplicarAcesso} />;
  if (acessoComercial && !acessoComercial.liberado) {
    return (
      <AssinaturaScreen
        usuarioLogado={usuarioLogado}
        acessoComercial={acessoComercial}
        onAtualizar={atualizarAcesso}
        onLogout={sairDoAplicativo}
        modoBloqueado
      />
    );
  }

  const papel = usuarioLogado?.tecnico?.papel || usuarioLogado?.papel || 'tecnico';
  const gestor = papel === 'administrador' || papel === 'supervisor';
  const screenProps = { usuarioLogado, configuracaoModular };
  const podeUsar = (modulo) => moduloEstaAtivo(configuracaoModular, modulo, papel);

  return (
    <NavigationContainer key={`navigation-${papel}`}>
      <Tab.Navigator
        initialRouteName="Início"
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: '#123c69' },
          headerTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: '#123c69',
            height: 65 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#c7d5e0',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
          tabBarIcon: ({ color, size }) => {
            const icons = {
              Início: 'home',
              Serviços: 'clipboard',
              Ordens: 'add-circle',
              Inventário: 'cube',
              Modelos: 'options',
              Ocorrências: 'warning',
              Clientes: 'people',
              Relatórios: 'time',
              Assinatura: 'card',
            };
            return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Início" options={{ title: 'Menu Principal' }}>
          {(props) => (
            <MainScreen
              {...props}
              {...screenProps}
              acessoComercial={acessoComercial}
              configuracaoModular={configuracaoModular}
              onLogout={sairDoAplicativo}
            />
          )}
        </Tab.Screen>

        {podeUsar(MODULOS.EXECUCAO_CAMPO) ? (
          <Tab.Screen name="Serviços" initialParams={{ telaInicial: 'pedido' }}>
            {(props) => <HomeScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        {gestor && podeUsar(MODULOS.ORDENS) ? (
          <Tab.Screen name="Ordens" options={{ title: 'Ordens de Serviço' }}>
            {(props) => <CadastroPedidoObraScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        {podeUsar(MODULOS.INVENTARIO) ? (
          <Tab.Screen name="Inventário" options={{ title: 'Inventário de Campo' }}>
            {(props) => <LevantamentoPecasScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        {gestor && podeUsar(MODULOS.CHECKLISTS) ? (
          <Tab.Screen name="Modelos" options={{ title: 'Modelos de Checklist' }}>
            {(props) => <ModelosChecklistScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        {podeUsar(MODULOS.OCORRENCIAS) ? (
          <Tab.Screen name="Ocorrências" options={{ title: 'Ocorrências de Obra' }}>
            {(props) => <OcorrenciasScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        {gestor && podeUsar(MODULOS.CLIENTES) ? (
          <Tab.Screen name="Clientes">
            {(props) => <ClientesScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        {podeUsar(MODULOS.RELATORIOS) ? (
          <Tab.Screen name="Relatórios" initialParams={{ telaInicial: 'historico' }}>
            {(props) => <HomeScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        {gestor && podeUsar(MODULOS.ASSINATURA) ? (
          <Tab.Screen name="Assinatura" options={{ title: 'Assinatura' }}>
            {(props) => (
              <AssinaturaScreen
                {...props}
                {...screenProps}
                acessoComercial={acessoComercial}
                onAtualizar={atualizarAcesso}
              />
            )}
          </Tab.Screen>
        ) : null}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
