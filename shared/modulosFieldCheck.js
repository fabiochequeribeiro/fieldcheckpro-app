export const MODULOS = {
  DASHBOARD: 'dashboard',
  ENTREGA_TECNICA: 'entrega_tecnica',
  MANUTENCAO_PREVENTIVA: 'manutencao_preventiva',
  MANUTENCAO_CORRETIVA: 'manutencao_corretiva',
  AUDITORIAS_OPERACIONAIS: 'auditorias',
  SEGURANCA_TRABALHO: 'seguranca_trabalho',
  INSPECOES: 'inspecoes',
  REPOSITOR_LOJA: 'repositor_loja',
  CONSTRUCAO_CIVIL: 'construcao_civil',
  AGRICULTURA: 'agricultura',
  CONTROLE_PATRIMONIO: 'controle_patrimonio',
  FROTA: 'frota',
  FORMULARIOS_PERSONALIZADOS: 'formularios_personalizados',
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
  [MODULOS.ENTREGA_TECNICA]: { nome: 'Entrega Técnica', nucleo: true },
  [MODULOS.MANUTENCAO_PREVENTIVA]: { nome: 'Manutenção Preventiva' },
  [MODULOS.MANUTENCAO_CORRETIVA]: { nome: 'Manutenção Corretiva' },
  [MODULOS.AUDITORIAS_OPERACIONAIS]: { nome: 'Auditorias' },
  [MODULOS.SEGURANCA_TRABALHO]: { nome: 'Segurança do Trabalho' },
  [MODULOS.INSPECOES]: { nome: 'Inspeções' },
  [MODULOS.REPOSITOR_LOJA]: { nome: 'Repositor de Loja' },
  [MODULOS.CONSTRUCAO_CIVIL]: { nome: 'Construção Civil' },
  [MODULOS.AGRICULTURA]: { nome: 'Agricultura' },
  [MODULOS.CONTROLE_PATRIMONIO]: { nome: 'Controle de Patrimônio' },
  [MODULOS.FROTA]: { nome: 'Frota' },
  [MODULOS.FORMULARIOS_PERSONALIZADOS]: { nome: 'Formulários Personalizados' },
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
  MODULOS.ENTREGA_TECNICA,
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

export const MODULOS_SAAS = [
  MODULOS.ENTREGA_TECNICA,
  MODULOS.MANUTENCAO_PREVENTIVA,
  MODULOS.MANUTENCAO_CORRETIVA,
  MODULOS.AUDITORIAS_OPERACIONAIS,
  MODULOS.SEGURANCA_TRABALHO,
  MODULOS.INSPECOES,
  MODULOS.REPOSITOR_LOJA,
  MODULOS.CONSTRUCAO_CIVIL,
  MODULOS.AGRICULTURA,
  MODULOS.INVENTARIO,
  MODULOS.CONTROLE_PATRIMONIO,
  MODULOS.FROTA,
  MODULOS.FORMULARIOS_PERSONALIZADOS,
];

const LEGACY_MODULE_ALIASES = {
  [MODULOS.ENTREGA_TECNICA]: [MODULOS.ORDENS, MODULOS.EXECUCAO_CAMPO, MODULOS.CHECKLISTS, MODULOS.RELATORIOS, MODULOS.APROVACOES],
  [MODULOS.INSPECOES]: [MODULOS.CHECKLISTS, MODULOS.OCORRENCIAS],
  [MODULOS.AUDITORIAS_OPERACIONAIS]: [MODULOS.AUDITORIA],
  [MODULOS.CONTROLE_PATRIMONIO]: [MODULOS.INVENTARIO],
};

export const PRESETS_SETORES = {
  construcao_civil: {
    nome: 'Construção civil',
    modulos: [...BASE_OPERACIONAL, MODULOS.CONSTRUCAO_CIVIL, MODULOS.INVENTARIO],
  },
  manutencao_industrial: {
    nome: 'Manutenção industrial',
    modulos: [...BASE_OPERACIONAL, MODULOS.MANUTENCAO_PREVENTIVA, MODULOS.MANUTENCAO_CORRETIVA, MODULOS.INVENTARIO],
  },
  repositor_varejo: {
    nome: 'Repositor / varejo',
    modulos: [
      MODULOS.DASHBOARD,
      MODULOS.REPOSITOR_LOJA,
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
    modulos: [MODULOS.DASHBOARD, MODULOS.ENTREGA_TECNICA, ...BASE_OPERACIONAL],
  },
  energia_solar: {
    nome: 'Energia solar',
    modulos: [...BASE_OPERACIONAL, MODULOS.INSPECOES, MODULOS.SEGURANCA_TRABALHO, MODULOS.INVENTARIO],
  },
  vidracarias: {
    nome: 'Vidraçarias',
    modulos: [...BASE_OPERACIONAL, MODULOS.INSPECOES, MODULOS.CONSTRUCAO_CIVIL, MODULOS.INVENTARIO],
  },
  mecanicas: {
    nome: 'Mecânicas',
    modulos: [...BASE_OPERACIONAL, MODULOS.MANUTENCAO_PREVENTIVA, MODULOS.MANUTENCAO_CORRETIVA, MODULOS.FROTA, MODULOS.INVENTARIO],
  },
  limpeza_profissional: {
    nome: 'Limpeza profissional',
    modulos: [...BASE_OPERACIONAL, MODULOS.INSPECOES, MODULOS.SEGURANCA_TRABALHO],
  },
  servicos_tecnicos: {
    nome: 'Serviços técnicos',
    modulos: [...BASE_OPERACIONAL, MODULOS.INSPECOES, MODULOS.INVENTARIO],
  },
  agricultura: {
    nome: 'Agricultura',
    modulos: [...BASE_OPERACIONAL, MODULOS.AGRICULTURA, MODULOS.MANUTENCAO_PREVENTIVA, MODULOS.INVENTARIO, MODULOS.FROTA],
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

  const expandidos = new Set([MODULOS.DASHBOARD, ...modulosAtivos]);
  modulosAtivos.forEach((modulo) => {
    (LEGACY_MODULE_ALIASES[modulo] || []).forEach((alias) => expandidos.add(alias));
  });

  return {
    setor,
    setor_nome: configuracao.setor_nome || preset.nome,
    modulos_ativos: [...expandidos],
    rotulos: configuracao.rotulos && typeof configuracao.rotulos === 'object' ? configuracao.rotulos : {},
    permissoes: configuracao.permissoes && typeof configuracao.permissoes === 'object' ? configuracao.permissoes : {},
    recursos: configuracao.recursos && typeof configuracao.recursos === 'object' ? configuracao.recursos : {},
    origem: configuracao.origem || 'padrao_local',
  };
}

export function moduloEstaAtivo(configuracao, modulo, papel = 'tecnico') {
  const config = normalizarConfiguracaoModular(configuracao);
  const ativoDireto = config.modulos_ativos.includes(modulo);
  const ativoPorAlias = Object.entries(LEGACY_MODULE_ALIASES).some(([principal, aliases]) =>
    config.modulos_ativos.includes(principal) && aliases.includes(modulo)
  );
  if (!ativoDireto && !ativoPorAlias) return false;

  const permissaoEspecifica = config.permissoes?.[papel]?.[modulo];
  if (typeof permissaoEspecifica === 'boolean') return permissaoEspecifica;

  const gestor = ['super_admin', 'admin_empresa', 'administrador', 'supervisor'].includes(papel);
  return gestor || !MODULOS_GESTAO.has(modulo);
}

export function rotuloModulo(configuracao, modulo) {
  const config = normalizarConfiguracaoModular(configuracao);
  return config.rotulos?.[modulo] || CATALOGO_MODULOS[modulo]?.nome || modulo;
}
