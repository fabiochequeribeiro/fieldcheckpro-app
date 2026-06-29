export const NOTIFICATION_CHANNELS = ['push', 'email', 'whatsapp', 'in_app'];

export function buildNotificationEvent({ type, title, message, empresa_id, usuario_id, severity = 'info', payload = {} }) {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    message,
    empresa_id: empresa_id || null,
    usuario_id: usuario_id || null,
    severity,
    payload,
    channels: ['in_app'],
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

export function getMockNotificationCenter() {
  return [
    buildNotificationEvent({ type: 'sync_error', title: 'Sincronizacao pendente', message: 'Existem registros locais aguardando envio.', severity: 'warning' }),
    buildNotificationEvent({ type: 'ai_recommendation', title: 'Recomendacao IA pronta', message: 'Uma sugestao de checklist aguarda revisao.', severity: 'info' }),
    buildNotificationEvent({ type: 'signature_missing', title: 'Assinatura faltando', message: 'Finalize a assinatura antes de encerrar a visita.', severity: 'critical' }),
  ];
}
