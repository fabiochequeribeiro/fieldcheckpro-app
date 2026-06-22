import { formatDate } from '../../shared/status';

export default function AuditModule({ items }) {
  return (
    <section className="content">
      <div className="section-header"><div><h2>Auditoria</h2><p>Registro das alterações realizadas em pedidos, visitas e modelos.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Data</th><th>Usuário</th><th>Tabela</th><th>Ação</th><th>Registro</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{formatDate(item.criado_em)}</td><td>{item.usuario_email || '-'}</td><td>{item.tabela}</td><td>{item.acao}</td><td>{item.registro_id || '-'}</td></tr>)}</tbody></table></div>
    </section>
  );
}

