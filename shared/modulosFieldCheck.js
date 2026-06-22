export const MODULOS = {
  DASHBOARD: 'dashboard',
  ORDENS: 'ordens',
  EXECUCAO_CAMPO: 'execucao_campo',
  CHECKLISTS: 'checklists',
  OCORRENCIAS: 'ocorrencias',
  INVENTARIO: 'inventario',
  CLIENTES: 'clientes',
  RELATORIOS: 'relatorios',
  EQUIPE: 'equipe',
  APROVACOES: 'aprovacoes',
  AUDITORIA: 'auditoria',
  ASSINATURA: 'assinatura',
};

export const CATALOGO_MODULOS = {
  [MODULOS.DASHBOARD]: { nome: 'Visão geral', nucleo: true },
  [MODULOS.ORDENS]: { nome: 'Ordens de serviço' },
  [MODULOS.EXECUCAO_CAMPO]: { nome: 'Serviços de campo', nucleo: true },
  [MODULOS.CHECKLISTS]: { nome: 'Modelos de checklist' },
  [MODULOS.OCORRENCIAS]: { nome: 'Ocorrências' },
  [MODULOS.INVENTARIO]: { nome: 'Inventário de campo' },
  [MODULOS.CLIENTES]: { nome: 'Clientes' },
  [MODULOS.RELATORIOS]: { nome: 'Relatórios', nucleo: true },
  [MODULOS.EQUIPE]: { nome: 'Equipe e permissões' },
  [MODULOS.APROVACOES]: { nome: 'Aprovações' },
  [MODULOS.AUDITORIA]: { nome: 'Auditoria' },
  [MODULOS.ASSINATURA]: { nome: 'Plano e assinatura' },
};

const BASE_OPERACIONAL = [
  MODULOS.DASHBOARD,
  MODULOS.ORDENS,
  MODULOS.EXECUCAO_CAMPO,
  MODULOS.CHECKLISTS,
  MODULOS.OCORRENCIAS,
  MODULOS.CLIENTES,
  MODULOS.RELATORIOS,
  MODULOS.EQUIPE,
  MODULOS.APROVACOES,
  MODULOS.AUDITORIA,
  MODULOS.ASSINATURA,
];

export const PRESETS_SETORES = {
  construcao_civil: {
    nome: 'Construção civil',
    modulos: [...BASE_OPERACIONAL, MODULOS.INVENTARIO],
  },
  manutencao_industrial: {
    nome: 'Manutenção industrial',
    modulos: [...BASE_OPERACIONAL, MODULOS.INVENTARIO],
  },
  repositor_varejo: {
    nome: 'Repositor / varejo',
    modulos: [
      MODULOS.DASHBOARD,
      MODULOS.ORDENS,
      MODULOS.EXECUCAO_CAMPO,
      MODULOS.CHECKLISTS,
      MODULOS.OCORRENCIAS,
      MODULOS.INVENTARIO,
      MODULOS.CLIENTES,
      MODULOS.RELATORIOS,
      MODULOS.EQUIPE,
      MODULOS.APROVACOES,
      MODULOS.AUDITORIA,
      MODULOS.ASSINATURA,
    ],
  },
  instalacao_tecnica: {
    nome: 'Instalação técnica',
    modulos: BASE_OPERACIONAL,
  },
  energia_solar: {
    nome: 'Energia solar',
    modulos: [...BASE_OPERACIONAL, MODULOS.INVENTARIO],
  },
  vidracarias: {
    nome: 'Vidraçarias',
    modulos: [...BASE_OPERACIONAL, MODULOS.INVENTARIO],
  },
  mecanicas: {
    nome: 'Mecânicas',
    modulos: [...BASE_OPERACIONAL, MODULOS.INVENTARIO],
  },
  limpeza_profissional: {
    nome: 'Limpeza profissional',
    modulos: BASE_OPERACIONAL,
  },
  servicos_tecnicos: {
    nome: 'Serviços técnicos',
    modulos: [...BASE_OPERACIONAL, MODULOS.INVENTARIO],
  },
};

const MODULOS_GESTAO = new Set([
  MODULOS.ORDENS,
  MODULOS.CHECKLISTS,
  MODULOS.CLIENTES,
  MODULOS.EQUIPE,
  MODULOS.APROVACOES,
  MODULOS.AUDITORIA,
  MODULOS.ASSINATURA,
]);

export function normalizarConfiguracaoModular(configuracao = {}) {
  const setor = configuracao.setor || 'servicos_tecnicos';
  const preset = PRESETS_SETORES[setor] || PRESETS_SETORES.servicos_tecnicos;
  const modulosAtivos = Array.isArray(configuracao.modulos_ativos)
    ? configuracao.modulos_ativos
    : preset.modulos;

  return {
    setor,
    setor_nome: configuracao.setor_nome || preset.nome,
    modulos_ativos: [...new Set([MODULOS.DASHBOARD, ...modulosAtivos])],
    rotulos: configuracao.rotulos && typeof configuracao.rotulos === 'object' ? configuracao.rotulos : {},
    permissoes: configuracao.permissoes && typeof configuracao.permissoes === 'object' ? configuracao.permissoes : {},
    recursos: configuracao.recursos && typeof configuracao.recursos === 'object' ? configuracao.recursos : {},
    origem: configuracao.origem || 'padrao_local',
  };
}

export function moduloEstaAtivo(configuracao, modulo, papel = 'tecnico') {
  const config = normalizarConfiguracaoModular(configuracao);
  if (!config.modulos_ativos.includes(modulo)) return false;

  const permissaoEspecifica = config.permissoes?.[papel]?.[modulo];
  if (typeof permissaoEspecifica === 'boolean') return permissaoEspecifica;

  const gestor = papel === 'administrador' || papel === 'supervisor';
  return gestor || !MODULOS_GESTAO.has(modulo);
}

export function rotuloModulo(configuracao, modulo) {
  const config = normalizarConfiguracaoModular(configuracao);
  return config.rotulos?.[modulo] || CATALOGO_MODULOS[modulo]?.nome || modulo;
}

