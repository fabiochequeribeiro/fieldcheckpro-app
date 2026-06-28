const BASE_BY_MODULE = {
  manutencao: [
    'Verificar condicao geral, ruídos, folgas e vazamentos',
    'Registrar foto antes e depois da intervencao',
    'Conferir fixacoes, protecoes, cabos e sensores',
    'Informar pendencias, pecas usadas e proxima manutencao',
  ],
  auditoria: [
    'Verificar conformidade com procedimento interno',
    'Registrar evidencia fotografica por nao conformidade',
    'Classificar severidade e impacto operacional',
    'Definir responsavel, prazo e acao corretiva',
  ],
  seguranca: [
    'Verificar uso de EPIs obrigatorios',
    'Identificar risco, gravidade e acao corretiva',
    'Registrar foto da area ou condicao insegura',
    'Coletar ciencia do responsavel quando aplicavel',
  ],
  repositor: [
    'Registrar foto da gondola antes da reposicao',
    'Verificar ruptura, validade, preco e exposicao',
    'Informar quantidade encontrada e sugerida',
    'Registrar foto depois da reposicao',
  ],
  entrega: [
    'Confirmar identificacao do equipamento e cliente',
    'Registrar foto geral da entrega ou instalacao',
    'Validar funcionamento e orientar responsavel',
    'Coletar assinatura de aceite do cliente',
  ],
  padrao: [
    'Confirmar dados do cliente, local e responsavel',
    'Registrar evidencia fotografica dos pontos avaliados',
    'Marcar status OK, Nao OK ou N/A por item',
    'Apontar pendencias e recomendacoes para o relatorio',
  ],
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function pickModuleKey({ categoria, nome, descricao }) {
  const text = `${normalize(categoria)} ${normalize(nome)} ${normalize(descricao)}`;
  if (text.includes('preventiva') || text.includes('corretiva') || text.includes('manutencao')) return 'manutencao';
  if (text.includes('auditoria')) return 'auditoria';
  if (text.includes('seguranca') || text.includes('epi')) return 'seguranca';
  if (text.includes('repositor') || text.includes('gondola') || text.includes('mercado')) return 'repositor';
  if (text.includes('entrega')) return 'entrega';
  return 'padrao';
}

export function generateChecklistModelSuggestions(modelForm, { hasEquipmentPhoto = false } = {}) {
  const key = pickModuleKey(modelForm || {});
  const current = new Set((modelForm?.itens || []).map((item) => normalize(item.texto)));
  const tag = String(modelForm?.tag || '').trim().toUpperCase();
  const contextItems = [
    tag ? `Confirmar TAG ${tag} e historico do equipamento` : '',
    hasEquipmentPhoto
      ? 'Comparar foto do equipamento com identificacao, estado visual e pontos criticos'
      : 'Perguntar se existe foto do equipamento para melhorar as sugestoes',
  ].filter(Boolean);

  return [...contextItems, ...(BASE_BY_MODULE[key] || BASE_BY_MODULE.padrao)]
    .filter((text) => !current.has(normalize(text)))
    .slice(0, 8)
    .map((texto) => ({
      texto,
      exige_foto: /foto|evidencia|visual/i.test(texto),
      exige_observacao: /pendencia|risco|acao|nao conformidade|recomendacao/i.test(texto),
    }));
}
