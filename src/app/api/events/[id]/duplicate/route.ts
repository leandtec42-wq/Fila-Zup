import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireOwnedEvent, handleApiError } from '@/lib/api-helpers';
import { generatePublicSlug } from '@/lib/utils';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const original = await requireOwnedEvent(user.id, params.id);

    let publicSlug = generatePublicSlug();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.event.findUnique({ where: { publicSlug } });
      if (!clash) break;
      publicSlug = generatePublicSlug();
    }

    const duplicated = await prisma.event.create({
      data: {
        userId: user.id,
        name: `${original.name} (cópia)`,
        description: original.description,
        date: original.date,
        startTime: original.startTime,
        endTime: original.endTime,
        location: original.location,
        maxParticipants: original.maxParticipants,
        allowReentryAfterCompletion: original.allowReentryAfterCompletion,
        status: 'DRAFT',
        publicSlug,
      },
    });

    return NextResponse.json({ event: duplicated }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
