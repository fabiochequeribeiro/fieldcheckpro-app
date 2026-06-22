import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  MapPin,
  Printer,
  User,
  X,
} from 'lucide-react';
import { supabase } from '../supabase';
import './VisitDetailModal.css';

const BUCKET = 'fieldcheck-media';

function json(valor, fallback) {
  if (valor == null) return fallback;
  if (typeof valor !== 'string') return valor;
  try { return JSON.parse(valor); } catch { return fallback; }
}

function formatarData(valor) {
  if (!valor) return '-';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
}

function respostaClasse(resposta) {
  const valor = String(resposta || '').toUpperCase();
  if (valor === 'OK') return 'ok';
  if (['NAO', 'NÃO', 'NOK'].includes(valor)) return 'nao';
  if (['NA', 'N/A'].includes(valor)) return 'na';
  return 'pendente';
}

function origemDireta(valor) {
  if (!valor) return '';
  if (typeof valor === 'string' && (valor.startsWith('data:image') || valor.startsWith('https://'))) return valor;
  if (typeof valor === 'object') return valor.dataUri || (String(valor.uri || '').startsWith('https://') ? valor.uri : '');
  return '';
}

function caminhoMidia(valor) {
  if (!valor) return '';
  if (typeof valor === 'object') return valor.storage_path || valor.foto_path || '';
  if (typeof valor === 'string' && !valor.startsWith('data:') && !valor.startsWith('file:') && !valor.startsWith('content:') && !valor.startsWith('http')) return valor;
  return '';
}

function fotoDoItem(item, urls) {
  const direta = origemDireta(item?.foto) || origemDireta(item?.foto_path);
  if (direta) return direta;
  return urls[item?.foto_path] || '';
}

function localizacaoValida(localizacao) {
  return localizacao?.disponivel !== false && Number.isFinite(Number(localizacao?.latitude)) && Number.isFinite(Number(localizacao?.longitude));
}

function BlocoLocalizacao({ titulo, localizacao }) {
  if (!localizacaoValida(localizacao)) {
    return <article className="location-box unavailable"><MapPin size={20} /><div><strong>{titulo}</strong><span>Localização não registrada</span></div></article>;
  }
  const latitude = Number(localizacao.latitude);
  const longitude = Number(localizacao.longitude);
  const mapa = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  return (
    <article className="location-box">
      <MapPin size={20} />
      <div>
        <strong>{titulo}</strong>
        <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        <small>{formatarData(localizacao.capturado_em)}{localizacao.precisao_metros ? ` · precisão aproximada de ${Math.round(localizacao.precisao_metros)} m` : ''}</small>
      </div>
      <a href={mapa} target="_blank" rel="noreferrer" title="Abrir no mapa"><ExternalLink size={18} /></a>
    </article>
  );
}

function Foto({ src, legenda }) {
  if (!src) return null;
  return <figure className="evidence-photo"><img src={src} alt={legenda} /><figcaption>{legenda}</figcaption></figure>;
}

