import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, handleApiError } from '@/lib/api-helpers';

/**
 * Rota PÚBLICA. Retorna apenas as informações necessárias para renderizar a
 * página /fila/[slug] — nunca expõe dados de outros participantes, tokens ou
 * informações do dono da conta além do nome da empresa.
 */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const event = await prisma.event.findUnique({
      where: { publicSlug: params.slug },
      include: { user: { select: { companyName: true } } },
    });

    if (!event) {
      throw new ApiError(404, 'Evento não encontrado.');
    }

    const waitingCount = await prisma.queueEntry.count({
      where: { eventId: event.id, status: 'WAITING' },
    });

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        status: event.status,
        companyName: event.user.companyName,
        waitingCount,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
