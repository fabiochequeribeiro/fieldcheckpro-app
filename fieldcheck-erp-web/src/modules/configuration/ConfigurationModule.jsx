import { useState } from 'react';
import { Save, SlidersHorizontal } from 'lucide-react';
import {
  CATALOGO_MODULOS,
  MODULOS,
  PRESETS_SETORES,
  normalizarConfiguracaoModular,
} from '../../shared/modulosFieldCheck';

export default function ConfigurationModule({ configuracao, loading, onSave }) {
  const [form, setForm] = useState(() => normalizarConfiguracaoModular(configuracao));

  function escolherSetor(setor) {
    const preset = PRESETS_SETORES[setor];
    setForm((atual) => ({
      ...atual,
      setor,
      setor_nome: preset.nome,
      modulos_ativos: [...preset.modulos],
    }));
  }

  function alternarModulo(modulo) {
    if (modulo === MODULOS.DASHBOARD) return;
    setForm((atual) => ({
      ...atual,
      modulos_ativos: atual.modulos_ativos.includes(modulo)
        ? atual.modulos_ativos.filter((item) => item !== modulo)
        : [...atual.modulos_ativos, modulo],
    }));
  }

  function alterarRotulo(modulo, valor) {
    setForm((atual) => ({ ...atual, rotulos: { ...atual.rotulos, [modulo]: valor } }));
  }

  return (
    <section className="content modular-settings">
      <div className="section-header">
        <div>
          <h2>Estrutura da empresa</h2>
          <p>Escolha um setor como ponto de partida e ajuste os módulos conforme a operação do cliente.</p>
        </div>
        <button className="primary-button" disabled={loading} onClick={() => onSave(form)}>
          <Save size={18} /> Salvar configuração
        </button>
      </div>

      <div className="settings-card">
        <div className="subsection-title"><div><h3>Setor principal</h3><p>O setor sugere uma estrutura inicial; os módulos continuam editáveis.</p></div></div>
        <div className="sector-grid">
          {Object.entries(PRESETS_SETORES).filter(([id]) => id !== 'servicos_tecnicos').map(([id, setor]) => (
            <button key={id} className={form.setor === id ? 'sector-option active' : 'sector-option'} onClick={() => escolherSetor(id)}>
              <strong>{setor.nome}</strong><span>{setor.modulos.length} módulos sugeridos</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="subsection-title"><div><h3>Módulos ativos</h3><p>O mesmo conjunto será respeitado pelo portal e pelo aplicativo.</p></div><SlidersHorizontal size={21} /></div>
        <div className="module-config-list">
          {Object.entries(CATALOGO_MODULOS).map(([id, modulo]) => {
            const ativo = form.modulos_ativos.includes(id);
            return (
              <article key={id} className={ativo ? 'module-config active' : 'module-config'}>
                <label className="module-toggle">
                  <input type="checkbox" checked={ativo} disabled={modulo.nucleo && id === MODULOS.DASHBOARD} onChange={() => alternarModulo(id)} />
                  <span><strong>{modulo.nome}</strong><small>{modulo.nucleo ? 'Núcleo da plataforma' : 'Módulo opcional'}</small></span>
                </label>
                <input value={form.rotulos[id] || ''} onChange={(event) => alterarRotulo(id, event.target.value)} placeholder={`Nome exibido: ${modulo.nome}`} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
