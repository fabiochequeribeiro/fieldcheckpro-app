function texto(valor, fallback = '') {
  return String(valor ?? fallback).trim();
}

function contarFotos(equipamentos = []) {
  return (Array.isArray(equipamentos) ? equipamentos : []).reduce((total, equipamento) => {
    const fotoEquipamento = equipamento?.foto || equipamento?.fotoBase64 || equipamento?.foto_path ? 1 : 0;
    const fotosItens = (equipamento?.itens || []).filter((item) => item?.foto || item?.fotoBase64 || item?.foto_path).length;
    return total + fotoEquipamento + fotosItens;
  }, 0);
}

function itemRespondido(item) {
  return item?.resposta || item?.ok === true || item?.nao === true;
}

function itemNaoConforme(item) {
  const resposta = String(item?.resposta || '').trim().toUpperCase();
  return resposta === 'NAO' || resposta === 'NÃO' || item?.nao === true;
}

function itemOk(item) {
  const resposta = String(item?.resposta || '').trim().toUpperCase();
  return resposta === 'OK' || item?.ok === true;
}

function textoItem(item, equipamento) {
  return texto(item?.texto || item?.item || item?.nome || equipamento?.nome || equipamento?.tag || 'Item verificado');
}

function normalizarModulo(valor) {
  return texto(valor, 'formulario-personalizado')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}

function uniq(lista = []) {
  return [...new Set(lista.map((item) => texto(item)).filter(Boolean))];
}

const SUGESTOES_BASE_CHECKLIST = {
  entrega: [
    'Confirmar identificacao do equipamento e dados do cliente',
    'Registrar foto geral do equipamento instalado ou entregue',
    'Verificar integridade visual, acabamentos e pontos de fixacao',
    'Orientar responsavel sobre uso, limpeza, garantia e cuidados',
    'Coletar assinatura de aceite do cliente ou responsavel',
  ],
  preventiva: [
    'Verificar condicao geral, ruídos, folgas, vazamentos e aquecimento',
    'Conferir fixacoes, protecoes, cabos, sensores e pontos de seguranca',
    'Registrar leitura, horimetro, tensao, corrente ou parametro operacional',
    'Limpar pontos criticos e registrar foto antes/depois quando aplicavel',
    'Indicar proxima manutencao e pendencias preventivas',
  ],
  corretiva: [
    'Descrever falha relatada pelo cliente ou operador',
    'Registrar evidencias da falha antes da intervencao',
    'Informar causa provavel, acao executada e pecas utilizadas',
    'Testar funcionamento apos correcao e registrar resultado',
    'Apontar pendencias, riscos de reincidencia e recomendacoes',
  ],
  auditoria: [
    'Conferir aderencia ao procedimento ou padrao auditado',
    'Registrar conformidade, nao conformidade e evidencia fotografica',
    'Classificar severidade e impacto operacional',
    'Definir responsavel, prazo e acao corretiva',
    'Registrar observacao final para o relatorio de auditoria',
  ],
  seguranca: [
    'Verificar uso de EPIs obrigatorios e condicoes da area',
    'Identificar riscos, bloqueios, protecoes e sinalizacao',
    'Registrar nao conformidades com foto e gravidade',
    'Definir acao corretiva, responsavel e prazo',
    'Coletar ciencia ou assinatura quando necessario',
  ],
  inventario: [
    'Confirmar tag, patrimonio, numero de serie e localizacao',
    'Registrar foto do ativo e estado de conservacao',
    'Validar quantidade, status, setor e responsavel',
    'Indicar divergencias, avarias ou necessidade de baixa',
    'Registrar observacoes para reconciliacao do inventario',
  ],
  repositor: [
    'Registrar foto da gondola ou prateleira antes da reposicao',
    'Verificar ruptura, validade, preco, exposicao e limpeza',
    'Informar quantidade encontrada e quantidade sugerida',
    'Registrar foto depois da reposicao ou organizacao',
    'Apontar pendencias para loja, supervisor ou fornecedor',
  ],
  os: [
    'Confirmar solicitacao, prioridade, tecnico e cliente',
    'Registrar diagnostico inicial e evidencias do atendimento',
    'Executar checklist do servico com status OK, Nao OK ou N/A',
    'Informar materiais, pecas, tempo e pendencias',
    'Coletar assinatura e preparar relatorio final',
  ],
  inspecao: [
    'Verificar condicao visual, funcionamento e acesso ao equipamento',
    'Registrar evidencia fotografica dos pontos inspecionados',
    'Classificar itens OK, Nao OK ou N/A',
    'Indicar nao conformidades, criticidade e recomendacoes',
    'Gerar resumo tecnico para acompanhamento',
  ],
  formulario: [
    'Confirmar dados do cliente, local, responsavel e tecnico',
    'Registrar fotos e observacoes dos pontos avaliados',
    'Marcar itens obrigatorios antes de finalizar',
    'Apontar pendencias, riscos e acoes recomendadas',
    'Coletar assinatura quando o processo exigir',
  ],
};

