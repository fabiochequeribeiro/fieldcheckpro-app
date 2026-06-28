import {
  BadgeCheck,
  ClipboardList,
  FileText,
  Image,
  KeyRound,
  ListChecks,
  MapPin,
  PlayCircle,
  Tags,
  UserPlus,
} from 'lucide-react';

const quickSteps = [
  {
    icon: UserPlus,
    title: '1. Cadastre a equipe',
    text: 'Crie o acesso de administradores, supervisores e técnicos. Cada perfil vê apenas o que precisa executar.',
  },
  {
    icon: Tags,
    title: '2. Crie as tags',
    text: 'Use códigos simples para cada tipo de equipamento: JAN para janela, POR para porta ou ELEV para elevador.',
  },
  {
    icon: ListChecks,
    title: '3. Monte o checklist',
    text: 'Defina os itens, fotos obrigatórias e observações obrigatórias que o técnico deverá responder em campo.',
  },
  {
    icon: ClipboardList,
    title: '4. Abra a ordem',
    text: 'Informe cliente, endereço, técnico responsável e selecione a tag do equipamento para carregar o padrão.',
  },
  {
    icon: PlayCircle,
    title: '5. Técnico executa',
    text: 'No aplicativo, o técnico busca o pedido, responde os itens, anexa fotos, coleta assinatura e envia.',
  },
  {
    icon: BadgeCheck,
    title: '6. Empresa confere',
    text: 'No portal, a empresa consulta relatório, fotos, ocorrências, localização e aprova ou reabre o serviço.',
  },
];

const examples = [
  { tag: 'JAN', title: 'Janela', items: ['Verificar silicone', 'Conferir batentes', 'Testar roldanas'] },
  { tag: 'POR', title: 'Porta', items: ['Verificar fechadura', 'Conferir alinhamento', 'Avaliar dobradiças'] },
  { tag: 'ELEV', title: 'Elevador', items: ['Verificar painel', 'Conferir sensores', 'Registrar foto da placa'] },
];

const faq = [
  {
    question: 'O técnico pode alterar os itens do checklist?',
    answer: 'Não. O ideal é a empresa cadastrar o padrão no portal e o técnico apenas executar o que foi atribuído.',
  },
  {
    question: 'Quando uso tag e quando uso modelo?',
    answer: 'A tag é o atalho visual. O modelo é o checklist completo que fica ligado a essa tag.',
  },
  {
    question: 'O que fazer se uma tag não aparece na ordem?',
    answer: 'Confira se o modelo foi salvo com tag e se pertence à mesma empresa do usuário logado.',
  },
  {
    question: 'Onde vejo o retorno do campo?',
    answer: 'Use Aprovações para abrir a visita finalizada e conferir relatório, fotos, ocorrência, assinatura e localização.',
  },
];

function FlowImage() {
  return (
    <div className="manual-flow-image" aria-label="Fluxo visual do FieldCheck Pro">
      <div className="flow-phone">
        <div className="flow-phone-header" />
        <div className="flow-card strong">Pedido #FC-2026</div>
        <div className="flow-card">TAG JAN</div>
        <div className="flow-check" />
        <div className="flow-check short" />
      </div>
      <div className="flow-arrow">→</div>
      <div className="flow-report">
        <img src="/logo.png" alt="" />
        <strong>Relatório enviado</strong>
        <span>Fotos, assinatura e localização</span>
      </div>
    </div>
  );
}

function TagImage() {
  return (
    <div className="manual-tag-image" aria-label="Exemplo visual de tags">
      {examples.map((example) => (
        <div key={example.tag} className="manual-tag-ticket">
          <strong>{example.tag}</strong>
          <span>{example.title}</span>
        </div>
      ))}
    </div>
  );
}

export default function HelpModule() {
  return (
    <section className="content help-page">
      <div className="section-header">
        <div>
          <h2>Manual rápido</h2>
          <p>Um guia visual para configurar a empresa, padronizar tags e acompanhar o retorno do campo.</p>
        </div>
      </div>

      <div className="help-hero">
        <div>
          <span className="eyebrow">Comece por aqui</span>
          <h3>Fluxo recomendado para cada cliente</h3>
          <p>
            Primeiro a empresa cria seus padrões por tag. Depois abre ordens usando essas tags. O técnico executa
            no aplicativo e o gestor confere tudo no portal.
          </p>
        </div>
        <FlowImage />
      </div>

      <div className="help-grid">
        {quickSteps.map(({ icon: Icon, title, text }) => (
          <article key={title} className="help-step">
            <div className="help-icon"><Icon size={22} /></div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>

      <div className="help-two-columns">
        <section className="help-panel">
          <div className="subsection-title">
            <div>
              <h3>Como pensar nas tags</h3>
              <p>A tag deve ser curta, fácil de lembrar e representar um tipo de equipamento.</p>
            </div>
          </div>
          <TagImage />
          <div className="tag-example-list">
            {examples.map((example) => (
              <article key={example.tag}>
                <span className="tag-badge">{example.tag}</span>
                <div>
                  <strong>{example.title}</strong>
                  <p>{example.items.join(' • ')}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="help-panel">
          <div className="subsection-title">
            <div>
              <h3>O que conferir no retorno</h3>
              <p>Depois do envio, a aprovação deve olhar o serviço como evidência técnica.</p>
            </div>
          </div>
          <div className="return-checklist">
            <div><FileText size={19} /> Relatório e respostas do checklist</div>
            <div><Image size={19} /> Fotos dos equipamentos e dos itens</div>
            <div><MapPin size={19} /> Localização de início e envio</div>
            <div><KeyRound size={19} /> Assinatura do responsável</div>
          </div>
        </section>
      </div>

      <section className="help-panel">
        <div className="subsection-title">
          <div>
            <h3>Perguntas comuns</h3>
            <p>Respostas rápidas para evitar erro no cadastro e na execução.</p>
          </div>
        </div>
        <div className="faq-list">
          {faq.map((item) => (
            <article key={item.question}>
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
