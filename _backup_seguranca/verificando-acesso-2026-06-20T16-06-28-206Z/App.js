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
import { definirSessaoOperacional, limparSessaoOperacional } from './utils/sessaoOperacional';

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
      .select('id,user_id,nome,email,empresa,papel,ativo')
      .eq('email', email)
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw error;
    if (!tecnico) {
      await supabase.auth.signOut();
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
      return null;
    }
    definirSessaoOperacional(usuarioBase);
    const acesso = await verificarAcessoComercial(usuarioBase);
    const usuarioFinal = { ...usuarioBase, acessoComercial: acesso };
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
        if (ativo) await aplicarAcesso(usuario);
      } catch (erro) {
        console.log('Erro ao verificar sessão inicial:', erro);
        if (ativo) await aplicarAcesso(null);
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
        await aplicarAcesso(null);
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
    limparSessaoOperacional();
    setUsuarioLogado(null);
    setAcessoComercial(null);
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
  const screenProps = { usuarioLogado };

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
              onLogout={sairDoAplicativo}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Serviços" initialParams={{ telaInicial: 'pedido' }}>
          {(props) => <HomeScreen {...props} {...screenProps} />}
        </Tab.Screen>

        {gestor ? (
          <Tab.Screen name="Ordens" options={{ title: 'Ordens de Serviço' }}>
            {(props) => <CadastroPedidoObraScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        <Tab.Screen name="Inventário" options={{ title: 'Inventário de Campo' }}>
          {(props) => <LevantamentoPecasScreen {...props} {...screenProps} />}
        </Tab.Screen>

        {gestor ? (
          <Tab.Screen name="Modelos" options={{ title: 'Modelos de Checklist' }}>
            {(props) => <ModelosChecklistScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        <Tab.Screen name="Ocorrências" options={{ title: 'Ocorrências de Obra' }}>
          {(props) => <OcorrenciasScreen {...props} {...screenProps} />}
        </Tab.Screen>

        {gestor ? (
          <Tab.Screen name="Clientes">
            {(props) => <ClientesScreen {...props} {...screenProps} />}
          </Tab.Screen>
        ) : null}

        <Tab.Screen name="Relatórios" initialParams={{ telaInicial: 'historico' }}>
          {(props) => <HomeScreen {...props} {...screenProps} />}
        </Tab.Screen>

        {gestor ? (
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
