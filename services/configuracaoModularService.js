import { supabase } from '../supabase';
import { normalizarConfiguracaoModular } from '../shared/modulosFieldCheck';

export async function carregarConfiguracaoModular(empresa) {
  const empresaNormalizada = String(empresa || '').trim();
  if (!empresaNormalizada) return normalizarConfiguracaoModular();

  try {
    const { data, error } = await supabase
      .from('empresas_configuracoes')
      .select('setor,modulos_ativos,rotulos,permissoes,recursos,ativo')
      .eq('empresa', empresaNormalizada)
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw error;
    return normalizarConfiguracaoModular({ ...(data || {}), origem: data ? 'supabase' : 'padrao_local' });
  } catch (erro) {
    console.log('Configuração modular ainda não publicada; usando padrão compatível.', erro?.message || erro);
    return normalizarConfiguracaoModular();
  }
}

