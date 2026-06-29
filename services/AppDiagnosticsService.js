import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { contarFeedbacksPendentes, sincronizarFeedbacksPendentes } from './FeedbackService';

const SYNC_KEYS = [
  '@fieldcheck_fila_sincronizacao',
  '@fieldcheck_ocorrencias_fila',
  '@fieldcheck_beta_feedback_queue',
];

async function countJsonArray(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (_error) {
    return 0;
  }
}

export async function carregarDiagnosticoApp(usuario) {
  let online = false;
  try {
    const { error } = await supabase.from('tecnicos').select('id').limit(1);
    online = !error;
  } catch (_error) {
    online = false;
  }

  const keys = await AsyncStorage.getAllKeys();
  const syncCounts = await Promise.all(SYNC_KEYS.map(countJsonArray));
  const pendencias = syncCounts.reduce((sum, value) => sum + value, 0);

  return {
    conexao: online ? 'online' : 'offline',
    usuario: usuario?.email || usuario?.tecnico?.email || '',
    empresa: usuario?.tecnico?.empresa || usuario?.empresa || '',
    versao: '1.0.7',
    pendencias_sync: pendencias,
    feedbacks_pendentes: await contarFeedbacksPendentes(),
    ultimo_sync: await AsyncStorage.getItem('@fieldcheck_last_sync_at') || 'Sem sincronizacao recente',
    armazenamento_local: `${keys.length} chave(s) locais`,
  };
}

export async function tentarSincronizarTudo() {
  const feedback = await sincronizarFeedbacksPendentes();
  await AsyncStorage.setItem('@fieldcheck_last_sync_at', new Date().toISOString());
  return { feedback };
}
