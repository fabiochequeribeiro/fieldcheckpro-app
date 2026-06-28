import { useMemo, useState } from 'react';
import { Copy, Eye, EyeOff, KeyRound, Save, X } from 'lucide-react';
import './CreateUserModal.css';

function gerarSenha() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const numeros = '23456789';
  const simbolos = '!@#$%';
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const base = [...bytes].map((valor, index) => {
    const fonte = index < 2 ? numeros : index < 4 ? simbolos : letras;
    return fonte[valor % fonte.length];
  });
  return base.sort(() => Math.random() - 0.5).join('');
}

export default function CreateUserModal({ currentRole, loading, onClose, onSubmit }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', papel: 'tecnico' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const canCreateManagers = ['super_admin', 'admin_empresa', 'administrador'].includes(currentRole);
  const passwordStrong = useMemo(() => form.senha.length >= 8, [form.senha]);

  function field(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!passwordStrong) { setError('A senha provisória deve ter pelo menos 8 caracteres.'); return; }
    try {
      await onSubmit(form);
    } catch (submitError) {
      setError(submitError?.message || 'Não foi possível criar o usuário.');
    }
  }

  async function copiarSenha() {
    if (!form.senha) return;
    await navigator.clipboard.writeText(form.senha);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal create-user-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2>Novo usuário</h2>
            <p>Crie o login e defina o acesso à empresa.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} title="Fechar"><X size={20} /></button>
        </header>
        <form className="create-user-form" onSubmit={submit}>
          <label>Nome completo<input value={form.nome} onChange={(event) => field('nome', event.target.value)} autoComplete="name" required /></label>
          <label>E-mail de acesso<input type="email" value={form.email} onChange={(event) => field('email', event.target.value)} autoComplete="off" required /></label>
          <label>
            Perfil
            <select value={form.papel} onChange={(event) => field('papel', event.target.value)}>
              <option value="tecnico">Técnico</option>
              {canCreateManagers ? (
                <>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin_empresa">Administrador da empresa</option>
                </>
              ) : null}
            </select>
          </label>
          <label>
            Senha provisória
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={form.senha} onChange={(event) => field('senha', event.target.value)} autoComplete="new-password" minLength={8} required />
              <button type="button" className="field-icon" onClick={() => setShowPassword((value) => !value)} title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              <button type="button" className="field-icon" onClick={copiarSenha} title="Copiar senha"><Copy size={18} /></button>
            </div>
            <small className={passwordStrong ? 'valid' : ''}>Use pelo menos 8 caracteres.</small>
          </label>
          <button type="button" className="generate-password" onClick={() => { field('senha', gerarSenha()); setShowPassword(true); }}><KeyRound size={17} /> Gerar senha segura</button>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="temporary-password-note"><strong>Senha provisória</strong><span>Entregue-a ao usuário por um canal privado. Ela não será mostrada novamente no portal.</span></div>
          <footer className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="primary-button" disabled={loading}><Save size={18} /> {loading ? 'Criando...' : 'Criar usuário'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
