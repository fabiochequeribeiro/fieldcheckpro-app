import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';

import { supabase } from '../supabase';
import { obterEmpresaAtual } from '../utils/sessaoOperacional';


export default function HistoricoScreen() {

  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  async function carregarHistorico() {

    try {

      const { data, error } = await supabase
        .from('visitas')
        .select('*')
        .eq('empresa', obterEmpresaAtual())
        .order('id', { ascending: false });

      if (error) {
        console.log(error);
        return;
      }

      setVisitas(data || []);

    } catch (erro) {

      console.log(erro);

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {
    carregarHistorico();
  }, []);

  function renderVisita({ item }) {

    return (
      <View style={styles.card}>

        <Text style={styles.cliente}>
          {item.cliente}
        </Text>

        <Text style={styles.info}>
          Técnico: {item.tecnico || '-'}
        </Text>

        <Text style={styles.info}>
          Cidade: {item.cidade || '-'}
        </Text>

        <Text style={styles.info}>
          Data: {item.data_visita || '-'}
        </Text>

        <Text style={styles.info}>
          Observações:
        </Text>

        <Text style={styles.obs}>
          {item.observacoes || 'Sem observações'}
        </Text>

      </View>
    );
  }


const visitasFiltradas = visitas.filter((visita) => {
  const texto = busca.toLowerCase();

  return (
    visita.cliente?.toLowerCase().includes(texto) ||
    visita.cidade?.toLowerCase().includes(texto) ||
    visita.tecnico?.toLowerCase().includes(texto)
  );
});


  if (loading) {

    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#123c69"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>
        Histórico de Visitas
      </Text>

<TextInput
  style={styles.inputBusca}
  placeholder="Buscar cliente, cidade ou técnico..."
  value={busca}
  onChangeText={setBusca}
/>

      <FlatList
        data={visitasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVisita}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    padding: 16,
  },

inputBusca: {
  backgroundColor: '#fff',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: '#dbe4ea',
  fontSize: 15,
},

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  titulo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#123c69',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d9e2ec',
  },

  cliente: {
    fontSize: 18,
    fontWeight: '900',
    color: '#123c69',
    marginBottom: 10,
  },

  info: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },

  obs: {
    marginTop: 6,
    color: '#555',
    lineHeight: 22,
  },

});