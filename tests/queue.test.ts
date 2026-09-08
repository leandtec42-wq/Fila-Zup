import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    queueEntry: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    queueAction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/whatsapp', () => ({
  WhatsAppService: {
    isConfigured: vi.fn().mockReturnValue(false),
    sendQueueJoinedMessage: vi.fn().mockResolvedValue({ ok: true, devMode: true }),
    sendCalledMessage: vi.fn().mockResolvedValue({ ok: true, devMode: true }),
    sendCompletedMessage: vi.fn().mockResolvedValue({ ok: true, devMode: true }),
  },
}));

import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '@/lib/whatsapp';
import { joinQueue, callNext, QueueError } from '@/lib/queue';

const mockedPrisma = prisma as any;

const baseEvent = {
  id: 'event-1',
  name: 'Evento Teste',
  status: 'ACTIVE',
  maxParticipants: null,
  allowReentryAfterCompletion: false,
  lastQueueNumber: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('joinQueue', () => {
  it('impede a entrada quando o evento não está ativo', async () => {
    await expect(
      joinQueue({
        event: { ...baseEvent, status: 'PAUSED' } as any,
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+5511999999999',
        consentWhatsApp: true,
      })
    ).rejects.toMatchObject({ code: 'EVENT_NOT_ACTIVE' } satisfies Partial<QueueError>);
  });

  it('impede duas entradas ativas com o mesmo telefone no mesmo evento', async () => {
    mockedPrisma.queueEntry.count.mockResolvedValue(0);
    mockedPrisma.queueEntry.findFirst.mockResolvedValue({ id: 'existing', status: 'WAITING' });

    await expect(
      joinQueue({
        event: baseEvent as any,
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+5511999999999',
        consentWhatsApp: true,
      })
    ).rejects.toMatchObject({ code: 'ALREADY_IN_QUEUE' });
  });

  it('atribui um número sequencial via incremento atômico e envia WhatsApp', async () => {
    mockedPrisma.queueEntry.count.mockResolvedValue(0); // sem limite / sem gente à frente
    mockedPrisma.queueEntry.findFirst.mockResolvedValue(null); // sem duplicidade

    const createdEntry = {
      id: 'entry-1',
      eventId: 'event-1',
      queueNumber: 5,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '+5511999999999',
      status: 'WAITING',
      createdAt: new Date(),
    };

    mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
      const tx = {
        event: { update: vi.fn().mockResolvedValue({ ...baseEvent, lastQueueNumber: 5 }) },
        queueEntry: { create: vi.fn().mockResolvedValue(createdEntry) },
      };
      return callback(tx);
    });

    const result = await joinQueue({
      event: baseEvent as any,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '+5511999999999',
      consentWhatsApp: true,
    });

    expect(result.entry.queueNumber).toBe(5);
    expect(result.position).toBe(1);
    expect(WhatsAppService.sendQueueJoinedMessage).toHaveBeenCalledTimes(1);
  });

  it('bloqueia reentrada de quem já foi atendido, exceto se o evento permitir', async () => {
    mockedPrisma.queueEntry.count.mockResolvedValue(0);
    mockedPrisma.queueEntry.findFirst.mockResolvedValue({ id: 'existing', status: 'COMPLETED' });

    await expect(
      joinQueue({
        event: baseEvent as any,
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+5511999999999',
        consentWhatsApp: true,
      })
    ).rejects.toMatchObject({ code: 'ALREADY_COMPLETED' });
  });
});

describe('callNext', () => {
  it('lança QUEUE_EMPTY quando não há ninguém aguardando', async () => {
    mockedPrisma.queueEntry.findFirst.mockResolvedValue(null);

    await expect(callNext(baseEvent as any)).rejects.toMatchObject({ code: 'QUEUE_EMPTY' });
  });

  it('chama a próxima pessoa e envia notificação de WhatsApp', async () => {
    const candidate = { id: 'entry-1', status: 'WAITING', createdAt: new Date() };
    const updated = { ...candidate, status: 'CALLED', calledAt: new Date(), consentWhatsApp: true, name: 'Maria', queueNumber: 3, phone: '+5511999999999' };

    mockedPrisma.queueEntry.findFirst.mockResolvedValue(candidate);
    mockedPrisma.queueEntry.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.queueEntry.findUniqueOrThrow.mockResolvedValue(updated);

    const result = await callNext(baseEvent as any);

    expect(result.entry.status).toBe('CALLED');
    expect(WhatsAppService.sendCalledMessage).toHaveBeenCalledTimes(1);
  });

  it('nunca chama a mesma pessoa duas vezes sob concorrência (compare-and-swap)', async () => {
    const candidateA = { id: 'entry-A', status: 'WAITING', createdAt: new Date() };
    const candidateB = { id: 'entry-B', status: 'WAITING', createdAt: new Date() };
    const updatedB = { ...candidateB, status: 'CALLED', consentWhatsApp: false, name: 'Carlos', queueNumber: 4, phone: '+5511999999999' };

    mockedPrisma.queueEntry.findFirst
      .mockResolvedValueOnce(candidateA) // primeira tentativa: alguém já pegou essa
      .mockResolvedValueOnce(candidateB); // segunda tentativa: consegue

    mockedPrisma.queueEntry.updateMany
      .mockResolvedValueOnce({ count: 0 }) // outra requisição já chamou candidateA
      .mockResolvedValueOnce({ count: 1 }); // sucesso ao chamar candidateB

    mockedPrisma.queueEntry.findUniqueOrThrow.mockResolvedValue(updatedB);

    const result = await callNext(baseEvent as any);

    expect(mockedPrisma.queueEntry.updateMany).toHaveBeenCalledTimes(2);
    expect(result.entry.id).toBe('entry-B');
  });
});
