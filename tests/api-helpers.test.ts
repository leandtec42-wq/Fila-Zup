import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findFirst: vi.fn() },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { requireUser, requireOwnedEvent, ApiError } from '@/lib/api-helpers';

const mockedGetServerSession = getServerSession as unknown as ReturnType<typeof vi.fn>;
const mockedPrisma = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireUser', () => {
  it('lança ApiError 401 quando não há sessão autenticada', async () => {
    mockedGetServerSession.mockResolvedValue(null);
    await expect(requireUser()).rejects.toMatchObject({ status: 401 } satisfies Partial<ApiError>);
  });

  it('retorna o usuário quando a sessão é válida', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1', name: 'Teste' } });
    const user = await requireUser();
    expect(user.id).toBe('user-1');
  });
});

describe('requireOwnedEvent — isolamento multi-tenant', () => {
  it('lança 404 quando o evento não existe ou pertence a outro tenant', async () => {
    mockedPrisma.event.findFirst.mockResolvedValue(null);

    await expect(requireOwnedEvent('user-1', 'event-de-outro-usuario')).rejects.toMatchObject({ status: 404 });

    expect(mockedPrisma.event.findFirst).toHaveBeenCalledWith({
      where: { id: 'event-de-outro-usuario', userId: 'user-1' },
    });
  });

  it('retorna o evento quando pertence ao usuário autenticado', async () => {
    const event = { id: 'event-1', userId: 'user-1', name: 'Meu evento' };
    mockedPrisma.event.findFirst.mockResolvedValue(event);

    const result = await requireOwnedEvent('user-1', 'event-1');
    expect(result).toEqual(event);
  });
});
