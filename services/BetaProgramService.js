import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { getTrialStatus, requestTrialExtension } from './trialAccessService';

const STORAGE_BETA = '@fieldcheck_beta_program_v2';
const STORAGE_EXTENSION_REQUESTS = '@fieldcheck_beta_extension_requests';
const DEFAULT_BETA_DAYS = 30;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function safeDate(value, fallback = new Date()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function daysBetween(start, end) {
  const diff = safeDate(end).getTime() - safeDate(start).getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function normalizeBeta(raw = {}, usuario = {}) {
  const now = new Date();
  const start = safeDate(raw.trial_start || raw.trialStart || now, now);
  const end = safeDate(raw.trial_end || raw.trialEnd || addDays(start, DEFAULT_BETA_DAYS), addDays(start, DEFAULT_BETA_DAYS));
  const status = String(raw.trial_status || raw.trialStatus || raw.status || '').toLowerCase();
  const expired = now.getTime() > end.getTime();
  const activeStatus = expired && !['active', 'ativo', 'paid', 'comprado', 'prorrogado'].includes(status)
    ? 'vencido'
    : (status || 'ativo');

  return {
    trial_start: start.toISOString(),
    trial_end: end.toISOString(),
    trial_status: activeStatus,
    beta_plan: raw.beta_plan || raw.betaPlan || 'Beta 2.0 - Inteligencia Operacional',
    modules_enabled: raw.modules_enabled || raw.modulesEnabled || [
      'Checklists',
      'Fotos',
      'Assinaturas',
      'PDF',
      'Historico',
      'Offline',
      'FieldCheck AI',
    ],
    empresa: raw.empresa || usuario?.tecnico?.empresa || usuario?.empresa || 'Conta individual',
    usuario: raw.usuario || usuario?.email || usuario?.tecnico?.email || '',
    source: raw.source || 'local',
    days_remaining: Math.max(0, daysBetween(now, end)),
    is_expired: activeStatus === 'vencido',
    blocks_app: activeStatus === 'vencido',
  };
}

async function readLocalBeta(usuario) {
  const saved = await AsyncStorage.getItem(STORAGE_BETA);
  if (saved) return normalizeBeta(JSON.parse(saved), usuario);
  const start = new Date();
  const beta = normalizeBeta({
    trial_start: start.toISOString(),
    trial_end: addDays(start, DEFAULT_BETA_DAYS).toISOString(),
    trial_status: 'ativo',
    source: 'local',
  }, usuario);
  await AsyncStorage.setItem(STORAGE_BETA, JSON.stringify(beta));
  return beta;
}

export async function carregarControleBeta(usuario) {
  try {
    const trial = await getTrialStatus(usuario);
    return {
      ...trial,
      beta_plan: trial.beta_plan || 'Beta 2.0 - Inteligencia Operacional',
      is_expired: trial.blocks_app,
      source: trial.source || 'trialAccessService',
    };
  } catch (error) {
    console.log('Controle trial indisponivel, usando compatibilidade beta:', error?.message || error);
  }
  try {
    const empresaId = usuario?.tecnico?.empresa_id || usuario?.empresa_id || null;
    if (empresaId) {
      const { data, error } = await supabase
        .from('beta_program')
        .select('trial_start,trial_end,trial_status,beta_plan,modules_enabled,empresa')
        .eq('empresa_id', empresaId)
        .maybeSingle();
      if (!error && data) {
        const beta = normalizeBeta({ ...data, source: 'supabase' }, usuario);
        await AsyncStorage.setItem(STORAGE_BETA, JSON.stringify(beta));
        return beta;
      }
    }
  } catch (error) {
    console.log('Controle beta usando fallback local:', error?.message || error);
  }
  return readLocalBeta(usuario);
}

export async function solicitarProrrogacaoBeta(usuario, dias = 15) {
  try {
    return await requestTrialExtension(usuario, dias);
  } catch (error) {
    console.log('Pedido via trialAccessService indisponivel:', error?.message || error);
  }
  const request = {
    id: `beta-extension-${Date.now()}`,
    dias,
    usuario: usuario?.email || usuario?.tecnico?.email || '',
    empresa: usuario?.tecnico?.empresa || usuario?.empresa || '',
    status: 'pendente',
    created_at: new Date().toISOString(),
  };
  const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_EXTENSION_REQUESTS) || '[]');
  await AsyncStorage.setItem(STORAGE_EXTENSION_REQUESTS, JSON.stringify([request, ...saved].slice(0, 30)));
  try {
    await supabase.from('beta_extension_requests').insert(request);
  } catch (error) {
    console.log('Pedido de prorrogacao salvo localmente:', error?.message || error);
  }
  return request;
}

export async function marcarOnboardingBetaVisto() {
  await AsyncStorage.setItem('@fieldcheck_onboarding_beta_v2_seen', 'true');
}

export async function onboardingBetaFoiVisto() {
  return (await AsyncStorage.getItem('@fieldcheck_onboarding_beta_v2_seen')) === 'true';
}
