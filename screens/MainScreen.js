import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { abrirSuporteWhatsApp } from '../utils/suporteWhatsApp';
import { MODULOS, moduloEstaAtivo } from '../shared/modulosFieldCheck';

function obterNomeTecnico(usuarioLogado) {
  return (
    usuarioLogado?.tecnico?.nome ||
    usuarioLogado?.user_metadata?.nome ||
    usuarioLogado?.email ||
    'Técnico'
  );
}

function obterPrimeiroNome(nome = '') {
  const texto = String(nome || '').trim();
  if (!texto) return 'Técnico';
  return texto.split(/\s+/)[0] || texto;
}

function formatarResumoAcesso(acesso) {
  if (!acesso) {
    return {
      texto: 'Verificando acesso',
      detalhe: 'Aguarde a validação da conta',
      cor: '#64748b',
      fundo: '#f1f5f9',
      icone: 'sync',
    };
  }

  if (acesso.status === 'ativo') {
    return {
      texto: 'Assinatura ativa',
      detalhe: 'Recursos liberados',
      cor: '#087f3a',
      fundo: '#e7f7ee',
      icone: 'shield-checkmark',
    };
  }

  if (acesso.status === 'trial') {
    const dias = acesso.diasRestantes ?? 0;
    return {
      texto: 'Teste grátis',
      detalhe: dias + ' dia(s) restante(s)',
      cor: dias <= 5 ? '#b45309' : '#1f7ae0',
      fundo: dias <= 5 ? '#fff7e6' : '#eaf3ff',
      icone: 'time',
    };
  }

  return {
    texto: 'Acesso expirado',
    detalhe: 'Assine para continuar',
    cor: '#b42318',
    fundo: '#fff1f0',
    icone: 'lock-closed',
  };
}

function chaveServico(registro = {}) {
  return String(registro.numero_pedido || registro.pedido_id || registro.id || '').trim();
}

function normalizarStatus(valor) {
  return String(valor || '').trim().toLowerCase();
}

function visitaConcluida(visita = {}) {
  return visita.finalizado === true || ['enviado', 'finalizado', 'aprovado', 'concluido'].includes(normalizarStatus(visita.status));
}

function visitaEmAndamento(visita = {}) {
  return !visitaConcluida(visita) && ['em andamento', 'andamento', 'iniciado', 'reaberto'].includes(normalizarStatus(visita.status));
}

function dataConclusao(visita = {}) {
  return visita.enviado_em || visita.finalizado_em || visita.updated_at || visita.created_at || null;
}

function dentroDoPeriodo(valor, inicio, fim) {
  if (!valor) return false;
  const tempo = new Date(valor).getTime();
  return Number.isFinite(tempo) && tempo >= inicio.getTime() && tempo < fim.getTime();
}