function detectarPacoteSugestao(modulo, equipamento = {}) {
  const alvo = `${normalizarModulo(modulo)} ${normalizarModulo(equipamento?.tipo)} ${normalizarModulo(equipamento?.nome)} ${normalizarModulo(equipamento?.tag)}`;
  if (alvo.includes('entrega')) return 'entrega';
  if (alvo.includes('preventiva')) return 'preventiva';
  if (alvo.includes('corretiva') || alvo.includes('ocorrencia')) return 'corretiva';
  if (alvo.includes('auditoria')) return 'auditoria';
  if (alvo.includes('seguranca') || alvo.includes('epi')) return 'seguranca';
  if (alvo.includes('inventario') || alvo.includes('patrimonio')) return 'inventario';
  if (alvo.includes('repositor') || alvo.includes('gondola') || alvo.includes('mercado')) return 'repositor';
  if (alvo.includes('ordem') || alvo.includes('servico') || alvo.includes('os')) return 'os';
  if (alvo.includes('inspec')) return 'inspecao';
  return 'formulario';
}

export function buildChecklistSuggestionPayload({ equipamento = {}, modulo = '', itensAtuais = [], possuiFoto = false } = {}) {
  return {
    modulo: texto(modulo, 'Formularios personalizados'),
    empresa: texto(equipamento.empresa || equipamento.empresa_id),
    historico: Array.isArray(equipamento.historico) ? equipamento.historico.slice(0, 10) : [],
    equipamento: {
      nome: texto(equipamento.nome || equipamento.tipo, 'Equipamento'),
      tipo: texto(equipamento.tipo),
      fabricante: texto(equipamento.fabricante || equipamento.marca),
      categoria: texto(equipamento.categoria),
      tag: texto(equipamento.tag || equipamento.TAG || equipamento.codigo_tag),
      modelo: texto(equipamento.modelo),
      serie: texto(equipamento.serie),
      descritivo: texto(equipamento.descritivo || equipamento.descricao),
      setor: texto(equipamento.setor || equipamento.localizacao || equipamento.area),
      possuiFoto: Boolean(possuiFoto || equipamento.foto || equipamento.fotoBase64 || equipamento.foto_path),
    },
    itensAtuais: (Array.isArray(itensAtuais) ? itensAtuais : [])
      .map((item) => texto(item?.texto || item?.item || item))
      .filter(Boolean),
  };
}

