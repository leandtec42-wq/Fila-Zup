import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireOwnedEvent, handleApiError, ApiError } from '@/lib/api-helpers';
import { skipEntry } from '@/lib/queue';

export async function POST(_req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    const user = await requireUser();
    const entry = await prisma.queueEntry.findUnique({ where: { id: params.entryId } });
    if (!entry) throw new ApiError(404, 'Participante não encontrado.');
    await requireOwnedEvent(user.id, entry.eventId);

    const updated = await skipEntry(entry.eventId, entry.id);
    return NextResponse.json({ entry: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
