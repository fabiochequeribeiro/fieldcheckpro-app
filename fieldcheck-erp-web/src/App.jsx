import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  HelpCircle,
  Bell,
  Bot,
  Boxes,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  RefreshCw,
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
import OrderForm from './components/OrderForm';
import ModelForm from './components/ModelForm';
import ConfigurationModule from './modules/configuration/ConfigurationModule';
import { carregarConfiguracaoModularPortal, salvarConfiguracaoModularPortal } from './services/configuracaoModularService';
import { MODULOS, moduloEstaAtivo, normalizarConfiguracaoModular, rotuloModulo } from './shared/modulosFieldCheck';
import DashboardModule from './modules/dashboard/DashboardModule';
import OrdersModule from './modules/orders/OrdersModule';
import ModelsModule from './modules/models/ModelsModule';
import TeamModule from './modules/team/TeamModule';
import ApprovalsModule from './modules/approvals/ApprovalsModule';
import AuditModule from './modules/audit/AuditModule';
import HelpModule from './modules/help/HelpModule';
import SuperAdminModule from './modules/superadmin/SuperAdminModule';
import AiAssistantModule from './modules/ai/AiAssistantModule';
import CommandCenterModule from './modules/command/CommandCenterModule';
import CompaniesModule from './modules/companies/CompaniesModule';
import LicensesModule from './modules/licenses/LicensesModule';
import ClientsModule from './modules/clients/ClientsModule';
import EquipmentModule from './modules/equipment/EquipmentModule';
import ReportsModule from './modules/reports/ReportsModule';
import NotificationsModule from './modules/notifications/NotificationsModule';
import { normalizeStatus } from './shared/status';
import { generateChecklistModelSuggestions } from './services/aiChecklistService';
import { applyFieldCheckHubTheme } from './theme/fieldCheckHubTheme';

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
  tag: '',
  categoria: 'Geral',
  descricao: '',
  itens: [{ texto: '', exige_foto: false, exige_observacao: false }],
};

function normalizarTag(value) {
  return String(value || '').trim().toUpperCase();
}

