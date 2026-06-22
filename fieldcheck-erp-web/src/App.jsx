import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Settings2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { supabase } from './supabase';
import './App.css';
import VisitDetailModal from './components/VisitDetailModal';
import CreateUserModal from './components/CreateUserModal';
import ConfigurationModule from './modules/configuration/ConfigurationModule';
import { carregarConfiguracaoModularPortal, salvarConfiguracaoModularPortal } from './services/configuracaoModularService';
import { MODULOS, moduloEstaAtivo, normalizarConfiguracaoModular, rotuloModulo } from '../../shared/modulosFieldCheck';
import DashboardModule from './modules/dashboard/DashboardModule';
import OrdersModule from './modules/orders/OrdersModule';
import ModelsModule from './modules/models/ModelsModule';
import TeamModule from './modules/team/TeamModule';
import ApprovalsModule from './modules/approvals/ApprovalsModule';
import AuditModule from './modules/audit/AuditModule';
import { normalizeStatus } from './shared/status';

const EMPTY_ORDER = {
  id: null,
  numero_pedido: '',
  cliente: '',
  cidade: '',
  estado: '',
  endereco: '',
  telefone: '',
  email: '',
  responsavel: '',
  observacoes: '',
  tecnico_id: '',
  status: 'atribuido',
  equipamentos: [{ nome: '', tag: '', modelo: '', serie: '', quantidade: '1', modelo_checklist_id: '' }],
};

const EMPTY_MODEL = {
  nome: '',
  categoria: 'Geral',
  descricao: '',
  itens: [{ texto: '', exige_foto: false, exige_observacao: false }],
};

