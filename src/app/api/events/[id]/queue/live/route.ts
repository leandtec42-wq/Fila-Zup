import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireOwnedEvent, handleApiError } from '@/lib/api-helpers';

/**
 * Endpoint leve usado pela tela "Fila em tempo real" do painel administrativo.
 * Retorna quem está sendo atendido agora e os próximos N da fila. Feito para
 * ser consultado via polling curto sem sobrecarregar o banco.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const event = await requireOwnedEvent(user.id, params.id);

    const { searchParams } = new URL(req.url);
    const nextLimit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 10));

    const [current, next, waitingCount, completedCount, cancelledCount, skippedCount, totalCount] =
      await Promise.all([
        prisma.queueEntry.findFirst({
          where: { eventId: event.id, status: { in: ['CALLED', 'IN_SERVICE'] } },
          orderBy: { calledAt: 'asc' },
        }),
        prisma.queueEntry.findMany({
          where: { eventId: event.id, status: 'WAITING' },
          orderBy: { createdAt: 'asc' },
          take: nextLimit,
        }),
        prisma.queueEntry.count({ where: { eventId: event.id, status: 'WAITING' } }),
        prisma.queueEntry.count({ where: { eventId: event.id, status: 'COMPLETED' } }),
        prisma.queueEntry.count({ where: { eventId: event.id, status: 'CANCELLED' } }),
        prisma.queueEntry.count({ where: { eventId: event.id, status: 'SKIPPED' } }),
        prisma.queueEntry.count({ where: { eventId: event.id } }),
      ]);

    return NextResponse.json({
      event: { id: event.id, name: event.name, status: event.status },
      current,
      next,
      counts: {
        waiting: waitingCount,
        completed: completedCount,
        cancelled: cancelledCount,
        skipped: skippedCount,
        total: totalCount,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
