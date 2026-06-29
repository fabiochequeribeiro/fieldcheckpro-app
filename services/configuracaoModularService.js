import { supabase } from '../supabase';
import { normalizarConfiguracaoModular } from '../shared/modulosFieldCheck';

function normalizarEntradaEmpresa(entrada) {
  if (typeof entrada === 'object' && entrada !== null) {
    return {
      empresaId: entrada.empresaId || entrada.empresa_id || '',
      empresa: String(entrada.empresa || '').trim(),
    };
  }
  return { empresaId: '', empresa: String(entrada || '').trim() };
}

export async function carregarConfiguracaoModular(entrada) {
  const { empresaId, empresa } = normalizarEntradaEmpresa(entrada);
  if (!empresaId && !empresa) return normalizarConfiguracaoModular();

  try {
    let query = supabase
      .from('empresas_configuracoes')
      .select('setor,modulos_ativos,rotulos,permissoes,recursos,ativo')
      .eq('ativo', true);
    query = empresaId ? query.eq('empresa_id', empresaId) : query.eq('empresa', empresa);
    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return normalizarConfiguracaoModular({ ...(data || {}), origem: data ? 'supabase' : 'padrao_local' });
  } catch (erro) {
    console.log('Configuração modular ainda não publicada; usando padrão compatível.', erro?.message || erro);
    return normalizarConfiguracaoModular();
  }
}
