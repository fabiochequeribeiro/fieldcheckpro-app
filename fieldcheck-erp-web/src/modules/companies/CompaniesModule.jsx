import { Building2, Database, Sparkles, Users } from 'lucide-react';
import { HubPanel, HubStatCard, HubStatusBadge } from '../../components/hub/HubComponents';

export default function CompaniesModule({ companies = [], technicians = [], orders = [] }) {
  const activeCompanies = companies.filter((item) => String(item.status || 'ativo').toLowerCase() !== 'inativo');
  return (
    <section className="content hub-page">
      <div className="section-header"><div><span className="eyebrow">SaaS multiempresa</span><h2>Empresas</h2><p>Gestao comercial, operacional e de consumo por cliente do FieldCheck Hub.</p></div></div>
      <div className="hub-stat-grid">
        <HubStatCard icon={Building2} label="Empresas" value={companies.length} detail={`${activeCompanies.length} ativas`} />
        <HubStatCard icon={Users} label="Usuarios" value={technicians.length} detail="Tecnicos e gestores cadastrados" tone="green" />
        <HubStatCard icon={Database} label="Ordens" value={orders.length} detail="Volume operacional total" tone="amber" />
        <HubStatCard icon={Sparkles} label="Consumo IA" value="Mock" detail="Preparado para telemetria por tenant" tone="purple" />
      </div>
      <HubPanel title="Carteira de empresas" subtitle="Planos, modulos, usuarios e status em uma visao executiva." icon={Building2}>
        <div className="company-hub-grid">
          {companies.map((company) => (
            <article key={company.id} className="company-hub-card">
              <div className="company-avatar">{String(company.nome || 'F').slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>{company.nome || 'Empresa sem nome'}</h3>
                <p>{company.email_responsavel || company.telefone || 'Contato nao informado'}</p>
                <div className="module-chip-grid">
                  {(company.modulos || []).slice(0, 5).map((modulo) => <span key={modulo} className="mini-module active">{modulo}</span>)}
                  {!(company.modulos || []).length ? <span className="mini-module">Modulos padrao</span> : null}
                </div>
              </div>
              <div className="company-hub-meta">
                <strong>{company.plano || 'Enterprise'}</strong>
                <HubStatusBadge status={company.status || 'ativo'} />
                <small>IA: pronto para limite por plano</small>
              </div>
            </article>
          ))}
          {!companies.length ? <div className="hub-empty-inline">As empresas cadastradas aparecerao aqui para Super Admin.</div> : null}
        </div>
      </HubPanel>
    </section>
  );
}