export function generateFallbackChecklistSuggestions(payload = {}) {
  const pacote = detectarPacoteSugestao(payload.modulo, payload.equipamento);
  const equipamento = payload.equipamento || {};
  const nome = texto(equipamento.nome || equipamento.tipo, 'equipamento');
  const tag = texto(equipamento.tag);
  const fabricante = texto(equipamento.fabricante);
  const modelo = texto(equipamento.modelo);
  const serie = texto(equipamento.serie);
  const categoria = texto(equipamento.categoria);
  const setor = texto(equipamento.setor);
  const itensAtuais = Array.isArray(payload.itensAtuais) ? payload.itensAtuais : [];
  const base = SUGESTOES_BASE_CHECKLIST[pacote] || SUGESTOES_BASE_CHECKLIST.formulario;
  const foto = equipamento.possuiFoto
    ? [
        'Comparar a foto do equipamento com identificacao, tag, estado visual e pontos criticos',
        'Adicionar observacao se a foto indicar avaria, sujeira, acesso bloqueado ou ausencia de protecao',
      ]
    : [
        'Registrar foto do equipamento antes de finalizar o checklist',
        'Perguntar ao tecnico se ha foto do equipamento para melhorar as sugestoes',
      ];

  const contexto = [
    tag ? `Confirmar TAG ${tag} e vincular historico do equipamento` : '',
    fabricante ? `Validar fabricante ${fabricante} e padroes recomendados de manutencao` : '',
    modelo ? `Conferir modelo ${modelo}, compatibilidade e parametros operacionais` : '',
    serie ? `Registrar numero de serie ${serie} para rastreabilidade` : '',
    categoria ? `Aplicar criterios da categoria ${categoria}` : '',
    setor ? `Avaliar riscos e acesso no setor ${setor}` : '',
    payload.empresa ? `Considerar padrao operacional da empresa ${payload.empresa}` : '',
    payload.historico?.length ? 'Revisar historico recente antes de definir itens obrigatorios' : '',
    `Validar se o checklist cobre o contexto real de ${nome}`,
  ];

  return uniq([...contexto, ...base, ...foto])
    .filter((item) => !itensAtuais.some((existente) => existente.toLowerCase() === item.toLowerCase()))
    .slice(0, 10)
    .map((textoItem, index) => ({
      id: `ai-${Date.now()}-${index}`,
      texto: textoItem,
      categoria: equipamento.possuiFoto && index < 2 ? 'IA + FOTO DO EQUIPAMENTO' : 'SUGESTAO IA',
      exige_foto: /foto|evidencia|avaria|visual/i.test(textoItem),
      exige_observacao: /pendencia|nao conformidade|risco|falha|observacao|acao/i.test(textoItem),
      origem: 'ia_mock_local',
      confianca: equipamento.possuiFoto ? 'alta' : 'media',
    }));
}

