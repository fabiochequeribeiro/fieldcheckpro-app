import React, { useEffect, useState } from 'react';
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

const Tab = createBottomTabNavigator();

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

  async function montarUsuarioLogado(user) {
    if (!user) return null;

    const email = String(user.email || '').trim().toLowerCase();
    const { data: tecnico, error } = await supabase
      .from('tecnicos')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw error;

    if (!tecnico) {
      await supabase.auth.signOut();
      return null;
    }

    return {
      ...user,
      nome: tecnico.nome,
      empresa: tecnico.empresa || tecnico.cliente || 'Conta individual',
      tecnico,
    };
  }

  async function aplicarAcesso(usuarioBase) {
    if (!usuarioBase) {
      setUsuarioLogado(null);
      setAcessoComercial(null);
      return null;
    }

    const acesso = await verificarAcessoComercial(usuarioBase);
    const usuarioFinal = {
      ...usuarioBase,
      acessoComercial: acesso,
    };

    setAcessoComercial(acesso);
    setUsuarioLogado(usuarioFinal);
    return usuarioFinal;
  }

  async function atualizarAcesso() {
    if (!usuarioLogado) return null;
    return aplicarAcesso(usuarioLogado);
  }

  useEffect(() => {
    let ativo = true;

    async function verificarSessaoInicial() {
      try {
        const { data } = await supabase.auth.getSession();
        const usuario = await montarUsuarioLogado(data?.session?.user);
        if (ativo) {
          await aplicarAcesso(usuario);
        }
      } catch (erro) {
        console.log('Erro ao verificar sessão inicial:', erro);
        if (ativo) {
          setUsuarioLogado(null);
          setAcessoComercial(null);
        }
      } finally {
        if (ativo) setCarregandoSessao(false);
      }
    }

    verificarSessaoInicial();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const usuario = await montarUsuarioLogado(session?.user);
        await aplicarAcesso(usuario);
      } catch (erro) {
        console.log('Erro ao atualizar sessão:', erro);
        setUsuarioLogado(null);
        setAcessoComercial(null);
      } finally {
        setCarregandoSessao(false);
      }
    });

    return () => {
      ativo = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function sairDoAplicativo() {
    try {
      await supabase.auth.signOut();
    } catch (erro) {
      console.log('Erro ao sair:', erro);
    }
    setUsuarioLogado(null);
    setAcessoComercial(null);
  }

  if (carregandoSessao) {
    return <AppLoginScreen modoCarregando />;
  }

  if (!usuarioLogado) {
    return <AppLoginScreen onLogin={aplicarAcesso} />;
  }

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

  return (
    <NavigationContainer key="navigation-logado">
      <Tab.Navigator
        initialRouteName="Início"
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: '#123c69',
          },
          headerTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: '#123c69',
            height: 65 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#c7d5e0',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginBottom: 2,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName = 'ellipse';

            if (route.name === 'Início') iconName = 'home';
            else if (route.name === 'Serviços') iconName = 'clipboard';
            else if (route.name === 'Ordens') iconName = 'add-circle';
            else if (route.name === 'Inventário') iconName = 'cube';
            else if (route.name === 'Modelos') iconName = 'options';
            else if (route.name === 'Ocorrências') iconName = 'warning';
            else if (route.name === 'Clientes') iconName = 'people';
            else if (route.name === 'Relatórios') iconName = 'time';
            else if (route.name === 'Assinatura') iconName = 'card';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Início" options={{ title: 'Menu Principal' }}>
          {(props) => (
            <MainScreen
              {...props}
              usuarioLogado={usuarioLogado}
              acessoComercial={acessoComercial}
              onLogout={sairDoAplicativo}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Serviços" initialParams={{ telaInicial: 'pedido' }}>
          {(props) => <HomeScreen {...props} usuarioLogado={usuarioLogado} />}
        </Tab.Screen>

        <Tab.Screen
          name="Ordens"
          component={CadastroPedidoObraScreen}
          options={{ title: 'Ordens de Serviço' }}
        />

        <Tab.Screen
          name="Inventário"
          component={LevantamentoPecasScreen}
          options={{ title: 'Inventário de Campo' }}
        />

        <Tab.Screen
          name="Modelos"
          component={ModelosChecklistScreen}
          options={{ title: 'Modelos de Checklist' }}
        />

        <Tab.Screen
          name="Ocorrências"
          component={OcorrenciasScreen}
          options={{ title: 'Ocorrências de Obra' }}
        />

        <Tab.Screen name="Clientes" component={ClientesScreen} />

        <Tab.Screen name="Relatórios" initialParams={{ telaInicial: 'historico' }}>
          {(props) => <HomeScreen {...props} usuarioLogado={usuarioLogado} />}
        </Tab.Screen>

        <Tab.Screen name="Assinatura" options={{ title: 'Assinatura' }}>
          {(props) => (
            <AssinaturaScreen
              {...props}
              usuarioLogado={usuarioLogado}
              acessoComercial={acessoComercial}
              onAtualizar={atualizarAcesso}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
