import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireOwnedEvent, handleApiError, ApiError } from '@/lib/api-helpers';
import { cancelEntry } from '@/lib/queue';

export async function POST(req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    const user = await requireUser();
    const entry = await prisma.queueEntry.findUnique({ where: { id: params.entryId } });
    if (!entry) throw new ApiError(404, 'Participante não encontrado.');
    await requireOwnedEvent(user.id, entry.eventId);

    const body = await req.json().catch(() => ({}));
    const updated = await cancelEntry(entry.eventId, entry.id, body?.reason);
    return NextResponse.json({ entry: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
