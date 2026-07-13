import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function CardPedido({
  pedido,
  equipamentos,
  onIniciar,
  onAbrirMaps,
  styles,
}) {
  if (!pedido) return null;

  return (
    <View style={styles.cardResumoPedido}>
      <Text style={styles.resumoPedidoTitulo}>
        Pedido #{pedido.numero_pedido}
      </Text>

      <Text style={styles.resumoPedidoLinha}>
        Cliente: {pedido.cliente || 'Cliente não informado'}
      </Text>

      <Text style={styles.resumoPedidoLinha}>
        Cidade: {pedido.cidade || 'Cidade não informada'}
      </Text>

      <Text style={styles.resumoPedidoLinha}>
        Equipamentos: {equipamentos.length}
      </Text>

      <TouchableOpacity
        style={styles.botaoPrincipal}
        onPress={onIniciar}
      >
        <Text style={styles.botaoPrincipalTexto}>
          Iniciar Serviço Técnico
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botaoMaps}
        onPress={onAbrirMaps}
      >
        <Text style={styles.botaoMapsTexto}>
          Navegar até o cliente
        </Text>
      </TouchableOpacity>
    </View>
  );
}