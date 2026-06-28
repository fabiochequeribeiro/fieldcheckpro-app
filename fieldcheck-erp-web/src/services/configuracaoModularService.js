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

export async function carregarConfiguracaoModularPortal(entrada) {
  const { empresaId, empresa } = normalizarEntradaEmpresa(entrada);
  if (!empresaId && !empresa) return normalizarConfiguracaoModular();

  let query = supabase
    .from('empresas_configuracoes')
    .select('setor,modulos_ativos,rotulos,permissoes,recursos,ativo')
    .eq('ativo', true);

  query = empresaId ? query.eq('empresa_id', empresaId) : query.eq('empresa', empresa);
  const { data, error } = await query.maybeSingle();

  if (error) return normalizarConfiguracaoModular();
  return normalizarConfiguracaoModular({ ...(data || {}), origem: data ? 'supabase' : 'padrao_local' });
}

export async function salvarConfiguracaoModularPortal(entrada, configuracao) {
  const { empresaId, empresa } = normalizarEntradaEmpresa(entrada);
  const payload = normalizarConfiguracaoModular(configuracao);
  const dados = {
    setor: payload.setor,
    modulos_ativos: payload.modulos_ativos,
    rotulos: payload.rotulos,
    permissoes: payload.permissoes,
    recursos: payload.recursos,
  };
  const { data, error } = await supabase
    .from('empresas_configuracoes')
    .upsert({ empresa, empresa_id: empresaId || null, ...dados, ativo: true, atualizado_em: new Date().toISOString() }, { onConflict: empresaId ? 'empresa_id' : 'empresa' })
    .select('setor,modulos_ativos,rotulos,permissoes,recursos,ativo')
    .single();
  if (error) throw error;
  return normalizarConfiguracaoModular({ ...data, origem: 'supabase' });
}
