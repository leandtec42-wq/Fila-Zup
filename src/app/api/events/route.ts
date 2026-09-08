import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEventSchema, normalizeMaxParticipants } from '@/lib/validations';
import { requireUser, handleApiError } from '@/lib/api-helpers';
import { generatePublicSlug } from '@/lib/utils';

export async function GET() {
  try {
    const user = await requireUser();

    const events = await prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { queueEntries: true },
        },
      },
    });

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const completed = await prisma.queueEntry.count({
          where: { eventId: event.id, status: 'COMPLETED' },
        });
        return {
          ...event,
          totalParticipants: event._count.queueEntries,
          totalCompleted: completed,
        };
      })
    );

    return NextResponse.json({ events: eventsWithStats });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = createEventSchema.parse(body);

    let publicSlug = generatePublicSlug();
    // Garante unicidade do slug (colisão é extremamente improvável, mas checamos)
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.event.findUnique({ where: { publicSlug } });
      if (!clash) break;
      publicSlug = generatePublicSlug();
    }

    const event = await prisma.event.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description || null,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location || null,
        maxParticipants: normalizeMaxParticipants(data.maxParticipants),
        status: data.status ?? 'DRAFT',
        allowReentryAfterCompletion: data.allowReentryAfterCompletion ?? false,
        publicSlug,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
