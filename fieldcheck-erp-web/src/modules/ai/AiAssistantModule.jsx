import { ClipboardCheck, FileText, ShieldCheck, WandSparkles } from 'lucide-react';

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

export default function AiAssistantModule() {
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
