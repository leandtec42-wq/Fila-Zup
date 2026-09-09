import { prisma } from '@/lib/prisma';
import type { WhatsAppMessageType } from '@/lib/enums';

/**
 * WhatsAppService — integração real com o WhatsApp via Twilio (Sandbox / API).
 *
 * Este serviço NUNCA simula envio como se fosse real. Se as credenciais
 * (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM) não estiverem
 * configuradas no .env, o serviço entra em "modo desenvolvimento": a mensagem
 * é registrada no banco (WhatsAppMessage) com status LOGGED_DEV_MODE e o
 * conteúdo é impresso no console, mas nenhuma chamada de rede é feita.
 *
 * Quando as credenciais estão presentes, o envio é feito via HTTPS para a
 * API REST da Twilio (api.twilio.com). Veja o passo a passo de configuração
 * em docs/WHATSAPP.md.
 */

function isConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM
  );
}

type SendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  devMode: boolean;
};

/**
 * Faz a chamada HTTP real para a API da Twilio.
 * Referência: https://www.twilio.com/docs/whatsapp/api
 */
async function sendViaTwilio(to: string, text: string): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const body = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    Body: text,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || `Falha ao enviar mensagem (HTTP ${response.status})`;
      return { ok: false, error: message, devMode: false };
    }

    return { ok: true, providerMessageId: data?.sid, devMode: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao chamar a API da Twilio';
    return { ok: false, error: message, devMode: false };
  }
}

async function logMessage(params: {
  queueEntryId: string;
  eventId: string;
  phone: string;
  messageType: WhatsAppMessageType;
  status: 'SENT' | 'FAILED' | 'LOGGED_DEV_MODE';
  providerMessageId?: string;
  error?: string;
  payload: unknown;
}) {
  await prisma.whatsAppMessage.create({
    data: {
      queueEntryId: params.queueEntryId,
      eventId: params.eventId,
      phone: params.phone,
      messageType: params.messageType,
      status: params.status,
      providerMessageId: params.providerMessageId,
      error: params.error,
      payload: JSON.stringify(params.payload),
      sentAt: params.status === 'SENT' || params.status === 'LOGGED_DEV_MODE' ? new Date() : null,
    },
  });
}

async function dispatch(params: {
  queueEntryId: string;
  eventId: string;
  phone: string;
  messageType: WhatsAppMessageType;
  text: string;
}): Promise<SendResult> {
  const { queueEntryId, eventId, phone, messageType, text } = params;

  if (!isConfigured()) {
    // Modo desenvolvimento: não fingimos que a API está configurada.
    // eslint-disable-next-line no-console
    console.log(
      `[WhatsApp - MODO DEV, credenciais não configuradas] Para ${phone}: "${text}"`
    );
    await logMessage({
      queueEntryId,
      eventId,
      phone,
      messageType,
      status: 'LOGGED_DEV_MODE',
      payload: { text, mode: 'dev' },
    });
    return { ok: true, devMode: true };
  }

  const result = await sendViaTwilio(phone, text);

  await logMessage({
    queueEntryId,
    eventId,
    phone,
    messageType,
    status: result.ok ? 'SENT' : 'FAILED',
    providerMessageId: result.providerMessageId,
    error: result.error,
    payload: { text },
  });

  return result;
}

export const WhatsAppService = {
  isConfigured,

  /**
   * Enviada assim que o participante entra na fila.
   */
  async sendQueueJoinedMessage(params: {
    queueEntryId: string;
    eventId: string;
    phone: string;
    name: string;
    eventName: string;
    queueNumber: number;
    position: number;
  }): Promise<SendResult> {
    const text =
      `Olá, ${params.name}! 🎉\n` +
      `Você entrou na fila do evento "${params.eventName}".\n` +
      `Sua senha: #${String(params.queueNumber).padStart(3, '0')}\n` +
      `Posição atual: ${params.position}º lugar\n\n` +
      `Fique atento ao seu WhatsApp — avisaremos quando sua vez estiver próxima.`;

    return dispatch({
      queueEntryId: params.queueEntryId,
      eventId: params.eventId,
      phone: params.phone,
      messageType: 'QUEUE_JOINED',
      text,
    });
  },

  /**
   * Enviada quando a posição do participante muda de forma relevante.
   */
  async sendPositionUpdateMessage(params: {
    queueEntryId: string;
    eventId: string;
    phone: string;
    name: string;
    eventName: string;
    newPosition: number;
  }): Promise<SendResult> {
    const text =
      `Olá, ${params.name}! Atualização da fila do evento "${params.eventName}":\n` +
      `Agora você está em ${params.newPosition}º lugar. Continue atento ao WhatsApp!`;

    return dispatch({
      queueEntryId: params.queueEntryId,
      eventId: params.eventId,
      phone: params.phone,
      messageType: 'POSITION_UPDATE',
      text,
    });
  },

  /**
   * Enviada quando o participante é chamado para atendimento.
   */
  async sendCalledMessage(params: {
    queueEntryId: string;
    eventId: string;
    phone: string;
    name: string;
    eventName: string;
    queueNumber: number;
  }): Promise<SendResult> {
    const text =
      `Olá, ${params.name}! 🎉\n` +
      `Chegou a sua vez no evento ${params.eventName}.\n` +
      `Senha: #${String(params.queueNumber).padStart(3, '0')}\n` +
      `Por favor, dirija-se ao atendimento.`;

    return dispatch({
      queueEntryId: params.queueEntryId,
      eventId: params.eventId,
      phone: params.phone,
      messageType: 'CALLED',
      text,
    });
  },

  /**
   * Enviada quando o atendimento do participante é concluído.
   */
  async sendCompletedMessage(params: {
    queueEntryId: string;
    eventId: string;
    phone: string;
    name: string;
    eventName: string;
  }): Promise<SendResult> {
    const text =
      `${params.name}, seu atendimento no evento "${params.eventName}" foi concluído. ` +
      `Obrigado por participar! 💜`;

    return dispatch({
      queueEntryId: params.queueEntryId,
      eventId: params.eventId,
      phone: params.phone,
      messageType: 'COMPLETED',
      text,
    });
  },
};
