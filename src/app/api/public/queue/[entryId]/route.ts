import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, handleApiError } from '@/lib/api-helpers';
import { getWaitingPosition, countPeopleAhead } from '@/lib/queue';

/**
 * Rota PÚBLICA usada pela tela "Você está na fila!" para atualizar a posição
 * automaticamente via polling. O ID da entrada (cuid, não sequencial e
 * impossível de adivinhar) funciona como referência segura o suficiente para
 * esta consulta somente-leitura de status — não expõe e-mail nem telefone.
 */
export async function GET(_req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    const entry = await prisma.queueEntry.findUnique({ where: { id: params.entryId } });
    if (!entry) {
      throw new ApiError(404, 'Registro não encontrado.');
    }

    const event = await prisma.event.findUnique({ where: { id: entry.eventId } });

    const position = await getWaitingPosition(entry);
    const peopleAhead = await countPeopleAhead(entry);

    return NextResponse.json({
      status: entry.status,
      queueNumber: entry.queueNumber,
      position,
      peopleAhead,
      eventName: event?.name,
      eventStatus: event?.status,
      calledAt: entry.calledAt,
      completedAt: entry.completedAt,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