export async function generateChecklistSuggestions(payload) {
  // Diferencial comercial: a IA real deve rodar em backend seguro.
  // O app continua funcionando no modo manual e usa fallback local se a IA externa estiver indisponivel.
  const endpoint = null;

  if (!endpoint) {
    return generateFallbackChecklistSuggestions(payload);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Falha ao gerar sugestoes de checklist.');
  const data = await response.json();
  return Array.isArray(data?.sugestoes) && data.sugestoes.length
    ? data.sugestoes
    : generateFallbackChecklistSuggestions(payload);
}

export function buildVisitSummaryPayload(visita = {}) {
  const equipamentos = Array.isArray(visita.equipamentos) ? visita.equipamentos : [];
  const itens = equipamentos.flatMap((equipamento) =>
    (equipamento.itens || [])
      .filter((item) => item?.ativo !== false)
      .map((item) => ({ item, equipamento }))
  );

  const pendencias = itens
    .filter(({ item }) => !itemRespondido(item))
    .map(({ item, equipamento }) => textoItem(item, equipamento))
    .slice(0, 8);

  const naoConformidades = itens
    .filter(({ item }) => itemNaoConforme(item))
    .map(({ item, equipamento }) => textoItem(item, equipamento))
    .slice(0, 8);

  const observacoes = [
    texto(visita.dados?.observacoes || visita.observacoes),
    ...itens.map(({ item }) => texto(item?.obs || item?.observacao)).filter(Boolean),
  ].filter(Boolean);

  return {
    pedido: texto(visita.numeroPedido || visita.numero_pedido || visita.dados?.numeroPedido),
    cliente: texto(visita.dados?.cliente || visita.cliente, 'cliente não informado'),
    cidade: texto(visita.dados?.cidade || visita.cidade),
    tecnico: texto(visita.dados?.tecnico || visita.tecnico),
    data: texto(visita.dados?.data || visita.data_visita || visita.data),
    equipamentos: equipamentos.map((equipamento) => ({
      nome: texto(equipamento.nome || equipamento.tipo || equipamento.tag, 'Equipamento'),
      tag: texto(equipamento.tag),
      itens: (equipamento.itens || []).filter((item) => item?.ativo !== false).length,
    })),
    itensTotal: itens.length,
    itensPreenchidos: itens.filter(({ item }) => itemRespondido(item)).length,
    itensOk: itens.filter(({ item }) => itemOk(item)).length,
    pendencias,
    naoConformidades,
    observacoes: observacoes.slice(0, 12),
    fotosCount: contarFotos(equipamentos),
  };
}

export function generateFallbackSummary(payload = {}) {
  const cliente = texto(payload.cliente, 'cliente informado');
  const pedido = texto(payload.pedido, 'pedido informado');
  const cidade = payload.cidade ? ` em ${payload.cidade}` : '';
  const tecnico = payload.tecnico ? ` pelo técnico ${payload.tecnico}` : '';
  const data = payload.data ? ` na data ${payload.data}` : '';
  const equipamentos = Array.isArray(payload.equipamentos) ? payload.equipamentos : [];
  const nomesEquipamentos = equipamentos.map((item) => item.nome).filter(Boolean).slice(0, 4).join(', ');
  const trechoEquipamentos = equipamentos.length
    ? ` Foram avaliados ${equipamentos.length} equipamento(s)${nomesEquipamentos ? `, incluindo ${nomesEquipamentos}` : ''}.`
    : ' Foram avaliados os equipamentos vinculados à ordem de serviço.';

  const trechoItens = payload.itensTotal
    ? ` A equipe preencheu ${payload.itensPreenchidos || 0} de ${payload.itensTotal} item(ns) de checklist, com ${payload.itensOk || 0} item(ns) aprovados/OK.`
    : '';

  const trechoPendencias = payload.pendencias?.length
    ? ` Permanecem pendências que devem ser acompanhadas pela equipe responsável: ${payload.pendencias.join('; ')}.`
    : ' Não foram identificadas pendências relevantes ao final da visita.';

  const trechoNaoConformidades = payload.naoConformidades?.length
    ? ` Foram registradas não conformidades que exigem atenção: ${payload.naoConformidades.join('; ')}.`
    : ' Não foram registradas não conformidades críticas nos itens avaliados.';

  const trechoFotos = payload.fotosCount > 0
    ? ` Também foram registradas ${payload.fotosCount} evidência(s) fotográfica(s) para apoio à análise e rastreabilidade.`
    : '';

  const trechoObservacoes = payload.observacoes?.length
    ? ` Observações registradas pelo técnico: ${payload.observacoes.slice(0, 4).join('; ')}.`
    : '';

  return `Durante a visita técnica realizada para o cliente ${cliente}${cidade}${data}${tecnico}, foram avaliadas as atividades vinculadas ao pedido ${pedido}.${trechoEquipamentos}${trechoItens} ${trechoPendencias} ${trechoNaoConformidades}${trechoFotos}${trechoObservacoes} Ao final, as informações registradas no aplicativo ficam disponíveis para acompanhamento, histórico e emissão do relatório técnico.`
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateVisitSummary(payload) {
  // A chamada real de IA deve passar por um backend seguro, nunca por chave dentro do app.
  // Endpoint futuro sugerido: POST /api/ai/visit-summary retornando { resumo: "..." }.
  const endpoint = null;

  if (!endpoint) {
    return generateFallbackSummary(payload);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Falha ao gerar resumo inteligente.');
  const data = await response.json();
  return texto(data?.resumo) || generateFallbackSummary(payload);
}
