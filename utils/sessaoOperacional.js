let sessaoAtual = {
  empresa: 'FieldCheck Pro',
  empresaId: null,
  papel: 'tecnico',
  perfil: 'tecnico',
  tecnicoId: null,
  usuarioId: null,
};

export function definirSessaoOperacional(usuario = {}) {
  const tecnico = usuario?.tecnico || {};
  sessaoAtual = {
    empresa: tecnico.empresa || usuario.empresa || 'FieldCheck Pro',
    empresaId: tecnico.empresa_id || usuario.empresa_id || null,
    papel: tecnico.papel || usuario.papel || 'tecnico',
    perfil: tecnico.perfil || usuario.perfil || tecnico.papel || usuario.papel || 'tecnico',
    tecnicoId: tecnico.id || null,
    usuarioId: usuario.id || tecnico.user_id || null,
  };
  return sessaoAtual;
}

export function limparSessaoOperacional() {
  sessaoAtual = { empresa: 'FieldCheck Pro', empresaId: null, papel: 'tecnico', perfil: 'tecnico', tecnicoId: null, usuarioId: null };
}

export function obterEmpresaAtual() {
  return sessaoAtual.empresa || 'FieldCheck Pro';
}

export function obterEmpresaAtualId() {
  return sessaoAtual.empresaId || null;
}

export function obterTecnicoAtualId() {
  return sessaoAtual.tecnicoId || null;
}

export function obterUsuarioAtualId() {
  return sessaoAtual.usuarioId || null;
}

export function obterPapelAtual() {
  return sessaoAtual.perfil || sessaoAtual.papel || 'tecnico';
}

export function usuarioPodeGerenciar() {
  return ['super_admin', 'admin_empresa', 'administrador', 'supervisor'].includes(obterPapelAtual());
}