function Login({ loading, error, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="login-page">
      <section className="login-panel">
        <img src="/logo.png" className="login-logo" alt="FieldCheck Pro" />
        <div>
          <span className="eyebrow">Portal administrativo</span>
          <h1>FieldCheck Pro</h1>
          <p>Planejamento, atribuição e aprovação dos serviços de campo.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(email, password);
          }}
        >
          <label>
            E-mail
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            <ShieldCheck size={18} /> {loading ? 'Entrando...' : 'Entrar com segurança'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [models, setModels] = useState([]);
  const [visits, setVisits] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [audit, setAudit] = useState([]);
  const [orderModal, setOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER);
  const [modelModal, setModelModal] = useState(false);
  const [modelForm, setModelForm] = useState(EMPTY_MODEL);
  const [userModal, setUserModal] = useState(false);
  const [configuracaoModular, setConfiguracaoModular] = useState(() => normalizarConfiguracaoModular());

  const isManager = ['administrador', 'supervisor'].includes(profile?.papel);
  const company = profile?.empresa || '';

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data?.session || null);
      if (mounted) setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setConfiguracaoModular(normalizarConfiguracaoModular());
      return;
    }
    loadProfile(session.user);
  }, [session?.user?.id]);

  useEffect(() => {
    if (profile?.empresa && isManager) loadData();
  }, [profile?.empresa, profile?.papel]);

  async function login(email, password) {
    setAuthLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) setAuthError(error.message || 'E-mail ou senha inválidos.');
    setAuthLoading(false);
  }

  async function loadProfile(user) {
    setAuthLoading(true);
    const { data, error } = await supabase
      .from('tecnicos')
      .select('id,user_id,nome,email,empresa,papel,ativo')
      .eq('email', String(user.email || '').toLowerCase())
      .eq('ativo', true)
      .maybeSingle();
    if (error || !data) {
      setAuthError('Usuário sem perfil ativo na tabela de técnicos.');
      await supabase.auth.signOut();
    } else {
      setProfile(data);
      setConfiguracaoModular(await carregarConfiguracaoModularPortal(data.empresa));
    }
    setAuthLoading(false);
  }

  async function loadData() {
    setLoading(true);
    setMessage('');
    const [orderResult, techResult, modelResult, visitResult, occurrenceResult, auditResult] = await Promise.all([
      supabase.from('pedidos').select('*').eq('empresa', company).order('created_at', { ascending: false }),
      supabase.from('tecnicos').select('id,nome,email,empresa,papel,ativo,user_id').eq('empresa', company).order('nome'),
      supabase.from('modelos_checklist_genericos').select('*, modelos_checklist_genericos_itens(*)').eq('empresa', company).order('nome'),
      supabase.from('visitas').select('*').eq('empresa', company).order('created_at', { ascending: false }),
      supabase.from('ocorrencias_obra').select('*').eq('empresa', company).order('created_at', { ascending: false }),
      supabase.from('auditoria_servicos').select('*').eq('empresa', company).order('criado_em', { ascending: false }).limit(100),
    ]);
    const error = orderResult.error || techResult.error || modelResult.error || visitResult.error || occurrenceResult.error;
    if (error) setMessage(error.message || 'Falha ao carregar dados. Execute a migração do Supabase.');
    setOrders(orderResult.data || []);
    setTechnicians(techResult.data || []);
    setModels(modelResult.data || []);
    setVisits(visitResult.data || []);
    setOccurrences(occurrenceResult.data || []);
    setAudit(auditResult.data || []);
    setLoading(false);
  }

  async function saveModularConfiguration(nextConfiguration) {
    setLoading(true);
    setMessage('');
    try {
      const saved = await salvarConfiguracaoModularPortal(company, nextConfiguration);
      setConfiguracaoModular(saved);
      setMessage('Estrutura modular atualizada para a empresa.');
    } catch (error) {
      setMessage(error.message || 'Não foi possível salvar a configuração modular.');
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) =>
      [order.numero_pedido, order.cliente, order.cidade, order.status]
        .some((value) => String(value || '').toLowerCase().includes(term)),
    );
  }, [orders, search]);

  const pendingApprovals = visits.filter((visit) => ['enviado', 'finalizado'].includes(normalizeStatus(visit.status)));
  const activeOrders = orders.filter((order) => !['aprovado', 'cancelado'].includes(normalizeStatus(order.status)));

  function openNewOrder() {
    setOrderForm({
      ...EMPTY_ORDER,
      numero_pedido: `FC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      equipamentos: [{ ...EMPTY_ORDER.equipamentos[0] }],
    });
    setOrderModal(true);
  }

  async function openOrder(order) {
    const { data } = await supabase
      .from('equipamentos')
      .select('*')
      .eq('empresa', company)
      .eq('numero_pedido', order.numero_pedido)
      .order('id');
    setOrderForm({ ...EMPTY_ORDER, ...order, tecnico_id: order.tecnico_id || '', equipamentos: data?.length ? data : [{ ...EMPTY_ORDER.equipamentos[0] }] });
    setOrderModal(true);
  }

  function setOrderField(field, value) {
    setOrderForm((current) => ({ ...current, [field]: value }));
  }

  function setEquipmentField(index, field, value) {
    setOrderForm((current) => ({
      ...current,
      equipamentos: current.equipamentos.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  async function saveOrder(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const payload = {
      numero_pedido: orderForm.numero_pedido.trim(),
      cliente: orderForm.cliente.trim(),
      cidade: orderForm.cidade.trim(),
      estado: orderForm.estado.trim(),
      endereco: orderForm.endereco.trim(),
      telefone: orderForm.telefone.trim(),
      email: orderForm.email.trim(),
      responsavel: orderForm.responsavel.trim(),
      observacoes: orderForm.observacoes.trim(),
      tecnico_id: orderForm.tecnico_id ? Number(orderForm.tecnico_id) : null,
      status: orderForm.tecnico_id ? 'atribuido' : 'rascunho',
      atribuido_em: orderForm.tecnico_id ? new Date().toISOString() : null,
      empresa: company,
      origem: 'portal',
      pedido_campo: false,
      criado_por: session.user.id,
      updated_at: new Date().toISOString(),
    };
    let saved;
    let error;
    if (orderForm.id) {
      ({ data: saved, error } = await supabase.from('pedidos').update(payload).eq('id', orderForm.id).select().single());
    } else {
      ({ data: saved, error } = await supabase.from('pedidos').insert(payload).select().single());
    }
    if (!error && saved) {
      await supabase.from('equipamentos').delete().eq('empresa', company).eq('numero_pedido', saved.numero_pedido);
      const equipmentPayload = orderForm.equipamentos
        .filter((item) => item.nome.trim() || item.tag.trim())
        .map((item) => ({
          numero_pedido: saved.numero_pedido,
          nome: item.nome.trim(),
          tag: item.tag.trim(),
          modelo: item.modelo.trim(),
          serie: item.serie.trim(),
          quantidade: String(item.quantidade || 1),
          modelo_checklist_id: item.modelo_checklist_id || null,
          empresa: company,
          origem: 'portal',
          status_entrega: 'pendente',
        }));
      if (equipmentPayload.length) ({ error } = await supabase.from('equipamentos').insert(equipmentPayload));
    }
    setLoading(false);
    if (error) {
      setMessage(error.message || 'Não foi possível salvar a ordem.');
      return;
    }
    setOrderModal(false);
    setMessage('Ordem salva e disponibilizada conforme a atribuição.');
    await loadData();
  }

  async function saveModel(event) {
    event.preventDefault();
    setLoading(true);
    const modelId = crypto.randomUUID();
    const { error } = await supabase.from('modelos_checklist_genericos').insert({
      id: modelId,
      nome: modelForm.nome.trim(),
      categoria: modelForm.categoria.trim(),
      descricao: modelForm.descricao.trim(),
      empresa: company,
      ativo: true,
    });
    let finalError = error;
    if (!error) {
      const items = modelForm.itens.filter((item) => item.texto.trim()).map((item, index) => ({
        id: crypto.randomUUID(),
        modelo_id: modelId,
        texto: item.texto.trim(),
        tipo_resposta: 'ok_pendente_na',
        exige_foto: item.exige_foto,
        exige_observacao: item.exige_observacao,
        ordem: index + 1,
        empresa: company,
      }));
      if (items.length) ({ error: finalError } = await supabase.from('modelos_checklist_genericos_itens').insert(items));
    }
    setLoading(false);
    if (finalError) {
      setMessage(finalError.message || 'Não foi possível salvar o modelo.');
      return;
    }
    setModelModal(false);
    setModelForm(EMPTY_MODEL);
    setMessage('Modelo criado. Ele já pode ser associado aos equipamentos de uma ordem.');
    await loadData();
  }

  async function updateRole(technician, role) {
    const { error } = await supabase.from('tecnicos').update({ papel: role, updated_at: new Date().toISOString() }).eq('id', technician.id);
    setMessage(error ? error.message : 'Permissão atualizada.');
    if (!error) await loadData();
  }

  async function createTeamUser(form) {
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.functions.invoke('criar-usuario-empresa', {
      body: form,
    });
    if (error) {
      let detail = data?.error || error.message;
      try {
        const responseBody = await error.context?.json?.();
        detail = responseBody?.error || detail;
      } catch {
        // Mantem a mensagem original quando a resposta nao for JSON.
      }
      setLoading(false);
      throw new Error(detail || 'Não foi possível criar o usuário.');
    }
    setUserModal(false);
    setMessage(`Usuário ${data?.user?.nome || form.nome} criado. O login já está liberado no aplicativo.`);
    await loadData();
    setLoading(false);
  }

  async function approveVisit(visit) {
    const { error } = await supabase.from('visitas').update({
      status: 'aprovado',
      finalizado: true,
      aprovado_em: new Date().toISOString(),
      aprovado_por: session.user.id,
    }).eq('id', visit.id);
    setMessage(error ? error.message : 'Serviço aprovado e bloqueado.');
    if (!error) { setSelectedVisit(null); await loadData(); }
  }

  async function reopenVisit(visit) {
    const reason = window.prompt('Informe a justificativa obrigatória para reabrir este serviço:');
    if (!reason?.trim()) return;
    const { error } = await supabase.from('visitas').update({
      status: 'reaberto',
      finalizado: false,
      reaberto_em: new Date().toISOString(),
      reaberto_por: session.user.id,
      motivo_reabertura: reason.trim(),
    }).eq('id', visit.id);
    setMessage(error ? error.message : 'Serviço reaberto com justificativa registrada.');
    if (!error) { setSelectedVisit(null); await loadData(); }
  }

  if (authLoading) return <div className="center-state"><RefreshCw className="spin" /> Verificando acesso...</div>;
  if (!session) return <Login loading={authLoading} error={authError} onSubmit={login} />;
  if (!profile) return <div className="center-state">Carregando perfil...</div>;
  if (!isManager) {
    return (
      <div className="center-state denied">
        <ShieldCheck size={36} />
        <h1>Acesso administrativo restrito</h1>
        <p>Seu perfil é técnico. Utilize o aplicativo móvel para executar os serviços atribuídos.</p>
        <button className="secondary-button" onClick={() => supabase.auth.signOut()}><LogOut size={18} /> Sair</button>
      </div>
    );
  }

  const navItems = [
    ['dashboard', rotuloModulo(configuracaoModular, MODULOS.DASHBOARD), LayoutDashboard, MODULOS.DASHBOARD],
    ['orders', rotuloModulo(configuracaoModular, MODULOS.ORDENS), ClipboardList, MODULOS.ORDENS],
    ['models', rotuloModulo(configuracaoModular, MODULOS.CHECKLISTS), ClipboardCheck, MODULOS.CHECKLISTS],
    ['technicians', rotuloModulo(configuracaoModular, MODULOS.EQUIPE), Users, MODULOS.EQUIPE],
    ['approvals', rotuloModulo(configuracaoModular, MODULOS.APROVACOES), CheckCircle2, MODULOS.APROVACOES],
    ['audit', rotuloModulo(configuracaoModular, MODULOS.AUDITORIA), FileClock, MODULOS.AUDITORIA],
  ].filter(([, , , modulo]) => moduloEstaAtivo(configuracaoModular, modulo, profile.papel));
  if (profile.papel === 'administrador') navItems.push(['configuration', 'Configuração', Settings2, null]);

  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand"><img src="/logo.png" alt="" /><div><strong>FieldCheck Pro</strong><span>{company}</span></div></div>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button key={id} className={activeView === id ? 'active' : ''} onClick={() => { setActiveView(id); setMenuOpen(false); }}>
              <Icon size={19} /> {label}
              {id === 'approvals' && pendingApprovals.length ? <b>{pendingApprovals.length}</b> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-user"><UserCog size={20} /><div><strong>{profile.nome}</strong><span>{profile.papel}</span></div></div>
        <button className="logout-button" onClick={() => supabase.auth.signOut()}><LogOut size={18} /> Sair</button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen((value) => !value)}><Menu /></button>
          <div><span className="eyebrow">Operação da empresa</span><h1>{navItems.find(([id]) => id === activeView)?.[1]}</h1></div>
          <button className="icon-button" title="Atualizar" onClick={loadData}><RefreshCw className={loading ? 'spin' : ''} size={20} /></button>
        </header>

        {message ? <div className="notice" onClick={() => setMessage('')}>{message}<X size={17} /></div> : null}

        {activeView === 'dashboard' ? (
          <DashboardModule activeOrders={activeOrders} orders={orders} pendingApprovals={pendingApprovals} technicians={technicians} onOpenOrder={openOrder} />
        ) : null}

        {activeView === 'orders' ? (
          <OrdersModule orders={filteredOrders} search={search} onSearch={setSearch} technicians={technicians} onNew={openNewOrder} onOpen={openOrder} />
        ) : null}

        {activeView === 'models' ? (
          <ModelsModule models={models} onNew={() => { setModelForm({ ...EMPTY_MODEL, itens: [{ ...EMPTY_MODEL.itens[0] }] }); setModelModal(true); }} />
        ) : null}

        {activeView === 'technicians' ? (
          <TeamModule technicians={technicians} currentRole={profile.papel} onNew={() => setUserModal(true)} onRoleChange={updateRole} />
        ) : null}

        {activeView === 'approvals' ? (
          <ApprovalsModule visits={visits} onSelect={setSelectedVisit} onApprove={approveVisit} onReopen={reopenVisit} />
        ) : null}

        {activeView === 'audit' ? (
          <AuditModule items={audit} />
        ) : null}

        {activeView === 'configuration' ? (
          <ConfigurationModule configuracao={configuracaoModular} loading={loading} onSave={saveModularConfiguration} />
        ) : null}
      </main>

      {userModal ? <CreateUserModal currentRole={profile.papel} loading={loading} onClose={() => setUserModal(false)} onSubmit={createTeamUser} /> : null}

      {selectedVisit ? <VisitDetailModal visit={selectedVisit} occurrences={occurrences} onClose={() => setSelectedVisit(null)} onApprove={approveVisit} onReopen={reopenVisit} /> : null}

      {orderModal ? <Modal title={orderForm.id ? 'Editar ordem' : 'Nova ordem'} onClose={() => setOrderModal(false)} wide><form className="form-grid" onSubmit={saveOrder}><label>Pedido<input value={orderForm.numero_pedido} onChange={(event) => setOrderField('numero_pedido', event.target.value)} required /></label><label>Cliente<input value={orderForm.cliente} onChange={(event) => setOrderField('cliente', event.target.value)} required /></label><label>Cidade<input value={orderForm.cidade} onChange={(event) => setOrderField('cidade', event.target.value)} /></label><label>Estado<input value={orderForm.estado} onChange={(event) => setOrderField('estado', event.target.value)} maxLength={2} /></label><label className="span-2">Endereço<input value={orderForm.endereco} onChange={(event) => setOrderField('endereco', event.target.value)} /></label><label>Responsável<input value={orderForm.responsavel} onChange={(event) => setOrderField('responsavel', event.target.value)} /></label><label>Técnico<select value={orderForm.tecnico_id} onChange={(event) => setOrderField('tecnico_id', event.target.value)}><option value="">Não atribuído</option>{technicians.filter((item) => item.ativo && item.papel === 'tecnico').map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label>Telefone<input value={orderForm.telefone} onChange={(event) => setOrderField('telefone', event.target.value)} /></label><label>E-mail<input type="email" value={orderForm.email} onChange={(event) => setOrderField('email', event.target.value)} /></label><label className="span-2">Observações<textarea value={orderForm.observacoes} onChange={(event) => setOrderField('observacoes', event.target.value)} /></label><div className="span-2 equipment-editor"><div className="subsection-title"><div><h3>Equipamentos</h3><p>Associe um modelo para impedir alterações no checklist pelo técnico.</p></div><button type="button" className="secondary-button" onClick={() => setOrderForm((current) => ({ ...current, equipamentos: [...current.equipamentos, { ...EMPTY_ORDER.equipamentos[0] }] }))}><Plus size={16} /> Equipamento</button></div>{orderForm.equipamentos.map((item, index) => <div className="equipment-row" key={index}><input placeholder="Nome" value={item.nome} onChange={(event) => setEquipmentField(index, 'nome', event.target.value)} /><input placeholder="Tag" value={item.tag} onChange={(event) => setEquipmentField(index, 'tag', event.target.value)} /><input placeholder="Modelo" value={item.modelo} onChange={(event) => setEquipmentField(index, 'modelo', event.target.value)} /><input placeholder="Série" value={item.serie} onChange={(event) => setEquipmentField(index, 'serie', event.target.value)} /><input type="number" min="1" placeholder="Qtd." value={item.quantidade} onChange={(event) => setEquipmentField(index, 'quantidade', event.target.value)} /><select value={item.modelo_checklist_id} onChange={(event) => setEquipmentField(index, 'modelo_checklist_id', event.target.value)}><option value="">Sem modelo</option>{models.map((model) => <option key={model.id} value={model.id}>{model.nome}</option>)}</select>{orderForm.equipamentos.length > 1 ? <button className="icon-button danger" type="button" onClick={() => setOrderForm((current) => ({ ...current, equipamentos: current.equipamentos.filter((_row, rowIndex) => rowIndex !== index) }))}><X size={18} /></button> : null}</div>)}</div><footer className="form-actions span-2"><button type="button" className="secondary-button" onClick={() => setOrderModal(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={loading}><Save size={18} /> Salvar e atribuir</button></footer></form></Modal> : null}

      {modelModal ? <Modal title="Novo modelo de checklist" onClose={() => setModelModal(false)} wide><form className="form-grid" onSubmit={saveModel}><label>Nome<input value={modelForm.nome} onChange={(event) => setModelForm((current) => ({ ...current, nome: event.target.value }))} required /></label><label>Categoria<input value={modelForm.categoria} onChange={(event) => setModelForm((current) => ({ ...current, categoria: event.target.value }))} /></label><label className="span-2">Descrição<textarea value={modelForm.descricao} onChange={(event) => setModelForm((current) => ({ ...current, descricao: event.target.value }))} /></label><div className="span-2 item-editor"><div className="subsection-title"><div><h3>Itens obrigatórios</h3><p>O técnico responderá sem poder editar o texto definido.</p></div><button className="secondary-button" type="button" onClick={() => setModelForm((current) => ({ ...current, itens: [...current.itens, { ...EMPTY_MODEL.itens[0] }] }))}><Plus size={16} /> Item</button></div>{modelForm.itens.map((item, index) => <div className="check-item-row" key={index}><input placeholder={`Item ${index + 1}`} value={item.texto} onChange={(event) => setModelForm((current) => ({ ...current, itens: current.itens.map((row, rowIndex) => rowIndex === index ? { ...row, texto: event.target.value } : row) }))} /><label className="check"><input type="checkbox" checked={item.exige_foto} onChange={(event) => setModelForm((current) => ({ ...current, itens: current.itens.map((row, rowIndex) => rowIndex === index ? { ...row, exige_foto: event.target.checked } : row) }))} /> Foto obrigatória</label><label className="check"><input type="checkbox" checked={item.exige_observacao} onChange={(event) => setModelForm((current) => ({ ...current, itens: current.itens.map((row, rowIndex) => rowIndex === index ? { ...row, exige_observacao: event.target.checked } : row) }))} /> Observação obrigatória</label></div>)}</div><footer className="form-actions span-2"><button type="button" className="secondary-button" onClick={() => setModelModal(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={loading}><Save size={18} /> Criar modelo</button></footer></form></Modal> : null}
    </div>
  );
}
