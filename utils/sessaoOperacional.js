let sessaoAtual = {
  empresa: 'FieldCheck',
  papel: 'tecnico',
  tecnicoId: null,
  usuarioId: null,
};

export function definirSessaoOperacional(usuario = {}) {
  const tecnico = usuario?.tecnico || {};
  sessaoAtual = {
    empresa: tecnico.empresa || usuario.empresa || 'FieldCheck',
    papel: tecnico.papel || usuario.papel || 'tecnico',
    tecnicoId: tecnico.id || null,
    usuarioId: usuario.id || tecnico.user_id || null,
  };
  return sessaoAtual;
}

export function limparSessaoOperacional() {
  sessaoAtual = { empresa: 'FieldCheck', papel: 'tecnico', tecnicoId: null, usuarioId: null };
}

export function obterEmpresaAtual() {
  return sessaoAtual.empresa || 'FieldCheck';
}

export function obterTecnicoAtualId() {
  return sessaoAtual.tecnicoId || null;
}

export function obterUsuarioAtualId() {
  return sessaoAtual.usuarioId || null;
}

export function obterPapelAtual() {
  return sessaoAtual.papel || 'tecnico';
}

export function usuarioPodeGerenciar() {
  return ['administrador', 'supervisor'].includes(obterPapelAtual());
}
