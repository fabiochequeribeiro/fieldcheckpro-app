import React from 'react';
import { SafeAreaProvider, useSafeAreaInsets,} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './screens/HomeScreen';
import MainScreen from './screens/MainScreen';
import ClientesScreen from './screens/ClientesScreen';
import HistoricoScreen from './screens/HistoricoScreen';

import { Ionicons } from '@expo/vector-icons';

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

  return (
    <NavigationContainer key="reset-navigation">  
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
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 2,
    },

    tabBarIcon: ({ color, size }) => {
      let iconName;

     if (route.name === 'Início') {
  iconName = 'home';
} else if (route.name === 'Nova Visita') {
  iconName = 'clipboard';
} else if (route.name === 'Clientes') {
  iconName = 'people';
} else if (route.name === 'Histórico') {
  iconName = 'time';
}

      return (
        <Ionicons
          name={iconName}
          size={size}
          color={color}
        />
      );
    },
  })}
>

  <Tab.Screen
    name="Início"
    component={MainScreen}
    options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home" size={size} color={color} />
    ),
  }}
/>

        <Tab.Screen
          name="Nova Visita"
          component={HomeScreen}
          initialParams={{ telaInicial: 'pedido' }}
        />

        <Tab.Screen
          name="Clientes"
          component={ClientesScreen}
        />

        <Tab.Screen
          name="Histórico"
          component={HomeScreen}
          initialParams={{ telaInicial: 'historico' }}
        />
      </Tab.Navigator>

    </NavigationContainer>
  );
}