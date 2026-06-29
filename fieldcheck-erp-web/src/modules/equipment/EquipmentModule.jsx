import { Box, CalendarClock, QrCode, Wrench } from 'lucide-react';
import { HubPanel, HubStatCard } from '../../components/hub/HubComponents';

function extractEquipment(orders = [], models = []) {
  const rows = [];
  orders.forEach((order) => {
    const list = Array.isArray(order.equipamentos) ? order.equipamentos : [];
    list.forEach((equipment, index) => rows.push({
      id: `${order.id}-${index}`,
      nome: equipment.nome || equipment.tag || order.numero_pedido,
      tag: equipment.tag || 'Sem TAG',
      cliente: order.cliente,
      modelo: equipment.modelo || equipment.modelo_checklist_id || 'Nao informado',
      status: order.status,
    }));
  });
  if (!rows.length) {
    models.forEach((model) => rows.push({ id: model.id, nome: model.nome, tag: model.tag || 'Sem TAG', cliente: 'Modelo de checklist', modelo: model.categoria, status: 'padrao' }));
  }
  return rows;
}

export default function EquipmentModule({ orders = [], models = [] }) {
  const equipment = extractEquipment(orders, models);
  return (
    <section className="content hub-page">
      <div className="section-header"><div><span className="eyebrow">Ativos e manutencao</span><h2>Equipamentos</h2><p>Historico, QR Code, ocorrencias, fotos e proximas manutencoes.</p></div></div>
      <div className="hub-stat-grid">
        <HubStatCard icon={Box} label="Equipamentos" value={equipment.length} detail="Ordens e modelos consolidados" />
        <HubStatCard icon={QrCode} label="QR Code" value="Pronto" detail="Arquitetura preparada por ativo" tone="green" />
        <HubStatCard icon={Wrench} label="Manutencoes" value={orders.length} detail="Baseada nas ordens atuais" tone="amber" />
        <HubStatCard icon={CalendarClock} label="Proxima manutencao" value="Mock" detail="Aguardando periodicidade por ativo" tone="purple" />
      </div>
      <HubPanel title="Inventario tecnico" subtitle="Base para historico por equipamento, fotos, QR Code e manutencao." icon={Box}>
        <div className="equipment-hub-grid">
          {equipment.map((item) => (
            <article key={item.id} className="equipment-hub-card">
              <QrCode size={26} />
              <div><h3>{item.nome || 'Equipamento sem nome'}</h3><p>{item.cliente || 'Sem cliente'} - {item.modelo}</p></div>
              <strong>{item.tag}</strong>
              <span>Ultima manutencao: em preparacao</span>
            </article>
          ))}
          {!equipment.length ? <div className="hub-empty-inline">Cadastre ordens ou modelos para popular o inventario.</div> : null}
        </div>
      </HubPanel>
    </section>
  );
}
