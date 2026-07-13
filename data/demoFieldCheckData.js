export const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@fieldcheckpro.com.br',
  nome: 'Técnico Demo',
  empresa: 'FieldCheck Demo',
  perfil: 'técnico',
  papel: 'técnico',
  tecnico: {
    id: 'demo-tecnico',
    nome: 'Técnico Demo',
    email: 'demo@fieldcheckpro.com.br',
    empresa: 'FieldCheck Demo',
    perfil: 'técnico',
    papel: 'técnico',
  },
};

export const DEMO_ORDERS = [
  {
    id: 'demo-os-1024',
    numero_pedido: 'DEMO-1024',
    cliente: 'Solar Norte Energia',
    endereco: 'Av. das Placas, 455',
    cidade: 'Londrina',
    estado: 'PR',
    telefone: '(43) 98459-4216',
    emailCliente: 'operacao@solarnorte.demo',
    responsavel: 'Marina Costa',
    tipo: 'Energia Solar',
    status: 'pendente',
    equipamentos: [
      {
        nome: 'Inversor Solar 75 kW',
        tipo: 'Inversor',
        tag: 'INV-SOL-075',
        modelo: 'FS-75K',
        serie: 'SN-DEMO-2407',
        itens: [
          { texto: 'Conferência visual do inversor e cabos', categoria: 'Instalação' },
          { texto: 'Validar fixação, ventilação e proteções', categoria: 'Segurança' },
          { texto: 'Registrar foto do quadro e etiqueta TAG', categoria: 'Evidências' },
          { texto: 'Confirmar leitura inicial e status operacional', categoria: 'Operação' },
        ],
      },
    ],
  },
  {
    id: 'demo-os-2088',
    numero_pedido: 'DEMO-2088',
    cliente: 'Indústria Modelo Alfa',
    endereco: 'Rua da Automação, 1400',
    cidade: 'Maringá',
    estado: 'PR',
    telefone: '(44) 3000-0000',
    emailCliente: 'manutencao@alfademo.com',
    responsavel: 'Carlos Mendes',
    tipo: 'Indústria',
    status: 'pendente',
    equipamentos: [
      {
        nome: 'Esteira Transportadora Linha 3',
        tipo: 'Transportador',
        tag: 'TR-IND-003',
        modelo: 'FC-CONV-300',
        serie: 'SN-DEMO-8891',
        itens: [
          { texto: 'Inspecionar correias, roletes e alinhamento', categoria: 'Mecânica' },
          { texto: 'Verificar proteções e pontos de emergência', categoria: 'Segurança' },
          { texto: 'Checar vazamentos, ruídos e vibração', categoria: 'Condição' },
          { texto: 'Registrar pendências para manutenção corretiva', categoria: 'Pendências' },
        ],
      },
    ],
  },
  {
    id: 'demo-os-3310',
    numero_pedido: 'DEMO-3310',
    cliente: 'Supermercado Cidade Demo',
    endereco: 'Rua Central, 220',
    cidade: 'Curitiba',
    estado: 'PR',
    telefone: '(41) 3000-0000',
    emailCliente: 'loja@cidadedemo.com',
    responsavel: 'Ana Ribeiro',
    tipo: 'Supermercados',
    status: 'pendente',
    equipamentos: [
      {
        nome: 'Checklist de loja e reposicao',
        tipo: 'Auditoria de Loja',
        tag: 'LOJA-DEMO-01',
        modelo: 'FC-STORE',
        serie: 'AUD-DEMO-01',
        itens: [
          { texto: 'Validar abastecimento dos corredores prioritarios', categoria: 'Reposicao' },
          { texto: 'Registrar ruptura ou produto sem etiqueta', categoria: 'Auditoria' },
          { texto: 'Conferir limpeza e organizacao da gondola', categoria: 'Qualidade' },
          { texto: 'Fotografar antes e depois da acao', categoria: 'Evidencias' },
        ],
      },
    ],
  },
];

export function montarEquipamentosDemo(pedido) {
  return (pedido?.equipamentos || []).map((eq) => ({
    ...eq,
    foto: null,
    itens: (eq.itens || []).map((item) => ({
      ...item,
      resposta: null,
      obs: '',
      foto: null,
      ativo: true,
    })),
  }));
}
