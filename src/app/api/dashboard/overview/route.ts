import { NextRequest, NextResponse } from 'next/server';
import { requireUser, handleApiError } from '@/lib/api-helpers';
import { metricsQuerySchema } from '@/lib/validations';
import { resolveRange, getDashboardOverview } from '@/lib/metrics';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const query = metricsQuerySchema.parse({
      range: searchParams.get('range') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });

    const range = resolveRange(query.range, query.from, query.to);
    const overview = await getDashboardOverview(user.id, range);

    return NextResponse.json({ overview });
  } catch (err) {
    return handleApiError(err);
  }
}
