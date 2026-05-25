import React, { useEffect, useState } from 'react';

import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../supabase';

export default function ClientesScreen() {

  const [clientes, setClientes] = useState([]);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [contato, setcontato] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setClientes(data || []);
  }

  async function salvarCliente() {

    if (!nome) {
      Alert.alert('Atenção', 'Digite o nome do cliente');
      return;
    }

    const { error } = await supabase
      .from('clientes')
      .insert([
        {
          nome,
          email,
          cidade,
          contato,
          telefone,
        }
      ]);

    if (error) {
      console.log('ERRO AO SALVAR CLIENTE:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
      return;
    }

      Alert.alert('Sucesso', 'Cliente salvo com sucesso!');

         setNome('');
         setEmail('');
         setTelefone('');
         setCidade('');
         setContato('');

         carregarClientes();

   

    Alert.alert('Sucesso', 'Cliente salvo');

    setNome('');
    setEmail('');
    setCidade('');
    setContato('');
    setTelefone('');

    carregarClientes();
  }

  return (
    <SafeAreaView style={styles.safe}>

      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.titulo}>
          Cadastro de Clientes
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor="#666"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Telefone"
          placeholderTextColor="#666"
          value={telefone}
          onChangeText={setTelefone}
        />

        <TextInput
          style={styles.input}
          placeholder="Cidade"
          placeholderTextColor="#666"
          value={cidade}
          onChangeText={setCidade}
        />

        <TextInput
          style={styles.input}
          placeholder="Contato"
          placeholderTextColor="#666"
          value={contato}
          onChangeText={setcontato}
        />

        <TouchableOpacity
          style={styles.botao}
          onPress={salvarCliente}
        >
          <Text style={styles.botaoTexto}>
            Salvar Cliente
          </Text>
        </TouchableOpacity>

        <Text style={styles.subtitulo}>
          Clientes cadastrados
        </Text>

        {clientes.map((cliente) => (

          <View key={cliente.id} style={styles.card}>

            <Text style={styles.nome}>
              {cliente.nome}
            </Text>

            <Text>
              {cliente.telefone}
            </Text>

            <Text>
              {cliente.cidade}
            </Text>

            <Text>
              {cliente.contato}
            </Text>

          </View>

        ))}

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  container: {
    padding: 20,
  },

  titulo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#123c69',
    marginBottom: 20,
  },

  subtitulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#123c69',
    marginTop: 30,
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  botao: {
    backgroundColor: '#123c69',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  botaoTexto: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
  },

  nome: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123c69',
    marginBottom: 6,
  },

});