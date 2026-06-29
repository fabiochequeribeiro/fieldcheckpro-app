import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { HubPanel, HubStatCard } from '../../components/hub/HubComponents';

export default function ReportsModule({ visits = [], orders = [], pendingApprovals = [] }) {
  const pdfs = visits.filter((visit) => visit.pdf_url || visit.relatorio_url || visit.finalizado).length;
  return (
    <section className="content hub-page">
      <div className="section-header"><div><span className="eyebrow">BI e exportacoes</span><h2>Relatorios</h2><p>Central executiva para PDF, Excel e dashboards operacionais.</p></div></div>
      <div className="hub-stat-grid">
        <HubStatCard icon={FileText} label="PDFs emitidos" value={pdfs} detail="Com base nos relatorios finalizados" />
        <HubStatCard icon={FileSpreadsheet} label="Excel" value="Pronto" detail="Estrutura para exportacao tabular" tone="green" />
        <HubStatCard icon={BarChart3} label="Dashboards" value={orders.length + visits.length} detail="Eventos analisaveis" tone="blue" />
        <HubStatCard icon={Download} label="Aprovacoes" value={pendingApprovals.length} detail="Fila atual" tone="amber" />
      </div>
      <HubPanel title="Pacotes de exportacao" subtitle="Acoes preparadas para conectar aos geradores oficiais." icon={Download}>
        <div className="report-action-grid">
          <button type="button"><FileText size={20} /><strong>Exportar PDF</strong><span>Relatorios aprovados e evidencias.</span></button>
          <button type="button"><FileSpreadsheet size={20} /><strong>Exportar Excel</strong><span>Ordens, visitas, clientes e pendencias.</span></button>
          <button type="button"><BarChart3 size={20} /><strong>Dashboard executivo</strong><span>Indicadores para diretoria.</span></button>
        </div>
      </HubPanel>
    </section>
  );
}