export default function VisitDetailModal({ visit, occurrences = [], onClose, onApprove, onReopen }) {
  const [urls, setUrls] = useState({});
  const [loadingMedia, setLoadingMedia] = useState(true);
  const equipamentos = useMemo(() => {
    const lista = json(visit?.equipamentos, []);
    return Array.isArray(lista) ? lista : [];
  }, [visit]);
  const dados = useMemo(() => json(visit?.dados, {}) || {}, [visit]);
  const resumo = useMemo(() => json(visit?.resumo, {}) || {}, [visit]);
  const localizacaoInicio = json(visit?.localizacao_inicio, null);
  const localizacaoEnvio = json(visit?.localizacao_envio, null);
  const ocorrenciasDaVisita = occurrences.filter((item) => String(item.numero_pedido || '') === String(visit?.numero_pedido || ''));

  useEffect(() => {
    let active = true;
    async function carregarMidias() {
      setLoadingMedia(true);
      const caminhos = new Set();
      equipamentos.forEach((equipamento) => {
        if (equipamento.foto_path) caminhos.add(equipamento.foto_path);
        (equipamento.itens || []).forEach((item) => { if (item.foto_path) caminhos.add(item.foto_path); });
      });
      if (visit?.assinatura_path) caminhos.add(visit.assinatura_path);
      ocorrenciasDaVisita.forEach((ocorrencia) => (json(ocorrencia.fotos, []) || []).forEach((foto) => {
        const caminho = caminhoMidia(foto);
        if (caminho) caminhos.add(caminho);
      }));

      const pares = await Promise.all([...caminhos].map(async (caminho) => {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 3600);
        return [caminho, error ? '' : data?.signedUrl || ''];
      }));
      if (active) {
        setUrls(Object.fromEntries(pares));
        setLoadingMedia(false);
      }
    }
    carregarMidias();
    return () => { active = false; };
  }, [visit?.id]);

  if (!visit) return null;
  const status = String(visit.status || '').toLowerCase();
  const assinaturaSrc = origemDireta(visit.assinatura) || urls[visit.assinatura_path] || '';

  return (
    <div className="modal-backdrop report-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="visit-report report-print-root" onMouseDown={(event) => event.stopPropagation()}>
        <header className="report-toolbar no-print">
          <div><span>Relatório de campo</span><strong>{visit.numero_pedido || visit.numero_os}</strong></div>
          <div className="report-toolbar-actions">
            <button className="secondary-button" onClick={() => window.print()}><Printer size={18} /> Imprimir / PDF</button>
            <button className="icon-button" onClick={onClose} title="Fechar"><X size={20} /></button>
          </div>
        </header>

        <div className="report-document">
          <div className="report-title">
            <div><span className="eyebrow">FieldCheck Pro</span><h1>Relatório de Serviço Técnico</h1><p>{visit.numero_os || visit.numero_pedido}</p></div>
            <span className={`status ${status}`}>{status || 'sem status'}</span>
          </div>

          <div className="report-summary-grid">
            <article><FileText /><div><span>Pedido</span><strong>{visit.numero_pedido || '-'}</strong></div></article>
            <article><User /><div><span>Técnico</span><strong>{visit.tecnico || '-'}</strong></div></article>
            <article><Clock3 /><div><span>Enviado</span><strong>{formatarData(visit.enviado_em || visit.created_at)}</strong></div></article>
            <article><CheckCircle2 /><div><span>Resultado</span><strong>{visit.total_ok || resumo.ok || 0} OK · {visit.total_nao || resumo.nao || 0} NC</strong></div></article>
          </div>

          <section className="report-section">
            <h2>Cliente e atendimento</h2>
            <dl className="report-data-grid">
              <div><dt>Cliente</dt><dd>{visit.cliente || dados.cliente || '-'}</dd></div>
              <div><dt>Responsável</dt><dd>{dados.responsavel || '-'}</dd></div>
              <div><dt>Cidade</dt><dd>{visit.cidade || dados.cidade || '-'}</dd></div>
              <div><dt>Endereço</dt><dd>{dados.endereco || '-'}</dd></div>
              <div><dt>Data informada</dt><dd>{visit.data_visita || dados.data || '-'}</dd></div>
              <div><dt>Contato</dt><dd>{dados.telefone || dados.contato || dados.emailCliente || '-'}</dd></div>
            </dl>
            {visit.observacoes || dados.observacoes ? <div className="report-note"><strong>Observações gerais</strong><p>{visit.observacoes || dados.observacoes}</p></div> : null}
          </section>

          <section className="report-section">
            <h2>Geolocalização registrada</h2>
            <div className="location-grid">
              <BlocoLocalizacao titulo="Início da atividade" localizacao={localizacaoInicio} />
              <BlocoLocalizacao titulo="Envio do relatório" localizacao={localizacaoEnvio} />
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-heading"><h2>Checklist e evidências</h2>{loadingMedia ? <span>Carregando imagens...</span> : null}</div>
            <div className="equipment-report-list">
              {equipamentos.length ? equipamentos.map((equipamento, equipamentoIndex) => (
                <article className="equipment-report" key={`${equipamento.tag || equipamento.nome}-${equipamentoIndex}`}>
                  <header><div><span>Equipamento {equipamentoIndex + 1}</span><h3>{equipamento.nome || equipamento.tipo || 'Equipamento'}</h3></div><small>{equipamento.tag || equipamento.serie || equipamento.modelo || ''}</small></header>
                  <Foto src={origemDireta(equipamento.foto) || urls[equipamento.foto_path]} legenda={`Foto de ${equipamento.nome || equipamento.tipo || 'equipamento'}`} />
                  <div className="checklist-report">
                    {(equipamento.itens || []).filter((item) => item.ativo !== false).map((item, itemIndex) => {
                      const classe = respostaClasse(item.resposta);
                      return (
                        <div className="checklist-report-item" key={itemIndex}>
                          <span className={`answer ${classe}`}>{item.resposta || 'Pendente'}</span>
                          <div><strong>{item.texto || item.item || `Item ${itemIndex + 1}`}</strong>{item.obs || item.observacao ? <p>{item.obs || item.observacao}</p> : null}<Foto src={fotoDoItem(item, urls)} legenda={`Evidência do item ${itemIndex + 1}`} /></div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              )) : <div className="empty-report">Nenhum equipamento detalhado foi recebido.</div>}
            </div>
          </section>

          <section className="report-section">
            <h2>Ocorrências vinculadas</h2>
            {ocorrenciasDaVisita.length ? <div className="occurrence-report-list">{ocorrenciasDaVisita.map((ocorrencia) => (
              <article key={ocorrencia.id || ocorrencia.local_id}>
                <header><AlertTriangle size={19} /><div><strong>{ocorrencia.tipo_ocorrencia || 'Ocorrência'}</strong><span>{ocorrencia.urgencia || 'Normal'} · {formatarData(ocorrencia.created_at)}</span></div><b>{ocorrencia.status || 'aberta'}</b></header>
                <p>{ocorrencia.descricao || '-'}</p>
                <dl><div><dt>Equipamento</dt><dd>{ocorrencia.equipamento || '-'}</dd></div><div><dt>Peça</dt><dd>{ocorrencia.peca || '-'}</dd></div><div><dt>Quantidade</dt><dd>{ocorrencia.quantidade || '-'}</dd></div></dl>
                <div className="photo-gallery">{(json(ocorrencia.fotos, []) || []).map((foto, index) => <Foto key={index} src={origemDireta(foto) || urls[caminhoMidia(foto)]} legenda={`Foto da ocorrência ${index + 1}`} />)}</div>
              </article>
            ))}</div> : <div className="empty-report">Nenhuma ocorrência vinculada a este pedido.</div>}
          </section>

          <section className="report-section signature-section">
            <h2>Assinatura do cliente ou responsável</h2>
            {assinaturaSrc ? <img src={assinaturaSrc} alt="Assinatura" /> : <div className="empty-report">Assinatura não disponível no portal.</div>}
          </section>
        </div>

        <footer className="report-actions no-print">
          <button className="secondary-button" onClick={() => onReopen(visit)}>Reabrir com justificativa</button>
          {status !== 'aprovado' ? <button className="primary-button" onClick={() => onApprove(visit)}>Aprovar serviço</button> : null}
        </footer>
      </section>
    </div>
  );
}
