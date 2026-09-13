import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireOwnedEvent, handleApiError } from '@/lib/api-helpers';
import { metricsQuerySchema } from '@/lib/validations';
import { resolveRange, getEventMetrics, buildHourlySeries, buildStatusBreakdown } from '@/lib/metrics';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const event = await requireOwnedEvent(user.id, params.id);

    const { searchParams } = new URL(req.url);
    const query = metricsQuerySchema.parse({
      range: searchParams.get('range') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });

    const range = resolveRange(query.range, query.from, query.to);
    const metrics = await getEventMetrics(event.id, range);

    const entries = await prisma.queueEntry.findMany({
      where: { eventId: event.id, createdAt: { gte: range.from, lte: range.to } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      metrics,
      hourlySeries: buildHourlySeries(entries, range),
      statusBreakdown: buildStatusBreakdown(entries),
      range: { from: range.from, to: range.to },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
