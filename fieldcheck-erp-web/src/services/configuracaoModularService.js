import { supabase } from '../supabase';
import { normalizarConfiguracaoModular } from '../../../shared/modulosFieldCheck';

export async function carregarConfiguracaoModularPortal(empresa) {
  const empresaNormalizada = String(empresa || '').trim();
  if (!empresaNormalizada) return normalizarConfiguracaoModular();

  const { data, error } = await supabase
    .from('empresas_configuracoes')
    .select('setor,modulos_ativos,rotulos,permissoes,recursos,ativo')
    .eq('empresa', empresaNormalizada)
    .eq('ativo', true)
    .maybeSingle();

  if (error) return normalizarConfiguracaoModular();
  return normalizarConfiguracaoModular({ ...(data || {}), origem: data ? 'supabase' : 'padrao_local' });
}

export async function salvarConfiguracaoModularPortal(empresa, configuracao) {
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
    .upsert({ empresa: String(empresa || '').trim(), ...dados, ativo: true, atualizado_em: new Date().toISOString() }, { onConflict: 'empresa' })
    .select('setor,modulos_ativos,rotulos,permissoes,recursos,ativo')
    .single();
  if (error) throw error;
  return normalizarConfiguracaoModular({ ...data, origem: 'supabase' });
}
