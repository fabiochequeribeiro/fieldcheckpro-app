import { Bot, Camera, ClipboardCheck, FileText, ListChecks, MessageSquare, ShieldCheck, TrendingUp, WandSparkles } from 'lucide-react';
import { getAIServiceStatus } from '../../services/AIService';
import { buildManagerAiInsights } from '../../services/RecommendationService';

const AI_CARDS = [
  {
    icon: ClipboardCheck,
    title: 'Sugestões de checklist',
    description: 'Gere sugestões por módulo, equipamento, TAG, modelo, série e foto, sempre com revisão humana antes de aplicar.',
  },
  {
    icon: FileText,
    title: 'Resumo inteligente da visita',
    description: 'Base pronta para transformar respostas, observações, fotos e pendências em resumo técnico e executivo.',
  },
  {
    icon: ShieldCheck,
    title: 'Operação segura',
    description: 'A IA é assistida: se falhar ou não for usada, o cadastro manual continua funcionando normalmente.',
  },
];

const AI_ENTERPRISE_CARDS = [
  { icon: ListChecks, title: 'Pendencias', description: 'Sugestao de pendencias, responsaveis, prazos e plano de acao.' },
  { icon: Camera, title: 'Analise de fotos', description: 'Placeholder seguro para leitura futura de evidencias visuais.' },
  { icon: MessageSquare, title: 'Chat IA', description: 'Estrutura para perguntas operacionais por gestores e supervisores.' },
  { icon: TrendingUp, title: 'Dashboard IA', description: 'Uso, sugestoes aceitas, tempo economizado e falhas por empresa.' },
  { icon: Bot, title: 'Recomendacoes', description: 'Base para recomendar manutencoes, auditorias e proximas acoes.' },
];

export default function AiAssistantModule({ companies = [], orders = [], visits = [], technicians = [], occurrences = [] }) {
  const status = getAIServiceStatus();
  const insights = buildManagerAiInsights({ companies, orders, visits, technicians, occurrences });

  return (
    <section className="content ai-assistant-page">
      <div className="section-header ai-hero-card">
        <div>
          <span className="eyebrow">FieldCheck Intelligence</span>
          <h2>IA Assistente</h2>
          <p>
            Central preparada para apoiar o cadastro de checklists, resumos de visitas e recomendações técnicas,
            sem substituir a revisão do usuário.
          </p>
        </div>
        <WandSparkles size={38} />
      </div>

      <div className="ai-assistant-grid">
        {AI_CARDS.map(({ icon: Icon, title, description }) => (
          <article key={title} className="ai-assistant-card">
            <div className="ai-assistant-icon"><Icon size={22} /></div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <div className="ai-assistant-grid ai-enterprise-grid">
        {AI_ENTERPRISE_CARDS.map(({ icon: Icon, title, description }) => (
          <article key={title} className="ai-assistant-card">
            <div className="ai-assistant-icon"><Icon size={22} /></div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <div className="hub-panel">
        <header className="hub-panel-header">
          <div>
            <h3>Dashboard IA para gestores</h3>
            <p>Indicadores mockados prontos para IA real por empresa, módulo e período.</p>
          </div>
          <TrendingUp size={21} />
        </header>
        <div className="ai-kpi-grid">
          {insights.map((item) => (
            <article key={item.label} className={`ai-kpi-card ${item.tone}`}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="help-two-columns">
        <article className="help-panel">
          <span className="eyebrow">Pergunte ao FieldCheck</span>
          <h3>Chat IA preparado</h3>
          <p>
            Exemplos: quantas visitas fizemos, quais equipamentos possuem mais falhas,
            quem realizou mais atendimentos e quais clientes estao atrasados.
          </p>
          <div className="ai-helper-note">
            Modo atual: {status.mode}. Backend recomendado: {status.recommendedBackend}. Chave de IA no portal: {status.apiKeyInPortal ? 'sim' : 'nao'}.
          </div>
        </article>

        <article className="help-panel">
          <span className="eyebrow">Timeline inteligente</span>
          <h3>Historico preparado</h3>
          <p>
            Estrutura para consolidar visitas, alteracoes, auditorias, fotos, aprovacoes,
            checklists, assinaturas e eventos em uma linha do tempo auditavel.
          </p>
        </article>
      </div>

      <div className="help-two-columns">
        <article className="help-panel">
          <span className="eyebrow">Como usar com segurança</span>
          <h3>Fluxo recomendado</h3>
          <div className="return-checklist">
            <div><ShieldCheck size={18} /> Informe módulo, equipamento e dados disponíveis.</div>
            <div><ShieldCheck size={18} /> Se existir foto, anexe ou informe que há foto disponível.</div>
            <div><ShieldCheck size={18} /> Gere sugestões com IA e revise item por item.</div>
            <div><ShieldCheck size={18} /> Aceite, edite ou rejeite antes de salvar no modelo oficial.</div>
          </div>
        </article>

        <article className="help-panel">
          <span className="eyebrow">Preparado para produção</span>
          <h3>Próximo passo técnico</h3>
          <p>
            A camada atual foi pensada para trocar o mock/local por um endpoint seguro no backend,
            como Supabase Edge Function ou API própria. Nenhuma chave de IA deve ficar no portal ou no app.
          </p>
          <div className="ai-helper-note">
            Recomendação: manter a IA como assistente opcional, com auditoria, histórico e aprovação manual.
          </div>
        </article>
      </div>
    </section>
  );
}
