import { ListPlus, Sparkles, Tags } from 'lucide-react';

export default function ModelsModule({ models, onNew }) {
  const modelsWithTags = models.filter((model) => String(model.tag || '').trim());

  return (
    <section className="content">
      <div className="section-header">
        <div>
          <h2>Tags e modelos de checklist</h2>
          <p>Defina uma tag para cada tipo de equipamento e reutilize os itens em qualquer ordem.</p>
        </div>
        <button className="primary-button" onClick={onNew}><ListPlus size={18} /> Novo padrão</button>
      </div>

      <div className="tag-summary">
        <div>
          <Tags size={21} />
          <strong>{modelsWithTags.length} tags cadastradas</strong>
          <span>Exemplo: tag JAN para janela, POR para porta ou ELEV para elevador.</span>
        </div>
      </div>

      <div className="ai-model-panel">
        <Sparkles size={22} />
        <div>
          <strong>IA assistida para modelos de checklist</strong>
          <span>Ao criar um padrÃ£o, o portal pergunta se existe foto do equipamento e sugere itens por mÃ³dulo. O usuÃ¡rio revisa tudo antes de salvar, e o cadastro manual continua disponÃ­vel.</span>
        </div>
      </div>

      <div className="model-list">
        {models.map((model) => {
          const tag = String(model.tag || '').trim().toUpperCase();
          return (
            <article key={model.id} className="model-card">
              <div>
                <span className="eyebrow">{model.categoria || 'Geral'}</span>
                <h3>{model.nome}</h3>
                <p>{model.descricao || 'Sem descrição'}</p>
              </div>
              <div className="model-card-meta">
                {tag ? <span className="tag-badge">{tag}</span> : <span className="tag-badge muted">Sem tag</span>}
                <strong>{model.modelos_checklist_genericos_itens?.length || 0} itens</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
