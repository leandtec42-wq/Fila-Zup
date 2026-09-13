import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireOwnedEvent, handleApiError, ApiError } from '@/lib/api-helpers';
import { eraseParticipantData, getWaitingPosition } from '@/lib/queue';

export async function GET(_req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    const user = await requireUser();
    const entry = await prisma.queueEntry.findUnique({ where: { id: params.entryId } });
    if (!entry) throw new ApiError(404, 'Participante não encontrado.');
    const event = await requireOwnedEvent(user.id, entry.eventId);

    const actions = await prisma.queueAction.findMany({
      where: { queueEntryId: entry.id },
      orderBy: { createdAt: 'asc' },
    });

    const messages = await prisma.whatsAppMessage.findMany({
      where: { queueEntryId: entry.id },
      orderBy: { createdAt: 'asc' },
    });

    const position = await getWaitingPosition(entry);

    return NextResponse.json({ entry, event, actions, messages, position });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Exclusão de dados pessoais do participante (LGPD). Anonimiza nome, e-mail
 * e telefone mantendo o registro estatístico (status, horários) para as
 * métricas do evento não ficarem distorcidas.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    const user = await requireUser();
    const entry = await prisma.queueEntry.findUnique({ where: { id: params.entryId } });
    if (!entry) throw new ApiError(404, 'Participante não encontrado.');
    await requireOwnedEvent(user.id, entry.eventId);

    const updated = await eraseParticipantData(entry.eventId, entry.id);
    return NextResponse.json({ entry: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
