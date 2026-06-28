import { UserPlus } from 'lucide-react';

function perfilAtual(technician) {
  if (technician.perfil) return technician.perfil;
  return technician.papel === 'administrador' ? 'admin_empresa' : technician.papel || 'tecnico';
}

export default function TeamModule({ technicians, currentRole, onNew, onRoleChange }) {
  const canManage = ['super_admin', 'admin_empresa', 'administrador'].includes(currentRole);

  return (
    <section className="content">
      <div className="section-header">
        <div>
          <h2>Equipe e permissões</h2>
          <p>Crie os logins e defina o que cada usuário poderá acessar.</p>
        </div>
        <button className="primary-button" onClick={onNew}><UserPlus size={18} /> Novo usuário</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th></tr></thead>
          <tbody>
            {technicians.map((technician) => (
              <tr key={technician.id}>
                <td>{technician.nome}</td>
                <td>{technician.email}</td>
                <td>
                  <select value={perfilAtual(technician)} disabled={!canManage} onChange={(event) => onRoleChange(technician, event.target.value)}>
                    <option value="tecnico">Técnico</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin_empresa">Administrador da empresa</option>
                    {currentRole === 'super_admin' ? <option value="super_admin">Super Admin</option> : null}
                  </select>
                </td>
                <td><span className={technician.ativo ? 'user-active' : 'user-inactive'}>{technician.ativo ? 'Ativo' : 'Inativo'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
