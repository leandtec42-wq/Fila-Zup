import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireOwnedEvent, handleApiError } from '@/lib/api-helpers';
import type { Prisma } from '@prisma/client';
import type { QueueStatus } from '@/lib/enums';
import { getWaitingPosition } from '@/lib/queue';

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

/**
 * Lista participantes de um evento, com busca, filtro por status e paginação.
 * Nunca retorna dados de outro tenant: sempre filtrado por eventId + userId.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await requireOwnedEvent(user.id, params.id);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as QueueStatus | null;
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(searchParams.get('pageSize')) || PAGE_SIZE_DEFAULT));

    const where: Prisma.QueueEntryWhereInput = {
      eventId: params.id,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [entries, total] = await Promise.all([
      prisma.queueEntry.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.queueEntry.count({ where }),
    ]);

    const entriesWithPosition = await Promise.all(
      entries.map(async (entry) => ({
        ...entry,
        position: await getWaitingPosition(entry),
      }))
    );

    return NextResponse.json({
      entries: entriesWithPosition,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
