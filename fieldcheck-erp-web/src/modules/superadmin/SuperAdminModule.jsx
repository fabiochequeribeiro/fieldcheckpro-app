import { Building2, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MODULOS_SAAS, CATALOGO_MODULOS } from '../../shared/modulosFieldCheck';

const EMPTY_COMPANY = {
  nome: '',
  slug: '',
  documento: '',
  email_responsavel: '',
  telefone: '',
  plano: 'trial',
  status: 'ativa',
  modulos: ['entrega_tecnica', 'inspecoes'],
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function SuperAdminModule({
  companies,
  modules,
  selectedCompanyId,
  loading,
  onSelectCompany,
  onCreateCompany,
  onUpdateCompany,
}) {
  const [form, setForm] = useState(EMPTY_COMPANY);
  const [editing, setEditing] = useState({});
  const moduleIds = useMemo(() => {
    const available = modules?.length ? modules.map((item) => item.id) : MODULOS_SAAS;
    return available.filter((id) => CATALOGO_MODULOS[id]);
  }, [modules]);

  function field(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'nome' && !current.slug ? { slug: slugify(value) } : {}),
    }));
  }

  function toggleModulo(modulo) {
    setForm((current) => ({
      ...current,
      modulos: current.modulos.includes(modulo)
        ? current.modulos.filter((item) => item !== modulo)
        : [...current.modulos, modulo],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    await onCreateCompany({ ...form, slug: form.slug || slugify(form.nome) });
    setForm(EMPTY_COMPANY);
  }

  function editField(companyId, name, value) {
    setEditing((current) => ({
      ...current,
      [companyId]: { ...current[companyId], [name]: value },
    }));
  }

  return (
    <section className="content super-admin-page">
      <div className="section-header">
        <div>
          <h2>Super Admin</h2>
          <p>Centro de comando do FieldCheck Hub: cadastre empresas, planos, módulos, licenças, usuários e permissões para cada cliente.</p>
        </div>
      </div>

      <form className="super-admin-form" onSubmit={submit}>
        <div className="subsection-title">
          <div>
            <h3>Nova empresa</h3>
            <p>Esta empresa usará o FieldCheck Hub e o aplicativo FieldCheck Pro, com dados isolados por empresa_id.</p>
          </div>
          <Building2 size={22} />
        </div>
        <div className="company-form-grid">
          <label>Nome da empresa<input value={form.nome} onChange={(event) => field('nome', event.target.value)} required /></label>
          <label>Slug<input value={form.slug} onChange={(event) => field('slug', slugify(event.target.value))} required /></label>
          <label>Documento<input value={form.documento} onChange={(event) => field('documento', event.target.value)} /></label>
          <label>E-mail responsável<input type="email" value={form.email_responsavel} onChange={(event) => field('email_responsavel', event.target.value)} /></label>
          <label>Telefone<input value={form.telefone} onChange={(event) => field('telefone', event.target.value)} /></label>
          <label>Plano<select value={form.plano} onChange={(event) => field('plano', event.target.value)}><option value="trial">Trial</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></label>
          <label>Status<select value={form.status} onChange={(event) => field('status', event.target.value)}><option value="ativa">Ativa</option><option value="trial">Trial</option><option value="bloqueada">Bloqueada</option><option value="cancelada">Cancelada</option></select></label>
        </div>
        <div className="module-chip-grid">
          {moduleIds.map((modulo) => (
            <button type="button" key={modulo} className={form.modulos.includes(modulo) ? 'module-chip active' : 'module-chip'} onClick={() => toggleModulo(modulo)}>
              {CATALOGO_MODULOS[modulo]?.nome || modulo}
            </button>
          ))}
        </div>
        <footer className="form-actions">
          <button className="primary-button" disabled={loading} type="submit"><Save size={18} /> Cadastrar empresa</button>
        </footer>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Empresa</th><th>Plano</th><th>Status</th><th>Módulos</th><th>Ações</th></tr></thead>
          <tbody>
            {companies.map((company) => {
              const draft = editing[company.id] || {};
              const plano = draft.plano ?? company.plano ?? 'trial';
              const status = draft.status ?? company.status ?? 'ativa';
              const modulos = draft.modulos ?? company.modulos ?? [];
              return (
                <tr key={company.id} className={selectedCompanyId === company.id ? 'selected-row' : ''}>
                  <td><strong>{company.nome}</strong><small>{company.slug}</small></td>
                  <td><select value={plano} onChange={(event) => editField(company.id, 'plano', event.target.value)}><option value="trial">Trial</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></td>
                  <td><select value={status} onChange={(event) => editField(company.id, 'status', event.target.value)}><option value="ativa">Ativa</option><option value="trial">Trial</option><option value="bloqueada">Bloqueada</option><option value="cancelada">Cancelada</option></select></td>
                  <td>
                    <div className="company-module-list">
                      {moduleIds.map((modulo) => (
                        <button type="button" key={modulo} className={modulos.includes(modulo) ? 'mini-module active' : 'mini-module'} onClick={() => editField(company.id, 'modulos', modulos.includes(modulo) ? modulos.filter((item) => item !== modulo) : [...modulos, modulo])}>
                          {CATALOGO_MODULOS[modulo]?.nome || modulo}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="row-actions">
                    <button className="secondary-button" type="button" onClick={() => onSelectCompany(company.id)}>Ver dados</button>
                    <button className="primary-button" type="button" disabled={loading} onClick={() => onUpdateCompany(company, { plano, status, modulos })}>Salvar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
