import { prisma } from '@/lib/prisma';
import type { WhatsAppMessageType } from '@prisma/client';

/**
 * WhatsAppService — integração real com a Meta WhatsApp Cloud API.
 *
 * Este serviço NUNCA simula envio como se fosse real. Se as credenciais
 * (META_WHATSAPP_ACCESS_TOKEN e META_WHATSAPP_PHONE_NUMBER_ID) não estiverem
 * configuradas no .env, o serviço entra em "modo desenvolvimento": a mensagem
 * é registrada no banco (WhatsAppMessage) com status LOGGED_DEV_MODE e o
 * conteúdo é impresso no console, mas nenhuma chamada de rede é feita.
 *
 * Quando as credenciais estão presentes, o envio é feito via HTTPS para
 * graph.facebook.com, exatamente como documentado pela Meta. Veja o passo a
 * passo completo de configuração em docs/WHATSAPP.md.
 */

const GRAPH_API_VERSION = process.env.META_WHATSAPP_API_VERSION || 'v21.0';

function isConfigured(): boolean {
  return Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID);
}

type SendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  devMode: boolean;
};

/**
 * Faz a chamada HTTP real para a Meta Graph API.
 * Referência: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */
async function callGraphApi(body: Record<string, unknown>): Promise<SendResult> {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message || `Falha ao enviar mensagem (HTTP ${response.status})`;
      return { ok: false, error: message, devMode: false };
    }

    const providerMessageId: string | undefined = data?.messages?.[0]?.id;
    return { ok: true, providerMessageId, devMode: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao chamar a Meta Graph API';
    return { ok: false, error: message, devMode: false };
  }
}

function buildTextMessage(to: string, text: string) {
  return {
    messaging_product: 'whatsapp',
    to: to.replace('+', ''),
    type: 'text',
    text: { preview_url: false, body: text },
  };
}

/**
 * Mensagem via template aprovado (necessário para iniciar conversa fora da
 * janela de 24h, conforme regras da Meta). O corpo do template precisa ter
 * sido criado e aprovado previamente no Meta Business Manager, com o mesmo
 * número de variáveis usado aqui.
 */
function buildTemplateMessage(to: string, variables: string[]) {
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME || 'fila_atualizacao';
  const templateLanguage = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE || 'pt_BR';

  return {
    messaging_product: 'whatsapp',
    to: to.replace('+', ''),
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: 'body',
          parameters: variables.map((text) => ({ type: 'text', text })),
        },
      ],
    },
  };
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
  templateVariables?: string[];
  useTemplate?: boolean;
}): Promise<SendResult> {
  const { queueEntryId, eventId, phone, messageType, text, templateVariables, useTemplate } = params;

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

  const body =
    useTemplate && templateVariables
      ? buildTemplateMessage(phone, templateVariables)
      : buildTextMessage(phone, text);

  const result = await callGraphApi(body);

  await logMessage({
    queueEntryId,
    eventId,
    phone,
    messageType,
    status: result.ok ? 'SENT' : 'FAILED',
    providerMessageId: result.providerMessageId,
    error: result.error,
    payload: body,
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
      useTemplate: true,
      templateVariables: [params.name, params.eventName, String(params.queueNumber), String(params.position)],
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
      useTemplate: true,
      templateVariables: [params.name, params.eventName, String(params.newPosition)],
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
      useTemplate: true,
      templateVariables: [params.name, params.eventName, String(params.queueNumber)],
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
      useTemplate: true,
      templateVariables: [params.name, params.eventName],
    });
  },
};
