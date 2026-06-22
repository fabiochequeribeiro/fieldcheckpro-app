import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { supabase } from '../supabase';
import { comTempoLimite } from '../utils/tempoLimite';

const TABELA_ASSINATURAS = 'assinaturas_empresas';
const DIAS_TESTE_GRATIS = 30;
const STORAGE_PREFIX = '@fieldcheck_trial_empresa_';
export const GOOGLE_PLAY_SUBSCRIPTION_ID = 'fieldcheck_pro';

function agora() {
  return new Date();
}

function somarDias(data, dias) {
  const base = new Date(data);
  base.setDate(base.getDate() + dias);
  return base;
}

function paraIso(data) {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizarEmpresa(valor) {
  const texto = String(valor || '').trim();
  return texto || 'Conta individual';
}

function chaveEmpresa(empresa) {
  return normalizarEmpresa(empresa)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'conta_individual';
}

function calcularDiasRestantes(dataFim) {
  const fim = dataFim ? new Date(dataFim) : null;
  if (!fim || Number.isNaN(fim.getTime())) return 0;
  const diff = fim.getTime() - agora().getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function montarAcesso(registro, origem, empresa) {
  const hoje = agora();
  const statusAssinatura = String(registro?.status_assinatura || 'trial').toLowerCase();
  const trialFim = paraIso(registro?.trial_fim);
  const assinaturaExpiraEm = paraIso(registro?.assinatura_expira_em);
  const assinaturaAtiva =
    statusAssinatura === 'ativo' &&
    assinaturaExpiraEm &&
    new Date(assinaturaExpiraEm).getTime() >= hoje.getTime();
  const trialAtivo = trialFim && new Date(trialFim).getTime() >= hoje.getTime();

  if (assinaturaAtiva) {
    return {
      liberado: true,
      status: 'ativo',
      origem,
      empresa,
      plano: registro?.plano || 'fieldcheck_pro',
      diasRestantes: calcularDiasRestantes(assinaturaExpiraEm),
      trialFim,
      assinaturaExpiraEm,
      mensagem: 'Assinatura ativa.',
    };
  }

  if (trialAtivo) {
    const diasRestantes = calcularDiasRestantes(trialFim);
    return {
      liberado: true,
      status: 'trial',
      origem,
      empresa,
      plano: registro?.plano || 'trial_30_dias',
      diasRestantes,
      trialFim,
      assinaturaExpiraEm,
      mensagem: 'Teste grátis ativo: ' + diasRestantes + ' dia(s) restante(s).',
    };
  }

  return {
    liberado: false,
    status: statusAssinatura === 'ativo' ? 'expirado' : statusAssinatura || 'expirado',
    origem,
    empresa,
    plano: registro?.plano || 'trial_30_dias',
    diasRestantes: 0,
    trialFim,
    assinaturaExpiraEm,
    mensagem: 'Teste grátis encerrado. Assine para continuar usando o FieldCheck Pro.',
  };
}

function montarRegistroInicial(empresa) {
  const inicio = agora();
  const fim = somarDias(inicio, DIAS_TESTE_GRATIS);
  return {
    empresa,
    status_assinatura: 'trial',
    plano: 'trial_30_dias',
    trial_inicio: inicio.toISOString(),
    trial_fim: fim.toISOString(),
    assinatura_expira_em: null,
    limite_tecnicos: 1,
    google_product_id: GOOGLE_PLAY_SUBSCRIPTION_ID,
  };
}

async function carregarRegistroLocal(empresa) {
  const key = STORAGE_PREFIX + chaveEmpresa(empresa);
  const existente = await AsyncStorage.getItem(key);
  if (existente) return JSON.parse(existente);

  const novo = montarRegistroInicial(empresa);
  await AsyncStorage.setItem(key, JSON.stringify(novo));
  return novo;
}

async function carregarRegistroRemoto(empresa) {
  const { data, error } = await supabase
    .from(TABELA_ASSINATURAS)
    .select('*')
    .eq('empresa', empresa)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const novo = montarRegistroInicial(empresa);
  const { data: criado, error: erroCriar } = await supabase
    .from(TABELA_ASSINATURAS)
    .insert(novo)
    .select('*')
    .single();

  if (erroCriar) throw erroCriar;
  return criado;
}

export async function verificarAcessoComercial(usuarioLogado) {
  const empresa = normalizarEmpresa(
    usuarioLogado?.tecnico?.empresa ||
    usuarioLogado?.empresa ||
    usuarioLogado?.email,
  );

  try {
    const remoto = await comTempoLimite(carregarRegistroRemoto(empresa), 6000, 'A assinatura demorou mais que o esperado.');
    return montarAcesso(remoto, 'supabase', empresa);
  } catch (erro) {
    console.log('Assinatura: usando controle local temporário:', erro?.message || erro);
    const local = await carregarRegistroLocal(empresa);
    return montarAcesso(local, 'local', empresa);
  }
}

export async function abrirGerenciamentoAssinatura() {
  const url =
    'https://play.google.com/store/account/subscriptions?package=com.fabio.fieldcheckpro';
  const podeAbrir = await Linking.canOpenURL(url);
  if (podeAbrir) {
    await Linking.openURL(url);
  }
}
