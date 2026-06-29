import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const STORAGE_TRIAL_ACCESS = '@fieldcheck_trial_access_v1';
const STORAGE_TRIAL_EXTENSION_REQUESTS = '@fieldcheck_trial_extension_requests_v1';
const DEFAULT_TRIAL_DAYS = 30;
const WARNING_DAYS = 7;

const BLOCKED_STATUSES = new Set(['trial_expired', 'suspended', 'cancelled']);
const ACTIVE_STATUSES = new Set(['active_trial', 'trial_expiring', 'extended_trial', 'active_paid']);

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDate(value, fallback = new Date()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function diffDays(from, to) {
  return Math.ceil((parseDate(to).getTime() - parseDate(from).getTime()) / (24 * 60 * 60 * 1000));
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

async function getServerNow() {
  try {
    const { data, error } = await supabase.rpc('get_server_time');
    if (!error && data) return { now: parseDate(Array.isArray(data) ? data[0] : data), source: 'supabase_rpc' };
  } catch (_error) {
    // Optional RPC. See docs/TRIAL_ACCESS_SQL.md.
  }
  return { now: new Date(), source: 'device_fallback' };
}

function normalizeTrial(raw = {}, usuario = {}, nowInfo = { now: new Date(), source: 'device_fallback' }) {
  const now = parseDate(nowInfo.now);
  const empresaId = raw.empresa_id || usuario?.tecnico?.empresa_id || usuario?.empresa_id || null;
  const start = parseDate(raw.trial_start || raw.trialStart || now, now);
  const end = parseDate(raw.trial_end || raw.trialEnd || addDays(start, DEFAULT_TRIAL_DAYS), addDays(start, DEFAULT_TRIAL_DAYS));
  const planStatus = normalizeStatus(raw.plan_status || raw.planStatus);
  const trialStatusRaw = normalizeStatus(raw.trial_status || raw.trialStatus || raw.status);
  const daysRemaining = Math.max(0, diffDays(now, end));
  const expiredByDate = now.getTime() > end.getTime();

  let accessStatus = trialStatusRaw || 'active_trial';
  if (planStatus === 'active_paid' || trialStatusRaw === 'active_paid') {
    accessStatus = 'active_paid';
  } else if (['suspended', 'cancelled'].includes(planStatus)) {
    accessStatus = planStatus;
  } else if (trialStatusRaw === 'extended_trial') {
    accessStatus = expiredByDate ? 'trial_expired' : 'extended_trial';
  } else if (expiredByDate || trialStatusRaw === 'trial_expired') {
    accessStatus = 'trial_expired';
  } else if (daysRemaining <= WARNING_DAYS) {
    accessStatus = 'trial_expiring';
  } else if (!ACTIVE_STATUSES.has(accessStatus)) {
    accessStatus = 'active_trial';
  }

  const modules = raw.modules_enabled || raw.modulesEnabled || [
    'execucao_campo',
    'ordens',
    'inventario',
    'ocorrencias',
    'relatorios',
    'checklists',
    'clientes',
    'ia',
    'assinatura',
  ];

  return {
    empresa_id: empresaId,
    empresa: raw.empresa || raw.nome || usuario?.tecnico?.empresa || usuario?.empresa || 'Conta individual',
    usuario_id: usuario?.id || usuario?.tecnico?.user_id || null,
    trial_start: start.toISOString(),
    trial_end: end.toISOString(),
    trial_status: accessStatus,
    plan_status: planStatus || (accessStatus === 'active_paid' ? 'active_paid' : 'trial'),
    beta_plan: raw.beta_plan || raw.betaPlan || 'Beta 2.0 - Inteligencia Operacional',
    modules_enabled: Array.isArray(modules) ? modules : Object.keys(modules || {}).filter((key) => modules[key]),
    days_remaining: daysRemaining,
    is_expired: BLOCKED_STATUSES.has(accessStatus),
    blocks_app: BLOCKED_STATUSES.has(accessStatus),
    should_warn: accessStatus === 'trial_expiring',
    access_allowed: !BLOCKED_STATUSES.has(accessStatus),
    server_time_source: nowInfo.source,
    source: raw.source || 'fallback',
  };
}

async function readLocalFallback(usuario, nowInfo) {
  const saved = await AsyncStorage.getItem(STORAGE_TRIAL_ACCESS);
  if (saved) return normalizeTrial(JSON.parse(saved), usuario, nowInfo);
  const start = nowInfo.now || new Date();
  const trial = normalizeTrial({
    trial_start: start.toISOString(),
    trial_end: addDays(start, DEFAULT_TRIAL_DAYS).toISOString(),
    trial_status: 'active_trial',
    source: 'local_fallback',
  }, usuario, nowInfo);
  await AsyncStorage.setItem(STORAGE_TRIAL_ACCESS, JSON.stringify(trial));
  return trial;
}

async function queryTrialByEmpresa(empresaId) {
  if (!empresaId) return null;
  const selectors = [
    { table: 'beta_program', select: 'empresa_id,empresa,trial_start,trial_end,trial_status,plan_status,beta_plan,modules_enabled' },
    { table: 'beta_program', select: 'empresa_id,empresa,trial_start,trial_end,trial_status,beta_plan,modules_enabled' },
    { table: 'empresas', select: 'id,nome,trial_start,trial_end,trial_status,plan_status,beta_plan,modules_enabled' },
    { table: 'profiles', select: 'empresa_id,empresa,trial_start,trial_end,trial_status,plan_status,beta_plan,modules_enabled' },
  ];

  for (const config of selectors) {
    try {
      const field = config.table === 'empresas' ? 'id' : 'empresa_id';
      const { data, error } = await supabase
        .from(config.table)
        .select(config.select)
        .eq(field, empresaId)
        .maybeSingle();
      if (!error && data) return { ...data, empresa_id: data.empresa_id || data.id || empresaId, source: config.table };
    } catch (_error) {
      // Tables are optional during beta rollout.
    }
  }
  return null;
}

export async function getTrialStatus(user) {
  const nowInfo = await getServerNow();
  const empresaId = user?.tecnico?.empresa_id || user?.empresa_id || null;
  try {
    const remote = await queryTrialByEmpresa(empresaId);
    if (remote) {
      const trial = normalizeTrial(remote, user, nowInfo);
      await AsyncStorage.setItem(STORAGE_TRIAL_ACCESS, JSON.stringify(trial));
      return trial;
    }
  } catch (error) {
    console.log('Trial remoto indisponivel:', error?.message || error);
  }
  return readLocalFallback(user, nowInfo);
}

export function isAccessAllowed(company) {
  return !BLOCKED_STATUSES.has(normalizeStatus(company?.trial_status));
}

export function getRemainingTrialDays(company) {
  return Math.max(0, Number(company?.days_remaining || 0));
}

export function shouldShowTrialWarning(company) {
  return normalizeStatus(company?.trial_status) === 'trial_expiring' || Number(company?.days_remaining || 99) <= WARNING_DAYS;
}

export function isModuleEnabled(company, moduleName) {
  if (!moduleName) return true;
  const enabled = company?.modules_enabled;
  if (!enabled) return true;
  if (Array.isArray(enabled) && enabled.length === 0) return true;
  if (Array.isArray(enabled)) return enabled.map((item) => String(item).toLowerCase()).includes(String(moduleName).toLowerCase());
  return enabled[moduleName] !== false;
}

export async function requestTrialExtension(user, days = 15, reason = '') {
  const request = {
    id: `trial-extension-${Date.now()}`,
    empresa_id: user?.tecnico?.empresa_id || user?.empresa_id || null,
    usuario_id: user?.id || user?.tecnico?.user_id || null,
    usuario: user?.email || user?.tecnico?.email || '',
    empresa: user?.tecnico?.empresa || user?.empresa || '',
    trial_extension_requested: true,
    trial_extension_days: Number(days || 15),
    trial_extension_reason: reason || `Solicitacao de prorrogacao de ${days} dias pelo app`,
    status: 'pendente',
    created_at: new Date().toISOString(),
  };

  const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_TRIAL_EXTENSION_REQUESTS) || '[]');
  await AsyncStorage.setItem(STORAGE_TRIAL_EXTENSION_REQUESTS, JSON.stringify([request, ...saved].slice(0, 50)));

  try {
    const { error } = await supabase.from('beta_extension_requests').insert(request);
    if (error) throw error;
    return { ...request, sync_status: 'sincronizado' };
  } catch (error) {
    return { ...request, sync_status: 'local', last_error: error?.message || 'offline' };
  }
}

export function blockOperationalAccess(reason = 'trial_expired') {
  return {
    blocked: true,
    reason,
    message: 'O acesso operacional esta bloqueado. Os dados permanecem preservados para reativacao.',
  };
}

export const TRIAL_ACCESS_STORAGE_KEY = STORAGE_TRIAL_ACCESS;
