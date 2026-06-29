import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const STORAGE_FEEDBACK_QUEUE = '@fieldcheck_beta_feedback_queue';

async function readQueue() {
  try {
    return JSON.parse(await AsyncStorage.getItem(STORAGE_FEEDBACK_QUEUE) || '[]');
  } catch (_error) {
    return [];
  }
}

async function writeQueue(queue) {
  await AsyncStorage.setItem(STORAGE_FEEDBACK_QUEUE, JSON.stringify(queue));
}

export async function salvarFeedbackBeta(feedback) {
  const payload = {
    id: feedback.id || `feedback-${Date.now()}`,
    nota: Number(feedback.nota || 0),
    modulo: feedback.modulo || '',
    comentario: feedback.comentario || '',
    dificuldade: feedback.dificuldade || '',
    sugestao: feedback.sugestao || '',
    tags: feedback.tags || [],
    empresa: feedback.empresa || '',
    empresa_id: feedback.empresa_id || null,
    usuario_id: feedback.usuario_id || null,
    usuario: feedback.usuario || '',
    versao_app: feedback.versao_app || '1.0.7',
    trial_status: feedback.trial_status || '',
    created_at: new Date().toISOString(),
    sync_status: 'pendente',
  };

  try {
    const { error } = await supabase.from('beta_feedback').insert(payload);
    if (error) throw error;
    return { ...payload, sync_status: 'sincronizado' };
  } catch (error) {
    const queue = await readQueue();
    await writeQueue([{ ...payload, last_error: error?.message || 'offline' }, ...queue].slice(0, 100));
    return { ...payload, sync_status: 'local', last_error: error?.message || 'offline' };
  }
}

export async function sincronizarFeedbacksPendentes() {
  const queue = await readQueue();
  if (!queue.length) return { sent: 0, pending: 0 };
  const pending = [];
  let sent = 0;
  for (const item of queue) {
    try {
      const { error } = await supabase.from('beta_feedback').insert({ ...item, sync_status: 'sincronizado' });
      if (error) throw error;
      sent += 1;
    } catch (error) {
      pending.push({ ...item, last_error: error?.message || 'offline' });
    }
  }
  await writeQueue(pending);
  return { sent, pending: pending.length };
}

export async function contarFeedbacksPendentes() {
  return (await readQueue()).length;
}
