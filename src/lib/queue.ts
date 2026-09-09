import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '@/lib/whatsapp';
import type { Event, QueueEntry } from '@prisma/client';
import type { QueueStatus } from '@/lib/enums';

export class QueueError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const ACTIVE_STATUSES: QueueStatus[] = ['WAITING', 'CALLED', 'IN_SERVICE'];

async function logAction(queueEntryId: string, eventId: string, action: string, metadata?: unknown) {
  await prisma.queueAction.create({
    data: {
      queueEntryId,
      eventId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Calcula a posição de uma entrada WAITING dentro da fila (1-based).
 * A posição é sempre derivada em tempo real a partir da ordem createdAt ASC
 * das entradas WAITING — nunca armazenada, o que evita inconsistências
 * quando pessoas são atendidas/puladas/canceladas.
 */
export async function getWaitingPosition(entry: Pick<QueueEntry, 'id' | 'eventId' | 'createdAt' | 'status'>): Promise<number | null> {
  if (entry.status !== 'WAITING') return null;

  const peopleAhead = await prisma.queueEntry.count({
    where: {
      eventId: entry.eventId,
      status: 'WAITING',
      createdAt: { lt: entry.createdAt },
    },
  });

  return peopleAhead + 1;
}

export async function countPeopleAhead(entry: Pick<QueueEntry, 'id' | 'eventId' | 'createdAt' | 'status'>): Promise<number> {
  const position = await getWaitingPosition(entry);
  return position ? position - 1 : 0;
}

/**
 * Verifica se um telefone já possui uma entrada ativa (ou concluída, quando
 * reentrada não é permitida) no evento.
 */
async function findBlockingEntry(eventId: string, phone: string, allowReentryAfterCompletion: boolean) {
  const statuses: QueueStatus[] = allowReentryAfterCompletion
    ? ACTIVE_STATUSES
    : [...ACTIVE_STATUSES, 'COMPLETED'];

  return prisma.queueEntry.findFirst({
    where: { eventId, phone, status: { in: statuses } },
    orderBy: { createdAt: 'desc' },
  });
}

export type JoinQueueParams = {
  event: Event;
  name: string;
  email: string;
  phone: string;
  consentWhatsApp: boolean;
};

/**
 * Insere um novo participante na fila de forma segura e concorrente:
 * o número sequencial é obtido através de um incremento atômico no próprio
 * evento (lock de linha do banco), garantindo que dois participantes nunca
 * recebam o mesmo número, mesmo sob alta concorrência.
 */
export async function joinQueue(params: JoinQueueParams) {
  const { event, name, email, phone, consentWhatsApp } = params;

  if (event.status !== 'ACTIVE') {
    throw new QueueError('EVENT_NOT_ACTIVE', 'Este evento não está aceitando novas pessoas na fila no momento.');
  }

  if (event.maxParticipants) {
    const totalActive = await prisma.queueEntry.count({
      where: { eventId: event.id, status: { in: ACTIVE_STATUSES } },
    });
    if (totalActive >= event.maxParticipants) {
      throw new QueueError('EVENT_FULL', 'Este evento atingiu o limite de participantes na fila.');
    }
  }

  const blocking = await findBlockingEntry(event.id, phone, event.allowReentryAfterCompletion);
  if (blocking) {
    if (blocking.status === 'COMPLETED') {
      throw new QueueError('ALREADY_COMPLETED', 'Você já participou deste evento.');
    }
    throw new QueueError('ALREADY_IN_QUEUE', 'Você já está na fila deste evento.');
  }

  const entry = await prisma.$transaction(async (tx) => {
    const updatedEvent = await tx.event.update({
      where: { id: event.id },
      data: { lastQueueNumber: { increment: 1 } },
    });

    return tx.queueEntry.create({
      data: {
        eventId: event.id,
        queueNumber: updatedEvent.lastQueueNumber,
        name,
        email,
        phone,
        consentWhatsApp,
        status: 'WAITING',
      },
    });
  });

  await logAction(entry.id, event.id, 'QUEUE_JOINED', { queueNumber: entry.queueNumber });

  const position = (await getWaitingPosition(entry)) ?? 1;

  let whatsapp: { ok: boolean; devMode: boolean; error?: string } = { ok: false, devMode: false };
  if (consentWhatsApp) {
    try {
      whatsapp = await WhatsAppService.sendQueueJoinedMessage({
        queueEntryId: entry.id,
        eventId: event.id,
        phone,
        name,
        eventName: event.name,
        queueNumber: entry.queueNumber,
        position,
      });
      if (!whatsapp.ok) {
        await logAction(entry.id, event.id, 'WHATSAPP_FAILED', { reason: whatsapp.error, type: 'QUEUE_JOINED' });
      } else {
        await logAction(entry.id, event.id, 'WHATSAPP_SENT', { type: 'QUEUE_JOINED', devMode: whatsapp.devMode });
      }
    } catch (err) {
      await logAction(entry.id, event.id, 'WHATSAPP_FAILED', {
        reason: err instanceof Error ? err.message : 'Erro desconhecido',
        type: 'QUEUE_JOINED',
      });
    }
  }

  return { entry, position, whatsapp };
}

async function getOwnedEntry(eventId: string, entryId: string) {
  const entry = await prisma.queueEntry.findFirst({ where: { id: entryId, eventId } });
  if (!entry) {
    throw new QueueError('NOT_FOUND', 'Participante não encontrado nesta fila.');
  }
  return entry;
}

/**
 * Chama o próximo participante da fila (primeiro WAITING por createdAt ASC).
 * Usa atualização condicional (compare-and-swap) para garantir que, mesmo se
 * dois administradores clicarem em "Chamar próximo" ao mesmo tempo, nenhuma
 * pessoa seja chamada duas vezes.
 */
export async function callNext(event: Event) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = await prisma.queueEntry.findFirst({
      where: { eventId: event.id, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    });

    if (!candidate) {
      throw new QueueError('QUEUE_EMPTY', 'Não há mais pessoas aguardando na fila.');
    }

    const result = await prisma.queueEntry.updateMany({
      where: { id: candidate.id, status: 'WAITING' },
      data: { status: 'CALLED', calledAt: new Date() },
    });

    if (result.count === 1) {
      const updated = await prisma.queueEntry.findUniqueOrThrow({ where: { id: candidate.id } });
      await logAction(updated.id, event.id, 'QUEUE_CALLED', { queueNumber: updated.queueNumber });

      let whatsapp: { ok: boolean; devMode: boolean; error?: string } = { ok: false, devMode: false };
      if (updated.consentWhatsApp) {
        try {
          whatsapp = await WhatsAppService.sendCalledMessage({
            queueEntryId: updated.id,
            eventId: event.id,
            phone: updated.phone,
            name: updated.name,
            eventName: event.name,
            queueNumber: updated.queueNumber,
          });
          await logAction(updated.id, event.id, whatsapp.ok ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED', {
            type: 'CALLED',
            reason: whatsapp.error,
          });
        } catch (err) {
          await logAction(updated.id, event.id, 'WHATSAPP_FAILED', {
            type: 'CALLED',
            reason: err instanceof Error ? err.message : 'Erro desconhecido',
          });
        }
      }

      return { entry: updated, whatsapp };
    }
    // outra requisição concorrente já pegou essa entrada — tenta a próxima
  }

  throw new QueueError('CONCURRENCY_CONFLICT', 'Muitas ações simultâneas na fila. Tente novamente.');
}

export async function startService(eventId: string, entryId: string) {
  const entry = await getOwnedEntry(eventId, entryId);
  if (entry.status !== 'CALLED') {
    throw new QueueError('INVALID_STATE', 'Este participante precisa ser chamado antes de iniciar o atendimento.');
  }

  const result = await prisma.queueEntry.updateMany({
    where: { id: entryId, status: 'CALLED' },
    data: { status: 'IN_SERVICE', serviceStartedAt: new Date() },
  });

  if (result.count !== 1) {
    throw new QueueError('CONCURRENCY_CONFLICT', 'Não foi possível iniciar o atendimento. Tente novamente.');
  }

  const updated = await prisma.queueEntry.findUniqueOrThrow({ where: { id: entryId } });
  await logAction(entryId, eventId, 'SERVICE_STARTED');
  return updated;
}

export async function completeService(eventId: string, entryId: string) {
  const entry = await getOwnedEntry(eventId, entryId);
  if (entry.status !== 'IN_SERVICE' && entry.status !== 'CALLED') {
    throw new QueueError('INVALID_STATE', 'Este participante não está em atendimento.');
  }

  const result = await prisma.queueEntry.updateMany({
    where: { id: entryId, status: { in: ['IN_SERVICE', 'CALLED'] } },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  if (result.count !== 1) {
    throw new QueueError('CONCURRENCY_CONFLICT', 'Não foi possível concluir o atendimento. Tente novamente.');
  }

  const updated = await prisma.queueEntry.findUniqueOrThrow({ where: { id: entryId } });
  await logAction(entryId, eventId, 'SERVICE_COMPLETED');

  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  if (updated.consentWhatsApp) {
    try {
      const whatsapp = await WhatsAppService.sendCompletedMessage({
        queueEntryId: updated.id,
        eventId,
        phone: updated.phone,
        name: updated.name,
        eventName: event.name,
      });
      await logAction(updated.id, eventId, whatsapp.ok ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED', {
        type: 'COMPLETED',
        reason: whatsapp.error,
      });
    } catch (err) {
      await logAction(updated.id, eventId, 'WHATSAPP_FAILED', {
        type: 'COMPLETED',
        reason: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }

  return updated;
}

export async function skipEntry(eventId: string, entryId: string) {
  const entry = await getOwnedEntry(eventId, entryId);
  if (!['WAITING', 'CALLED'].includes(entry.status)) {
    throw new QueueError('INVALID_STATE', 'Este participante não pode ser pulado neste status.');
  }

  const result = await prisma.queueEntry.updateMany({
    where: { id: entryId, status: entry.status },
    data: { status: 'SKIPPED' },
  });

  if (result.count !== 1) {
    throw new QueueError('CONCURRENCY_CONFLICT', 'Não foi possível pular este participante. Tente novamente.');
  }

  await logAction(entryId, eventId, 'QUEUE_SKIPPED');
  return prisma.queueEntry.findUniqueOrThrow({ where: { id: entryId } });
}

export async function cancelEntry(eventId: string, entryId: string, reason?: string) {
  const entry = await getOwnedEntry(eventId, entryId);
  if (['COMPLETED', 'CANCELLED'].includes(entry.status)) {
    throw new QueueError('INVALID_STATE', 'Este participante já está em um status final.');
  }

  const result = await prisma.queueEntry.updateMany({
    where: { id: entryId, status: entry.status },
    data: { status: 'CANCELLED' },
  });

  if (result.count !== 1) {
    throw new QueueError('CONCURRENCY_CONFLICT', 'Não foi possível cancelar este participante. Tente novamente.');
  }

  await logAction(entryId, eventId, 'QUEUE_CANCELLED', { reason });
  return prisma.queueEntry.findUniqueOrThrow({ where: { id: entryId } });
}

/**
 * Exclusão de dados de um participante (mecanismo de LGPD). Remove os dados
 * pessoais (nome, e-mail, telefone) mantendo o registro estatístico anônimo.
 */
export async function eraseParticipantData(eventId: string, entryId: string) {
  await getOwnedEntry(eventId, entryId);

  const updated = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      name: 'Participante removido',
      email: `removido-${entryId}@anonimo.local`,
      phone: '+000000000000',
    },
  });

  await logAction(entryId, eventId, 'PARTICIPANT_DATA_ERASED');
  return updated;
}
