import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateEventSchema, normalizeMaxParticipants } from '@/lib/validations';
import { requireUser, requireOwnedEvent, handleApiError } from '@/lib/api-helpers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const event = await requireOwnedEvent(user.id, params.id);
    return NextResponse.json({ event });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await requireOwnedEvent(user.id, params.id);

    const body = await req.json();
    const data = updateEventSchema.parse(body);

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.location !== undefined && { location: data.location || null }),
        ...(data.maxParticipants !== undefined && { maxParticipants: normalizeMaxParticipants(data.maxParticipants) }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.allowReentryAfterCompletion !== undefined && {
          allowReentryAfterCompletion: data.allowReentryAfterCompletion,
        }),
      },
    });

    return NextResponse.json({ event });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await requireOwnedEvent(user.id, params.id);

    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
