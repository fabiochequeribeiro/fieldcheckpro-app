import { Gauge, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { HubPanel, HubStatCard } from '../../components/hub/HubComponents';

const PLANS = [
  { name: 'Starter', users: '5 usuarios', ai: '100 sugestoes IA/mes', modules: 'Checklists, OS e PDF' },
  { name: 'Professional', users: '25 usuarios', ai: '1.000 sugestoes IA/mes', modules: 'Manutencao, auditorias, inventario e repositor' },
  { name: 'Enterprise', users: 'Ilimitado', ai: 'Consumo dedicado', modules: 'Multiempresa, permissoes, BI e integracoes' },
];

export default function LicensesModule({ companies = [], technicians = [] }) {
  return (
    <section className="content hub-page">
      <div className="section-header"><div><span className="eyebrow">Comercial e planos</span><h2>Licencas</h2><p>Estrutura para limites, consumo, planos e governanca SaaS.</p></div></div>
      <div className="hub-stat-grid">
        <HubStatCard icon={ShieldCheck} label="Planos ativos" value={new Set(companies.map((item) => item.plano || 'Enterprise')).size || 1} detail="Starter, Professional e Enterprise" />
        <HubStatCard icon={Users} label="Usuarios consumidos" value={technicians.length} detail="Base atual carregada" tone="green" />
        <HubStatCard icon={Sparkles} label="Limite IA" value="Por plano" detail="Pronto para controle de uso" tone="purple" />
        <HubStatCard icon={Gauge} label="Armazenamento" value="Mock" detail="Preparado para medicao Supabase" tone="amber" />
      </div>
      <div className="license-grid">
        {PLANS.map((plan) => (
          <article key={plan.name} className="license-card">
            <span>{plan.name}</span>
            <h3>{plan.users}</h3>
            <p>{plan.modules}</p>
            <strong>{plan.ai}</strong>
          </article>
        ))}
      </div>
      <HubPanel title="Governanca preparada" subtitle="Campos comerciais podem ser conectados ao Supabase sem alterar a experiencia atual." icon={ShieldCheck}>
        <div className="return-checklist">
          <div><ShieldCheck size={18} /> Modulos habilitados por empresa</div>
          <div><ShieldCheck size={18} /> Limites de usuarios, armazenamento e IA</div>
          <div><ShieldCheck size={18} /> Status de assinatura, validade e bloqueio suave</div>
        </div>
      </HubPanel>
    </section>
  );
}
