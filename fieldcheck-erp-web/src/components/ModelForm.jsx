import { Plus, Save, Sparkles } from 'lucide-react';

export default function ModelForm({ modelForm, loading, onSubmit, onCancel, onChange, onChangeItem, onAddItem, onGenerateAiSuggestions }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>Nome do padrão<input value={modelForm.nome} onChange={(event) => onChange((current) => ({ ...current, nome: event.target.value }))} required /></label>
      <label>
        Tag do equipamento
        <input
          value={modelForm.tag}
          onChange={(event) => onChange((current) => ({ ...current, tag: event.target.value.toUpperCase().replace(/\s+/g, '') }))}
          placeholder="Ex.: JAN"
          required
        />
      </label>
      <label>Categoria<input value={modelForm.categoria} onChange={(event) => onChange((current) => ({ ...current, categoria: event.target.value }))} /></label>
      <label className="span-2">Descrição<textarea value={modelForm.descricao} onChange={(event) => onChange((current) => ({ ...current, descricao: event.target.value }))} /></label>
      <div className="span-2 item-editor">
        <div className="subsection-title">
          <div>
            <h3>Itens obrigatórios</h3>
            <p>Estes itens serão puxados automaticamente quando a ordem usar esta tag.</p>
          </div>
          <div className="row-actions">
            <button className="secondary-button" type="button" onClick={onGenerateAiSuggestions}><Sparkles size={16} /> Sugerir com IA</button>
            <button className="secondary-button" type="button" onClick={onAddItem}><Plus size={16} /> Item</button>
          </div>
        </div>
        <div className="ai-helper-note">
          A IA pergunta se existe foto do equipamento e cria sugestoes editaveis. Se ela nao estiver disponivel, o cadastro manual continua funcionando.
        </div>
        {(modelForm.itens || []).map((item, index) => (
          <div className="check-item-row" key={index}>
            <input placeholder={`Item ${index + 1}`} value={item.texto} onChange={(event) => onChangeItem(index, 'texto', event.target.value)} />
            <label className="check"><input type="checkbox" checked={item.exige_foto} onChange={(event) => onChangeItem(index, 'exige_foto', event.target.checked)} /> Foto obrigatória</label>
            <label className="check"><input type="checkbox" checked={item.exige_observacao} onChange={(event) => onChangeItem(index, 'exige_observacao', event.target.checked)} /> Observação obrigatória</label>
          </div>
        ))}
      </div>
      <footer className="form-actions span-2">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={loading}><Save size={18} /> Criar padrão</button>
      </footer>
    </form>
  );
}
