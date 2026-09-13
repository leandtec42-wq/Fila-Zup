import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QueueError } from '@/lib/queue';
import { ZodError } from 'zod';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Garante que existe uma sessão autenticada. Lança 401 caso contrário.
 * Usar em TODAS as rotas administrativas — nunca confiar em dados enviados
 * pelo cliente para identificar o usuário.
 */
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiError(401, 'Você precisa estar autenticado para realizar esta ação.');
  }
  return session.user;
}

/**
 * Garante que o evento existe E pertence ao usuário autenticado.
 * Essencial para o isolamento multi-tenant: nenhum cliente pode acessar ou
 * modificar dados de eventos de outro cliente, mesmo manipulando o ID na
 * requisição.
 */
export async function requireOwnedEvent(userId: string, eventId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) {
    throw new ApiError(404, 'Evento não encontrado ou você não tem permissão para acessá-lo.');
  }
  return event;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof QueueError) {
    const statusMap: Record<string, number> = {
      EVENT_NOT_ACTIVE: 409,
      EVENT_FULL: 409,
      ALREADY_IN_QUEUE: 409,
      ALREADY_COMPLETED: 409,
      QUEUE_EMPTY: 404,
      NOT_FOUND: 404,
      INVALID_STATE: 409,
      CONCURRENCY_CONFLICT: 409,
    };
    return NextResponse.json({ error: err.message, code: err.code }, { status: statusMap[err.code] ?? 400 });
  }
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? 'Dados inválidos.', issues: err.issues },
      { status: 422 }
    );
  }
  // eslint-disable-next-line no-console
  console.error('[API] Erro não tratado:', err);
  return NextResponse.json(
    { error: 'Ocorreu um erro inesperado. Tente novamente em instantes.' },
    { status: 500 }
  );
}