async function carregarIndicadoresHome({ empresa, tecnicoId, gestor }) {
  let pedidosQuery = supabase
    .from('pedidos')
    .select('id, numero_pedido, status, tecnico_id, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);
  let visitasQuery = supabase
    .from('visitas')
    .select('id, pedido_id, numero_pedido, status, finalizado, tecnico_id, created_at, updated_at, finalizado_em, enviado_em')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (empresa) {
    pedidosQuery = pedidosQuery.eq('empresa', empresa);
    visitasQuery = visitasQuery.eq('empresa', empresa);
  }
  if (!gestor && tecnicoId) {
    pedidosQuery = pedidosQuery.eq('tecnico_id', tecnicoId);
    visitasQuery = visitasQuery.eq('tecnico_id', tecnicoId);
  }

  const [pedidosResposta, visitasResposta] = await Promise.all([pedidosQuery, visitasQuery]);
  if (pedidosResposta.error) throw pedidosResposta.error;
  if (visitasResposta.error) throw visitasResposta.error;

  const pedidos = pedidosResposta.data || [];
  const visitas = visitasResposta.data || [];
  const ultimaVisitaPorServico = new Map();
  for (const visita of visitas) {
    const chave = chaveServico(visita);
    if (chave && !ultimaVisitaPorServico.has(chave)) ultimaVisitaPorServico.set(chave, visita);
  }

  const statusPedidoEncerrado = new Set(['cancelado', 'finalizado', 'concluido', 'aprovado', 'enviado']);
  let pendentes = 0;
  const emAndamento = new Set();

  for (const pedido of pedidos) {
    const chave = chaveServico(pedido);
    const visita = ultimaVisitaPorServico.get(chave);
    if (visitaEmAndamento(visita)) {
      emAndamento.add(chave);
    } else if (!visitaConcluida(visita) && !statusPedidoEncerrado.has(normalizarStatus(pedido.status))) {
      pendentes += 1;
    }
  }
  for (const visita of visitas) {
    if (visitaEmAndamento(visita)) emAndamento.add(chaveServico(visita));
  }

  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioAmanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioProximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  const concluidas = visitas.filter(visitaConcluida);

  return {
    pendentes,
    andamento: emAndamento.size,
    concluidasHoje: concluidas.filter((visita) => dentroDoPeriodo(dataConclusao(visita), inicioHoje, inicioAmanha)).length,
    totalMes: concluidas.filter((visita) => dentroDoPeriodo(dataConclusao(visita), inicioMes, inicioProximoMes)).length,
  };
}

export default function MainScreen({ navigation, usuarioLogado, acessoComercial, configuracaoModular, onLogout, resumoHome = {} }) {
  const nomeTecnico = obterPrimeiroNome(obterNomeTecnico(usuarioLogado));
  const resumoAcesso = formatarResumoAcesso(acessoComercial);
  const papel = usuarioLogado?.tecnico?.papel || usuarioLogado?.papel || 'tecnico';
  const gestor = papel === 'administrador' || papel === 'supervisor';
  const empresa = usuarioLogado?.tecnico?.empresa || usuarioLogado?.empresa || '';
  const tecnicoId = usuarioLogado?.tecnico?.id || usuarioLogado?.tecnico_id || null;
  const [resumoCalculado, setResumoCalculado] = useState(resumoHome || {});

  const atualizarIndicadores = useCallback(async () => {
    try {
      const novoResumo = await carregarIndicadoresHome({ empresa, tecnicoId, gestor });
      setResumoCalculado(novoResumo);
    } catch (erro) {
      console.log('Erro ao atualizar indicadores da tela inicial:', erro?.message || erro);
    }
  }, [empresa, tecnicoId, gestor]);

  useFocusEffect(
    useCallback(() => {
      atualizarIndicadores();
      return undefined;
    }, [atualizarIndicadores])
  );

  const indicadores = [
    {
      titulo: 'Pendentes',
      valor: resumoCalculado?.pendentes ?? 0,
      icone: 'clipboard',
      cor: '#07943f',
      fundo: '#e7f7ee',
    },
    {
      titulo: 'Andamento',
      valor: resumoCalculado?.andamento ?? 0,
      icone: 'briefcase',
      cor: '#f59e0b',
      fundo: '#fff7e6',
    },
    {
      titulo: 'Hoje',
      valor: resumoCalculado?.concluidasHoje ?? 0,
      icone: 'checkmark-circle',
      cor: '#1f7ae0',
      fundo: '#eaf3ff',
    },
    {
      titulo: 'Mês',
      valor: resumoCalculado?.totalMes ?? 0,
      icone: 'calendar',
      cor: '#7c3bbd',
      fundo: '#f1e8fb',
    },
  ];

  const acoesRapidasBase = [
    {
      titulo: 'Iniciar serviço',
      descricao: 'Abrir ordem e checklist',
      icone: 'play-circle',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido' },
      cor: '#087f3a',
      fundo: '#e7f7ee',
    },
    {
      titulo: 'Nova ordem',
      descricao: 'Cadastrar obra ou pedido',
      icone: 'add-circle',
      rota: 'Ordens',
      modulo: MODULOS.ORDENS,
      cor: '#1f7ae0',
      fundo: '#eaf3ff',
    },
    {
      titulo: 'Ocorrência',
      descricao: 'Registrar foto e problema',
      icone: 'warning',
      rota: 'Ocorrências',
      modulo: MODULOS.OCORRENCIAS,
      cor: '#b45309',
      fundo: '#fff7e6',
    },
  ];

  const acoesRapidas = acoesRapidasBase.filter(
    (item) => moduloEstaAtivo(configuracaoModular, item.modulo, papel),
  );

  const atalhosBase = [
    {
      titulo: 'Serviços de campo',
      descricao: 'Executar checklists, salvar visitas e gerar relatórios.',
      icone: 'clipboard',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido' },
      cor: '#07943f',
      fundo: '#e7f7ee',
    },
    {
      titulo: 'Inventário de campo',
      descricao: 'Levantar peças, fotos, quantidades e exportações.',
      icone: 'cube',
      rota: 'Inventário',
      modulo: MODULOS.INVENTARIO,
      cor: '#2563eb',
      fundo: '#eef4ff',
    },
    {
      titulo: 'Ocorrências de obra',
      descricao: 'Registrar problemas, fotos, materiais e solicitações.',
      icone: 'warning',
      rota: 'Ocorrências',
      modulo: MODULOS.OCORRENCIAS,
      cor: '#b45309',
      fundo: '#fff7e6',
    },
    {
      titulo: 'Relatórios',
      descricao: 'Consultar serviços salvos, parciais e finalizados.',
      icone: 'time',
      rota: 'Relatórios',
      modulo: MODULOS.RELATORIOS,
      params: { telaInicial: 'historico' },
      cor: '#0f766e',
      fundo: '#e6fffb',
    },
    {
      titulo: 'Clientes',
      descricao: 'Gerenciar clientes e dados de atendimento.',
      icone: 'people',
      rota: 'Clientes',
      modulo: MODULOS.CLIENTES,
      cor: '#7c3bbd',
      fundo: '#f1e8fb',
    },
    {
      titulo: 'Modelos',
      descricao: 'Criar modelos de checklist por serviço ou equipamento.',
      icone: 'options',
      rota: 'Modelos',
      modulo: MODULOS.CHECKLISTS,
      cor: '#123c69',
      fundo: '#eaf3ff',
    },
    {
      titulo: 'Assinatura',
      descricao: 'Ver teste grátis, plano e status de acesso.',
      icone: 'card',
      rota: 'Assinatura',
      modulo: MODULOS.ASSINATURA,
      cor: '#334155',
      fundo: '#eef2f7',
    },
  ];

  const atalhos = atalhosBase.filter(
    (item) => moduloEstaAtivo(configuracaoModular, item.modulo, papel),
  );

  function navegar(item) {
    navigation.navigate(item.rota, {
      ...(item.params || {}),
      usuarioLogado,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#123c69" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerEyebrow}>FieldCheck Pro</Text>
              <Text style={styles.headerTitle}>Olá, {nomeTecnico}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => abrirSuporteWhatsApp('Olá, preciso de suporte do FieldCheck Pro.')}
                activeOpacity={0.86}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.headerButton} onPress={onLogout} activeOpacity={0.86}>
                <Ionicons name="log-out-outline" size={23} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.accessCard, { backgroundColor: resumoAcesso.fundo }]}
            onPress={gestor ? () => navigation.navigate('Assinatura') : undefined}
            activeOpacity={0.88}
          >
            <View style={[styles.accessIcon, { borderColor: resumoAcesso.cor }]}>
              <Ionicons name={resumoAcesso.icone} size={22} color={resumoAcesso.cor} />
            </View>
            <View style={styles.accessTextBox}>
              <Text style={[styles.accessTitle, { color: resumoAcesso.cor }]}>{resumoAcesso.texto}</Text>
              <Text style={styles.accessSubtitle}>{resumoAcesso.detalhe}</Text>
            </View>
            {gestor ? <Ionicons name="chevron-forward" size={22} color={resumoAcesso.cor} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.logoBlock}>
          <Image source={require('../assets/fieldcheck-icon.png')} style={styles.logo} />
          <Text style={styles.logoTitle}>Checklists, serviços e resultados</Text>
        </View>

        <View style={styles.quickGrid}>
          {acoesRapidas.map((item) => (
            <TouchableOpacity
              key={item.titulo}
              style={styles.quickCard}
              onPress={() => navegar(item)}
              activeOpacity={0.88}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.fundo }]}>
                <Ionicons name={item.icone} size={28} color={item.cor} />
              </View>
              <Text style={styles.quickTitle}>{item.titulo}</Text>
              <Text style={styles.quickDescription}>{item.descricao}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.indicadoresCard}>
          {indicadores.map((item, index) => (
            <View
              key={item.titulo}
              style={[
                styles.indicadorItem,
                index < indicadores.length - 1 && styles.indicadorComDivisor,
              ]}
            >
              <View style={[styles.indicadorIcone, { backgroundColor: item.fundo }]}>
                <Ionicons name={item.icone} size={22} color={item.cor} />
              </View>
              <Text style={styles.indicadorValor}>{item.valor}</Text>
              <Text style={styles.indicadorTitulo}>{item.titulo}</Text>
            </View>
          ))}
        </View>

        <View style={styles.secaoLinha}>
          <View style={styles.secaoBarra} />
          <Text style={styles.secaoTitulo}>Operações</Text>
        </View>

        <View style={styles.listaAtalhos}>
          {atalhos.map((item) => (
            <TouchableOpacity
              key={item.titulo}
              style={styles.cardAtalho}
              activeOpacity={0.88}
              onPress={() => navegar(item)}
            >
              <View style={[styles.cardIcone, { backgroundColor: item.fundo }]}>
                <Ionicons name={item.icone} size={28} color={item.cor} />
              </View>

              <View style={styles.cardTextoBox}>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                <Text style={styles.cardDescricao}>{item.descricao}</Text>
              </View>

              <Ionicons name="chevron-forward" size={25} color={item.cor} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  scrollContent: {
    paddingBottom: 22,
    backgroundColor: '#f4f7fb',
  },
  header: {
    backgroundColor: '#123c69',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerEyebrow: {
    color: '#c7d5e0',
    fontSize: 13,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  accessCard: {
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 11,
  },
  accessTextBox: {
    flex: 1,
  },
  accessTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  accessSubtitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  logoBlock: {
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  logo: {
    width: 166,
    height: 96,
    resizeMode: 'contain',
  },
  logoTitle: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 5,
  },
  quickGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
  },
  quickCard: {
    flex: 1,
    minHeight: 142,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    color: '#062a66',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 9,
  },
  quickDescription: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 3,
  },
  indicadoresCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 14,
    marginBottom: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  indicadorItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  indicadorComDivisor: {
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  indicadorIcone: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  indicadorValor: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
  },
  indicadorTitulo: {
    marginTop: 2,
    color: '#475467',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
  secaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  secaoBarra: {
    width: 5,
    height: 28,
    borderRadius: 99,
    backgroundColor: '#38b44a',
    marginRight: 10,
  },
  secaoTitulo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  listaAtalhos: {
    gap: 10,
    paddingHorizontal: 14,
  },
  cardAtalho: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardIcone: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  cardTextoBox: {
    flex: 1,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#062a66',
    marginBottom: 3,
  },
  cardDescricao: {
    fontSize: 14,
    color: '#667085',
    lineHeight: 19,
    fontWeight: '600',
  },
});
