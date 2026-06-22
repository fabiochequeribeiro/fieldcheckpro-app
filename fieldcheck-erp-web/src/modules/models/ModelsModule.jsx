import { ListPlus } from 'lucide-react';

export default function ModelsModule({ models, onNew }) {
  return (
    <section className="content">
      <div className="section-header"><div><h2>Modelos de checklist</h2><p>Defina previamente o que deverá ser verificado em campo.</p></div><button className="primary-button" onClick={onNew}><ListPlus size={18} /> Novo modelo</button></div>
      <div className="model-list">{models.map((model) => <article key={model.id}><div><span className="eyebrow">{model.categoria || 'Geral'}</span><h3>{model.nome}</h3><p>{model.descricao || 'Sem descrição'}</p></div><strong>{model.modelos_checklist_genericos_itens?.length || 0} itens</strong></article>)}</div>
    </section>
  );
}

