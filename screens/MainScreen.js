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
import { AiCard, AppButton, AppCard, MetricCard, SectionTitle, SyncStatusBadge } from '../components/fieldcheck/AppComponents';
import { carregarControleBeta, solicitarProrrogacaoBeta } from '../services/BetaProgramService';
import TrialStatusBanner from '../components/fieldcheck/TrialStatusBanner';

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

function saudacaoAtual() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
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

export default function MainScreen({ navigation, usuarioLogado, acessoComercial, configuracaoModular, trialAccess, onLogout, resumoHome = {} }) {
  const nomeTecnico = obterPrimeiroNome(obterNomeTecnico(usuarioLogado));
  const resumoAcesso = formatarResumoAcesso(acessoComercial);
  const papel = usuarioLogado?.tecnico?.perfil || usuarioLogado?.perfil || usuarioLogado?.tecnico?.papel || usuarioLogado?.papel || 'tecnico';
  const gestor = ['super_admin', 'admin_empresa', 'administrador', 'supervisor'].includes(papel);
  const empresa = usuarioLogado?.tecnico?.empresa || usuarioLogado?.empresa || '';
  const tecnicoId = usuarioLogado?.tecnico?.id || usuarioLogado?.tecnico_id || null;
  const [resumoCalculado, setResumoCalculado] = useState(resumoHome || {});
  const [betaProgram, setBetaProgram] = useState(null);

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
      carregarControleBeta(usuarioLogado).then(setBetaProgram).catch(() => null);
      return undefined;
    }, [atualizarIndicadores, usuarioLogado])
  );

  async function pedirProrrogacaoHome() {
    try {
      await solicitarProrrogacaoBeta(usuarioLogado, 15);
      abrirSuporteWhatsApp('Ola, solicitei prorrogacao do Programa Beta FieldCheck Pro por mais 15 dias.');
    } catch (erro) {
      console.log('Erro solicitando prorrogacao beta:', erro?.message || erro);
    }
  }

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
  const totalPendencias = resumoCalculado?.pendentes ?? 0;
  const totalAndamento = resumoCalculado?.andamento ?? 0;
  const totalHoje = resumoCalculado?.concluidasHoje ?? 0;
  const resumoMissao = `Hoje voce possui ${totalHoje} visita(s) concluidas, ${totalPendencias} pendencia(s) e ${totalAndamento} servico(s) em andamento.`;

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
      titulo: 'Entrega Técnica',
      descricao: 'Checklist por equipamento, assinatura, PDF e pendências.',
      icone: 'construct',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido', modulo: 'entrega-tecnica' },
      cor: '#087f3a',
      fundo: '#e7f7ee',
    },
    {
      titulo: 'Manutenção Preventiva',
      descricao: 'Periodicidade, próxima manutenção, fotos e histórico.',
      icone: 'calendar',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido', modulo: 'manutencao-preventiva' },
      cor: '#1f7ae0',
      fundo: '#eaf3ff',
    },
    {
      titulo: 'Manutenção Corretiva',
      descricao: 'Diagnóstico, peças, solução e ação corretiva.',
      icone: 'build',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido', modulo: 'manutencao-corretiva' },
      cor: '#b45309',
      fundo: '#fff7e6',
    },
    {
      titulo: 'Auditorias',
      descricao: 'Conformidade, evidências, pontuação e plano de ação.',
      icone: 'shield-checkmark',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido', modulo: 'auditorias' },
      cor: '#7c3bbd',
      fundo: '#f1e8fb',
    },
    {
      titulo: 'Segurança do Trabalho',
      descricao: 'EPI, riscos, gravidade, responsável, prazo e fotos.',
      icone: 'warning',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido', modulo: 'seguranca-do-trabalho' },
      cor: '#b42318',
      fundo: '#fff1f0',
    },
    {
      titulo: 'Repositor',
      descricao: 'Loja, setor, prateleira, validade, ruptura e foto.',
      icone: 'storefront',
      rota: 'Serviços',
      modulo: MODULOS.EXECUCAO_CAMPO,
      params: { telaInicial: 'pedido', modulo: 'repositor' },
      cor: '#0f766e',
      fundo: '#e6fffb',
    },
    {
      titulo: 'IA Assistente',
      descricao: 'Resumo inteligente, sugestão de checklist e pendências.',
      icone: 'sparkles',
      rota: 'IA',
      modulo: null,
      cor: '#7c3aed',
      fundo: '#f3eafd',
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
    (item) => !item.modulo || moduloEstaAtivo(configuracaoModular, item.modulo, papel),
  );

  function navegar(item) {
    navigation.navigate(item.rota, {
      ...(item.params || {}),
      usuarioLogado,
    });
  }

  function falarComercial() {
    abrirSuporteWhatsApp('Ola, quero receber uma proposta comercial do FieldCheck Pro.');
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
          <Image source={require('../assets/fieldcheckpro-icon.png')} style={styles.logo} />
          <Text style={styles.logoTitle}>Mission Control do técnico</Text>
        </View>

        <View style={styles.betaWrap}>
          <TrialStatusBanner
            trial={trialAccess || betaProgram}
            onExtension={pedirProrrogacaoHome}
            onWhatsApp={() => abrirSuporteWhatsApp('Ola, quero falar sobre meu periodo de teste do FieldCheck Pro.')}
            onProposal={falarComercial}
          />
        </View>

        <View style={styles.missionWrap}>
          <AppCard style={styles.missionCard}>
            <Text style={styles.missionEyebrow}>FieldCheck Pro</Text>
            <Text style={styles.missionTitle}>{saudacaoAtual()}, {nomeTecnico}. Tudo pronto para o trabalho.</Text>
            <Text style={styles.missionText}>{resumoMissao}</Text>
            <View style={styles.missionMetaRow}>
              <Text style={styles.missionCompany}>{empresa || 'Empresa não informada'}</Text>
              <SyncStatusBadge status="sincronizado" />
            </View>
            <View style={styles.missionActions}>
              <AppButton title="Continuar serviço" icon="play" onPress={() => navigation.navigate('Serviços', { telaInicial: 'historico', usuarioLogado })} />
              <AppButton title="Iniciar nova visita" icon="add-circle" variant="secondary" onPress={() => navigation.navigate('Serviços', { telaInicial: 'pedido', usuarioLogado })} />
            </View>
          </AppCard>
        </View>

        <View style={styles.aiCommandWrap}>
          <AiCard
            title="Assistente FieldCheck"
            description="Gerar resumo inteligente, sugerir checklist, revisar pendências e preparar relatório."
            onPress={() => navigation.navigate('IA', { usuarioLogado })}
          />
          <View style={styles.syncRow}>
            <SyncStatusBadge status="local" />
            <SyncStatusBadge status="pendente" />
          </View>
          <View style={styles.aiActionRow}>
            <AppButton title="Resumo IA" icon="document-text" variant="secondary" onPress={() => navigation.navigate('IA', { usuarioLogado })} />
            <AppButton title="Sugerir checklist" icon="list-circle" variant="secondary" onPress={() => navigation.navigate('IA', { usuarioLogado })} />
          </View>
        </View>

        <View style={styles.betaWrap}>
          <AppCard style={styles.betaCard}>
            <Text style={styles.betaEyebrow}>Programa Beta ativo</Text>
            <Text style={styles.betaTitle}>{betaProgram?.days_remaining ?? '-'} dia(s) restantes</Text>
            <Text style={styles.betaText}>Teste o FieldCheck Pro 2.0 com checklists, fotos, assinatura, PDF, offline e IA Assistente.</Text>
            <View style={styles.betaActions}>
              <AppButton title="Enviar feedback" icon="chatbox-ellipses" onPress={() => navigation.navigate('Feedback', { usuarioLogado })} />
              <AppButton title="Solicitar prorrogação" icon="time" variant="secondary" onPress={pedirProrrogacaoHome} />
              <AppButton title="Programa Beta" icon="flask" variant="secondary" onPress={() => navigation.navigate('Programa Beta', { usuarioLogado })} />
            </View>
          </AppCard>
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

        <View style={styles.metricGrid}>
          <MetricCard label="Visitas hoje" value={resumoCalculado?.concluidasHoje ?? 0} icon="calendar" tone="blue" />
          <MetricCard label="Pendências" value={resumoCalculado?.pendentes ?? 0} icon="alert-circle" tone="amber" />
        </View>
        <View style={styles.metricGrid}>
          <MetricCard label="Em andamento" value={resumoCalculado?.andamento ?? 0} icon="briefcase" tone="purple" />
          <MetricCard label="Concluídos" value={resumoCalculado?.totalMes ?? 0} icon="checkmark-circle" tone="green" />
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
  missionWrap: {
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  missionCard: {
    gap: 8,
  },
  missionEyebrow: {
    color: '#087f3a',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  missionTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  missionText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  missionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  missionCompany: {
    color: '#123c69',
    fontSize: 13,
    fontWeight: '900',
  },
  missionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  aiCommandWrap: {
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },
  syncRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  betaWrap: {
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  betaCard: {
    gap: 8,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
  },
  betaEyebrow: {
    color: '#087f3a',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  betaTitle: {
    color: '#123c69',
    fontSize: 20,
    fontWeight: '900',
  },
  betaText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  betaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
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