function Login({ loading, error, onSubmit }) {
  const [email, setEmail] = useState(() => localStorage.getItem('fieldcheck-hub-email') || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('fieldcheck-hub-email')));

  return (
    <main className="login-page">
      <section className="login-panel">
        <img src="/logo.png" className="login-logo" alt="FieldCheck Pro" />
        <div>
          <span className="eyebrow">FieldCheck Hub</span>
          <h1>Bem-vindo ao FieldCheck Hub</h1>
          <p>Gestão inteligente das empresas, equipes, módulos, checklists e operações em campo.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (remember) localStorage.setItem('fieldcheck-hub-email', email.trim().toLowerCase());
            else localStorage.removeItem('fieldcheck-hub-email');
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
          <label className="remember-row">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            Lembrar meu e-mail neste dispositivo
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
  const [activeView, setActiveView] = useState('command');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [models, setModels] = useState([]);
  const [visits, setVisits] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [platformModules, setPlatformModules] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [actionVisitId, setActionVisitId] = useState('');
  const [audit, setAudit] = useState([]);
  const [orderModal, setOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER);
  const [modelModal, setModelModal] = useState(false);
  const [modelForm, setModelForm] = useState(EMPTY_MODEL);
  const [userModal, setUserModal] = useState(false);
  const [configuracaoModular, setConfiguracaoModular] = useState(() => normalizarConfiguracaoModular());

  const currentRole = profile?.perfil || profile?.papel || 'tecnico';
  const isSuperAdmin = currentRole === 'super_admin';
  const isManager = ['super_admin', 'admin_empresa', 'administrador', 'supervisor'].includes(currentRole);
  const company = profile?.empresa || '';
  const companyId = profile?.empresa_id || '';
  const activeCompanyId = isSuperAdmin ? selectedCompanyId : companyId;
  const activeCompany = isSuperAdmin ? companies.find((item) => item.id === selectedCompanyId) : null;
  const activeCompanyName = activeCompany?.nome || company;

  useEffect(() => {
    document.title = 'FieldCheck Hub | Centro Inteligente de Operacoes';
    applyFieldCheckHubTheme();
  }, []);

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
    if ((profile?.empresa_id || profile?.empresa || isSuperAdmin) && isManager) loadData();
  }, [profile?.empresa_id, profile?.empresa, currentRole, selectedCompanyId]);

  useEffect(() => {
    if (!isSuperAdmin || !selectedCompanyId) return;
    const selectedCompany = companies.find((item) => item.id === selectedCompanyId);
    carregarConfiguracaoModularPortal({ empresaId: selectedCompanyId, empresa: selectedCompany?.nome || '' })
      .then(setConfiguracaoModular)
      .catch(() => setConfiguracaoModular(normalizarConfiguracaoModular()));
  }, [isSuperAdmin, selectedCompanyId, companies.length]);

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
      .select('id,user_id,nome,email,empresa,empresa_id,papel,perfil,ativo,bloqueado')
      .eq('email', String(user.email || '').toLowerCase())
      .eq('ativo', true)
      .maybeSingle();
    if (error || !data) {
      setAuthError('Usuário sem perfil ativo na tabela de técnicos.');
      await supabase.auth.signOut();
    } else {
      setProfile(data);
      if ((data.perfil || data.papel) === 'super_admin') setSelectedCompanyId('');
      setConfiguracaoModular(await carregarConfiguracaoModularPortal({ empresaId: data.empresa_id, empresa: data.empresa }));
    }
    setAuthLoading(false);
  }

  function applyTenantFilter(query) {
    if (isSuperAdmin && !activeCompanyId) return query;
    if (activeCompanyId) return query.eq('empresa_id', activeCompanyId);
    if (company) return query.eq('empresa', company);
    return query;
  }

  async function loadData() {
    setLoading(true);
    setMessage('');
    const [companyResult, moduleResult, orderResult, techResult, modelResult, visitResult, occurrenceResult, auditResult] = await Promise.all([
      isSuperAdmin ? supabase.from('empresas').select('*').order('nome') : Promise.resolve({ data: [], error: null }),
      isSuperAdmin ? supabase.from('fieldcheck_modulos').select('*').eq('ativo', true).order('ordem') : Promise.resolve({ data: [], error: null }),
      applyTenantFilter(supabase.from('pedidos').select('*')).order('created_at', { ascending: false }),
      applyTenantFilter(supabase.from('tecnicos').select('id,nome,email,empresa,empresa_id,papel,perfil,ativo,user_id,bloqueado')).order('nome'),
      applyTenantFilter(supabase.from('modelos_checklist_genericos').select('*, modelos_checklist_genericos_itens(*)')).order('nome'),
      applyTenantFilter(supabase.from('visitas').select('*')).order('created_at', { ascending: false }),
      applyTenantFilter(supabase.from('ocorrencias_obra').select('*')).order('created_at', { ascending: false }),
      applyTenantFilter(supabase.from('auditoria_servicos').select('*')).order('criado_em', { ascending: false }).limit(100),
    ]);
    const error = companyResult.error || moduleResult.error || orderResult.error || techResult.error || modelResult.error || visitResult.error || occurrenceResult.error || auditResult.error;
    if (error) setMessage(error.message || 'Falha ao carregar dados. Execute a migração do Supabase.');
    setCompanies(companyResult.data || []);
    setPlatformModules(moduleResult.data || []);
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
      const saved = await salvarConfiguracaoModularPortal({ empresaId: activeCompanyId || companyId, empresa: activeCompanyName }, nextConfiguration);
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
    const targetCompanyId = activeCompanyId || order.empresa_id || companyId;
    const targetCompany = order.empresa || company;
    let equipmentQuery = supabase
      .from('equipamentos')
      .select('*')
      .eq('numero_pedido', order.numero_pedido);
    equipmentQuery = targetCompanyId ? equipmentQuery.eq('empresa_id', targetCompanyId) : equipmentQuery.eq('empresa', targetCompany);
    const { data } = await equipmentQuery.order('id');
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

  function applyModelToEquipment(index, modelId) {
    const model = models.find((item) => String(item.id) === String(modelId));
    setOrderForm((current) => ({
      ...current,
      equipamentos: current.equipamentos.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (!model) return { ...item, modelo_checklist_id: '', tag: normalizarTag(item.tag) };
        return {
          ...item,
          modelo_checklist_id: model.id,
          tag: normalizarTag(model.tag || item.tag),
          nome: item.nome || model.nome || '',
          modelo: item.modelo || model.categoria || '',
        };
      }),
    }));
  }

  function matchTagToModel(index, tag) {
    const normalizedTag = normalizarTag(tag);
    if (!normalizedTag) return;
    const model = models.find((item) => normalizarTag(item.tag) === normalizedTag);
    if (model) applyModelToEquipment(index, model.id);
    else setEquipmentField(index, 'tag', normalizedTag);
  }

  function addEquipmentFromModel(model) {
    setOrderForm((current) => ({
      ...current,
      equipamentos: [
        ...current.equipamentos,
        {
          nome: model.nome || '',
          tag: normalizarTag(model.tag),
          modelo: model.categoria || '',
          serie: '',
          quantidade: '1',
          modelo_checklist_id: model.id,
        },
      ],
    }));
  }

  async function saveOrder(event) {
    event.preventDefault();
    if (isSuperAdmin && !activeCompanyId) {
      setMessage('Selecione uma empresa no painel Super Admin antes de criar ordens.');
      return;
    }
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
      empresa: activeCompanyName,
      empresa_id: activeCompanyId || companyId || null,
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
      let deleteEquipments = supabase.from('equipamentos').delete().eq('numero_pedido', saved.numero_pedido);
      deleteEquipments = (activeCompanyId || companyId)
        ? deleteEquipments.eq('empresa_id', activeCompanyId || companyId)
        : deleteEquipments.eq('empresa', activeCompanyName);
      await deleteEquipments;
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
          empresa: activeCompanyName,
          empresa_id: activeCompanyId || companyId || null,
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
    if (isSuperAdmin && !activeCompanyId) {
      setMessage('Selecione uma empresa no painel Super Admin antes de criar padrões de checklist.');
      return;
    }
    setLoading(true);
    setMessage('');
    const tag = normalizarTag(modelForm.tag);
    if (!tag) {
      setLoading(false);
      setMessage('Informe a tag do equipamento para reutilizar este padrão.');
      return;
    }
    const duplicatedTag = models.some((model) => normalizarTag(model.tag) === tag);
    if (duplicatedTag) {
      setLoading(false);
      setMessage(`A tag ${tag} já existe. Use outra tag ou edite o padrão existente.`);
      return;
    }
    const modelId = crypto.randomUUID();
    const { error } = await supabase.from('modelos_checklist_genericos').insert({
      id: modelId,
      nome: modelForm.nome.trim(),
      tag,
      categoria: modelForm.categoria.trim(),
      descricao: modelForm.descricao.trim(),
      empresa: activeCompanyName,
      empresa_id: activeCompanyId || companyId || null,
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
        empresa: activeCompanyName,
        empresa_id: activeCompanyId || companyId || null,
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
    setMessage(`Padrão ${tag} criado. Ele já pode ser usado nos equipamentos das ordens.`);
    await loadData();
  }

  function changeModelItem(index, field, value) {
    setModelForm((current) => ({
      ...current,
      itens: current.itens.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row),
    }));
  }

  function generateAiModelSuggestions() {
    const hasEquipmentPhoto = window.confirm(
      'Existe foto do equipamento para apoiar a IA?\\n\\nOK = gerar considerando foto do equipamento.\\nCancelar = gerar sugestoes sem foto. O cadastro manual continua funcionando.'
    );
    const suggestions = generateChecklistModelSuggestions(modelForm, { hasEquipmentPhoto });
    if (!suggestions.length) {
      setMessage('A IA nao encontrou novos itens para este modelo. Voce pode continuar cadastrando manualmente.');
      return;
    }
    setModelForm((current) => {
      const existing = new Set((current.itens || []).map((item) => String(item.texto || '').trim().toLowerCase()));
      const nextItems = [
        ...current.itens.filter((item) => String(item.texto || '').trim()),
        ...suggestions.filter((item) => !existing.has(String(item.texto || '').trim().toLowerCase())),
      ];
      return { ...current, itens: nextItems.length ? nextItems : current.itens };
    });
    setMessage(`${suggestions.length} sugestao(oes) de checklist adicionada(s). Revise antes de salvar o padrao.`);
  }

  async function createCompany(form) {
    setLoading(true);
    setMessage('');
    const payload = {
      nome: form.nome.trim(),
      slug: form.slug.trim(),
      documento: form.documento.trim() || null,
      email_responsavel: form.email_responsavel.trim() || null,
      telefone: form.telefone.trim() || null,
      plano: form.plano,
      status: form.status,
      modulos: form.modulos,
      atualizada_em: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('empresas').insert(payload).select('*').single();
    if (!error && data) {
      const moduleRows = (form.modulos || []).map((modulo) => ({ empresa_id: data.id, modulo_id: modulo, ativo: true }));
      if (moduleRows.length) await supabase.from('empresa_modulos').upsert(moduleRows, { onConflict: 'empresa_id,modulo_id' });
    }
    setLoading(false);
    setMessage(error ? error.message : 'Empresa cadastrada com sucesso.');
    if (!error) await loadData();
  }

  async function updateCompany(companyRow, changes) {
    setLoading(true);
    setMessage('');
    const { error } = await supabase
      .from('empresas')
      .update({ plano: changes.plano, status: changes.status, modulos: changes.modulos, atualizada_em: new Date().toISOString() })
      .eq('id', companyRow.id);
    if (!error) {
      const activeRows = (changes.modulos || []).map((modulo) => ({ empresa_id: companyRow.id, modulo_id: modulo, ativo: true }));
      await supabase.from('empresa_modulos').update({ ativo: false }).eq('empresa_id', companyRow.id);
      if (activeRows.length) await supabase.from('empresa_modulos').upsert(activeRows, { onConflict: 'empresa_id,modulo_id' });
    }
    setLoading(false);
    setMessage(error ? error.message : 'Empresa atualizada.');
    if (!error) await loadData();
  }

  async function updateRole(technician, role) {
    const legacyRole = role === 'admin_empresa' ? 'administrador' : role;
    const { error } = await supabase.from('tecnicos').update({ perfil: role, papel: legacyRole, updated_at: new Date().toISOString() }).eq('id', technician.id);
    setMessage(error ? error.message : 'Permissão atualizada.');
    if (!error) await loadData();
  }

  async function createTeamUser(form) {
    if (isSuperAdmin && !activeCompanyId) {
      throw new Error('Selecione uma empresa no painel Super Admin antes de criar usuarios.');
    }
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.functions.invoke('criar-usuario-empresa', {
      body: { ...form, empresa_id: activeCompanyId || companyId || null },
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
    if (!visit?.id) {
      setMessage('Não foi possível aprovar: visita sem ID no portal.');
      return;
    }

    setActionVisitId(visit.id);
    setLoading(true);
    setMessage('Aprovando serviço...');

    const payload = {
      status: 'aprovado',
      finalizado: true,
      aprovado_em: new Date().toISOString(),
      aprovado_por: session.user.id,
    };

    const { data, error } = await supabase
      .from('visitas')
      .update(payload)
      .eq('id', visit.id)
      .select('id,status,finalizado,aprovado_em,aprovado_por')
      .maybeSingle();

    setActionVisitId('');
    setLoading(false);

    if (error) {
      setMessage(`Falha ao aprovar: ${error.message}`);
      return;
    }

    if (!data) {
      setMessage('A aprovação não foi aplicada. Verifique se seu usuário tem permissão/RLS para atualizar esta visita ou se a empresa selecionada está correta.');
      return;
    }

    setVisits((current) => current.map((item) => String(item.id) === String(visit.id) ? { ...item, ...payload } : item));
    setSelectedVisit(null);
    setMessage('Serviço aprovado e bloqueado.');
    await loadData();
  }

  async function reopenVisit(visit) {
    const reason = window.prompt('Informe a justificativa obrigatória para reabrir este serviço:');
    if (!reason?.trim()) return;
    if (!visit?.id) {
      setMessage('Não foi possível reabrir: visita sem ID no portal.');
      return;
    }

    setActionVisitId(visit.id);
    setLoading(true);
    setMessage('Reabrindo serviço...');

    const payload = {
      status: 'reaberto',
      finalizado: false,
      reaberto_em: new Date().toISOString(),
      reaberto_por: session.user.id,
      motivo_reabertura: reason.trim(),
    };

    const { data, error } = await supabase
      .from('visitas')
      .update(payload)
      .eq('id', visit.id)
      .select('id,status,finalizado,reaberto_em,reaberto_por,motivo_reabertura')
      .maybeSingle();

    setActionVisitId('');
    setLoading(false);

    if (error) {
      setMessage(`Falha ao reabrir: ${error.message}`);
      return;
    }

    if (!data) {
      setMessage('A reabertura não foi aplicada. Verifique permissão/RLS para atualizar esta visita.');
      return;
    }

    setVisits((current) => current.map((item) => String(item.id) === String(visit.id) ? { ...item, ...payload } : item));
    setSelectedVisit(null);
    setMessage('Serviço reaberto com justificativa registrada.');
    await loadData();
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

  const supervisorViews = new Set(['command', 'dashboard', 'orders', 'clients', 'equipment', 'reports', 'notifications', 'approvals', 'audit', 'ai', 'help']);
  const navItems = [
    ['command', 'Command Center', Network, null],
    ['dashboard', rotuloModulo(configuracaoModular, MODULOS.DASHBOARD), LayoutDashboard, MODULOS.DASHBOARD],
    ['orders', rotuloModulo(configuracaoModular, MODULOS.ORDENS), ClipboardList, MODULOS.ORDENS],
    ['clients', 'Clientes', BriefcaseBusiness, null],
    ['equipment', 'Equipamentos', Boxes, null],
    ['models', rotuloModulo(configuracaoModular, MODULOS.CHECKLISTS), ClipboardCheck, MODULOS.CHECKLISTS],
    ['technicians', rotuloModulo(configuracaoModular, MODULOS.EQUIPE), Users, MODULOS.EQUIPE],
    ['reports', 'Relatorios', ChartNoAxesCombined, null],
    ['notifications', 'Notificacoes', Bell, null],
    ['approvals', rotuloModulo(configuracaoModular, MODULOS.APROVACOES), CheckCircle2, MODULOS.APROVACOES],
    ['audit', rotuloModulo(configuracaoModular, MODULOS.AUDITORIA), FileClock, MODULOS.AUDITORIA],
  ].filter(([id, , , modulo]) => currentRole !== 'supervisor' || supervisorViews.has(id))
    .filter(([, , , modulo]) => moduloEstaAtivo(configuracaoModular, modulo, currentRole));
  if (isSuperAdmin) navItems.unshift(['superadmin', 'Super Admin', Building2, null]);
  if (['super_admin', 'admin_empresa', 'administrador'].includes(currentRole)) navItems.push(['companies', 'Empresas', Building2, null]);
  if (['super_admin', 'admin_empresa', 'administrador'].includes(currentRole)) navItems.push(['licenses', 'Licencas', ShieldCheck, null]);
  navItems.push(['ai', 'IA Assistente', Bot, null]);
  navItems.push(['help', 'Ajuda', HelpCircle, null]);
  if (['super_admin', 'admin_empresa', 'administrador'].includes(currentRole)) navItems.push(['configuration', 'Configuração', Settings2, null]);

  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand"><img src="/logo.png" alt="" /><div><strong>FieldCheck Hub</strong><span>Centro Inteligente</span></div></div>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button key={id} className={activeView === id ? 'active' : ''} onClick={() => { setActiveView(id); setMenuOpen(false); }}>
              <Icon size={19} /> {label}
              {id === 'approvals' && pendingApprovals.length ? <b>{pendingApprovals.length}</b> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-user"><UserCog size={20} /><div><strong>{profile.nome}</strong><span>{currentRole}</span></div></div>
        <button className="logout-button" onClick={() => supabase.auth.signOut()}><LogOut size={18} /> Sair</button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen((value) => !value)}><Menu /></button>
          <div><span className="eyebrow">FieldCheck Pro • Portal Corporativo</span><h1>{navItems.find(([id]) => id === activeView)?.[1]}</h1>{activeCompanyName ? <p className="topbar-subtitle">Empresa ativa: {activeCompanyName}</p> : null}</div>
          {isSuperAdmin ? (
            <label className="company-switcher">
              Empresa
              <select value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)}>
                <option value="">Todas as empresas</option>
                {companies.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
          ) : null}
          <button className="icon-button" title="Atualizar" onClick={loadData}><RefreshCw className={loading ? 'spin' : ''} size={20} /></button>
        </header>

        {message ? <div className="notice" onClick={() => setMessage('')}>{message}<X size={17} /></div> : null}

        {activeView === 'command' ? (
          <CommandCenterModule
            orders={orders}
            visits={visits}
            occurrences={occurrences}
            technicians={technicians}
            companies={companies}
            activeCompanyName={activeCompanyName}
            pendingApprovals={pendingApprovals}
            onOpenOrder={openOrder}
          />
        ) : null}

        {activeView === 'dashboard' ? (
          <DashboardModule
            activeOrders={activeOrders}
            orders={orders}
            visits={visits}
            occurrences={occurrences}
            pendingApprovals={pendingApprovals}
            technicians={technicians}
            companies={companies}
            onOpenOrder={openOrder}
          />
        ) : null}

        {activeView === 'superadmin' ? (
          <SuperAdminModule
            companies={companies}
            modules={platformModules}
            selectedCompanyId={selectedCompanyId}
            loading={loading}
            onSelectCompany={setSelectedCompanyId}
            onCreateCompany={createCompany}
            onUpdateCompany={updateCompany}
          />
        ) : null}

        {activeView === 'orders' ? (
          <OrdersModule orders={filteredOrders} search={search} onSearch={setSearch} technicians={technicians} onNew={openNewOrder} onOpen={openOrder} />
        ) : null}

        {activeView === 'clients' ? (
          <ClientsModule orders={orders} visits={visits} occurrences={occurrences} />
        ) : null}

        {activeView === 'equipment' ? (
          <EquipmentModule orders={orders} models={models} />
        ) : null}

        {activeView === 'models' ? (
          <ModelsModule models={models} onNew={() => { setModelForm({ ...EMPTY_MODEL, itens: [{ ...EMPTY_MODEL.itens[0] }] }); setModelModal(true); }} />
        ) : null}

        {activeView === 'technicians' ? (
          <TeamModule technicians={technicians} currentRole={currentRole} onNew={() => setUserModal(true)} onRoleChange={updateRole} />
        ) : null}

        {activeView === 'reports' ? (
          <ReportsModule visits={visits} orders={orders} pendingApprovals={pendingApprovals} />
        ) : null}

        {activeView === 'notifications' ? (
          <NotificationsModule orders={orders} visits={visits} occurrences={occurrences} />
        ) : null}

        {activeView === 'approvals' ? (
          <ApprovalsModule visits={visits} onSelect={setSelectedVisit} onApprove={approveVisit} onReopen={reopenVisit} actionVisitId={actionVisitId} />
        ) : null}

        {activeView === 'audit' ? (
          <AuditModule items={audit} />
        ) : null}

        {activeView === 'ai' ? (
          <AiAssistantModule companies={companies} orders={orders} visits={visits} technicians={technicians} occurrences={occurrences} />
        ) : null}

        {activeView === 'companies' ? (
          <CompaniesModule companies={companies} technicians={technicians} orders={orders} />
        ) : null}

        {activeView === 'licenses' ? (
          <LicensesModule companies={companies} technicians={technicians} />
        ) : null}

        {activeView === 'help' ? (
          <HelpModule />
        ) : null}

        {activeView === 'configuration' ? (
          <ConfigurationModule configuracao={configuracaoModular} loading={loading} onSave={saveModularConfiguration} />
        ) : null}
      </main>

      {userModal ? <CreateUserModal currentRole={currentRole} loading={loading} onClose={() => setUserModal(false)} onSubmit={createTeamUser} /> : null}

      {selectedVisit ? <VisitDetailModal visit={selectedVisit} occurrences={occurrences} onClose={() => setSelectedVisit(null)} onApprove={approveVisit} onReopen={reopenVisit} /> : null}

      {orderModal ? <Modal title={orderForm.id ? 'Editar ordem' : 'Nova ordem'} onClose={() => setOrderModal(false)} wide><OrderForm orderForm={orderForm} technicians={technicians} models={models} loading={loading} onSubmit={saveOrder} onCancel={() => setOrderModal(false)} onOrderField={setOrderField} onEquipmentField={setEquipmentField} onSetOrderForm={setOrderForm} onApplyModel={applyModelToEquipment} onMatchTag={matchTagToModel} onAddEquipmentFromModel={addEquipmentFromModel} /></Modal> : null}

      {modelModal ? <Modal title="Novo padrão por tag" onClose={() => setModelModal(false)} wide><ModelForm modelForm={modelForm} loading={loading} onSubmit={saveModel} onCancel={() => setModelModal(false)} onChange={setModelForm} onChangeItem={changeModelItem} onGenerateAiSuggestions={generateAiModelSuggestions} onAddItem={() => setModelForm((current) => ({ ...current, itens: [...current.itens, { ...EMPTY_MODEL.itens[0] }] }))} /></Modal> : null}
    </div>
  );
}
