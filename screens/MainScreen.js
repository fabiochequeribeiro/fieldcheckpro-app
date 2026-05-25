import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';

export default function MainScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>

      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
      />

      <Text style={styles.titulo}>
        BRS Equipamentos Agrícolas
      </Text>

      <Text style={styles.subtitulo}>
        Sistema de Entrega Técnica
      </Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate('Nova Visita')}
      >
        <Text style={styles.botaoTexto}>
          🔧 Iniciar Entrega Técnica
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate('Clientes')}
      >
        <Text style={styles.botaoTexto}>
          👥 Consultar Clientes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate('Histórico')}
      >
        <Text style={styles.botaoTexto}>
          📄 Histórico de Visitas
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  logo: {
    width: 220,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10,
  },

  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0b3570',
    marginBottom: 6,
    textAlign: 'center',
  },

  subtitulo: {
    fontSize: 16,
    color: '#4d5c74',
    marginBottom: 40,
    textAlign: 'center',
  },

  botao: {
    width: '100%',
    backgroundColor: '#0b3570',
    paddingVertical: 18,
    borderRadius: 18,
    marginBottom: 18,
    alignItems: 'center',
    elevation: 4,
  },

  botaoTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});