import { ClipboardCheck, Plus, Save, Tags, X } from 'lucide-react';

function tagDoModelo(model) {
  return String(model?.tag || '').trim().toUpperCase();
}

export default function OrderForm({
  orderForm,
  technicians,
  models,
  loading,
  onSubmit,
  onCancel,
  onOrderField,
  onEquipmentField,
  onSetOrderForm,
  onApplyModel,
  onMatchTag,
  onAddEquipmentFromModel,
}) {
  const modelsWithTags = models.filter((model) => tagDoModelo(model));

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>Pedido<input value={orderForm.numero_pedido} onChange={(event) => onOrderField('numero_pedido', event.target.value)} required /></label>
      <label>Cliente<input value={orderForm.cliente} onChange={(event) => onOrderField('cliente', event.target.value)} required /></label>
      <label>Cidade<input value={orderForm.cidade} onChange={(event) => onOrderField('cidade', event.target.value)} /></label>
      <label>Estado<input value={orderForm.estado} onChange={(event) => onOrderField('estado', event.target.value)} maxLength={2} /></label>
      <label className="span-2">Endereço<input value={orderForm.endereco} onChange={(event) => onOrderField('endereco', event.target.value)} /></label>
      <label>Responsável<input value={orderForm.responsavel} onChange={(event) => onOrderField('responsavel', event.target.value)} /></label>
      <label>
        Técnico
        <select value={orderForm.tecnico_id} onChange={(event) => onOrderField('tecnico_id', event.target.value)}>
          <option value="">Não atribuído</option>
          {technicians.filter((item) => item.ativo && item.papel === 'tecnico').map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>
      <label>Telefone<input value={orderForm.telefone} onChange={(event) => onOrderField('telefone', event.target.value)} /></label>
      <label>E-mail<input type="email" value={orderForm.email} onChange={(event) => onOrderField('email', event.target.value)} /></label>
      <label className="span-2">Observações<textarea value={orderForm.observacoes} onChange={(event) => onOrderField('observacoes', event.target.value)} /></label>

      <div className="span-2 equipment-editor">
        <div className="subsection-title">
          <div>
            <h3>Equipamentos</h3>
            <p>Escolha uma tag cadastrada para carregar automaticamente os itens que o técnico deve verificar.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => onSetOrderForm((current) => ({ ...current, equipamentos: [...current.equipamentos, { nome: '', tag: '', modelo: '', serie: '', quantidade: '1', modelo_checklist_id: '' }] }))}>
            <Plus size={16} /> Equipamento
          </button>
        </div>

        {modelsWithTags.length ? (
          <div className="tag-picker" aria-label="Tags cadastradas">
            <div>
              <Tags size={18} />
              <strong>Tags prontas</strong>
              <span>Clique para adicionar um equipamento com checklist padronizado.</span>
            </div>
            <div className="tag-chip-list">
              {modelsWithTags.map((model) => (
                <button type="button" className="tag-chip" key={model.id} onClick={() => onAddEquipmentFromModel(model)}>
                  <strong>{tagDoModelo(model)}</strong>
                  <span>{model.nome}</span>
                  <small>{model.modelos_checklist_genericos_itens?.length || 0} itens</small>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="tag-empty">
            <ClipboardCheck size={18} />
            Cadastre modelos com tag para agilizar a criação das ordens.
          </div>
        )}

        <datalist id="fieldcheck-tags">
          {modelsWithTags.map((model) => <option key={model.id} value={tagDoModelo(model)}>{model.nome}</option>)}
        </datalist>

        {orderForm.equipamentos.map((item, index) => (
          <div className="equipment-row equipment-row-tagged" key={index}>
            <input placeholder="Nome" value={item.nome} onChange={(event) => onEquipmentField(index, 'nome', event.target.value)} />
            <input
              placeholder="Tag"
              list="fieldcheck-tags"
              value={item.tag}
              onChange={(event) => onEquipmentField(index, 'tag', event.target.value.toUpperCase())}
              onBlur={() => onMatchTag(index, item.tag)}
            />
            <input placeholder="Modelo" value={item.modelo} onChange={(event) => onEquipmentField(index, 'modelo', event.target.value)} />
            <input placeholder="Série" value={item.serie} onChange={(event) => onEquipmentField(index, 'serie', event.target.value)} />
            <input type="number" min="1" placeholder="Qtd." value={item.quantidade} onChange={(event) => onEquipmentField(index, 'quantidade', event.target.value)} />
            <select value={item.modelo_checklist_id || ''} onChange={(event) => onApplyModel(index, event.target.value)}>
              <option value="">Sem modelo</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {tagDoModelo(model) ? `${tagDoModelo(model)} - ${model.nome}` : model.nome}
                </option>
              ))}
            </select>
            {orderForm.equipamentos.length > 1 ? (
              <button className="icon-button danger" type="button" onClick={() => onSetOrderForm((current) => ({ ...current, equipamentos: current.equipamentos.filter((_row, rowIndex) => rowIndex !== index) }))}>
                <X size={18} />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <footer className="form-actions span-2">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary-button" disabled={loading}><Save size={18} /> Salvar e atribuir</button>
      </footer>
    </form>
  );
}
