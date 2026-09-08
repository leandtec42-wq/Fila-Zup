import { prisma } from '@/lib/prisma';
import type { QueueEntry } from '@prisma/client';

export type DateRange = { from: Date; to: Date };

export function resolveRange(range: 'today' | '7d' | '30d' | 'custom', from?: string, to?: string): DateRange {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === 'custom' && from && to) {
    return { from: new Date(from), to: new Date(to) };
  }

  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { from: start, to: endOfToday };
  }

  const days = range === '30d' ? 30 : 7;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { from: start, to: endOfToday };
}

function avg(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

export async function getEventMetrics(eventId: string, range: DateRange) {
  const entries = await prisma.queueEntry.findMany({
    where: { eventId, createdAt: { gte: range.from, lte: range.to } },
    orderBy: { createdAt: 'asc' },
  });

  return computeMetricsFromEntries(entries);
}

export function computeMetricsFromEntries(entries: QueueEntry[]) {
  const total = entries.length;
  const completed = entries.filter((e) => e.status === 'COMPLETED');
  const waiting = entries.filter((e) => e.status === 'WAITING');
  const inService = entries.filter((e) => e.status === 'IN_SERVICE');
  const skipped = entries.filter((e) => e.status === 'SKIPPED');
  const cancelled = entries.filter((e) => e.status === 'CANCELLED');
  const called = entries.filter((e) => e.status === 'CALLED');

  const waitTimes = completed
    .filter((e) => e.calledAt)
    .map((e) => (e.calledAt as Date).getTime() - e.createdAt.getTime());

  const serviceTimes = completed
    .filter((e) => e.serviceStartedAt && e.completedAt)
    .map((e) => (e.completedAt as Date).getTime() - (e.serviceStartedAt as Date).getTime());

  const completionRate = total > 0 ? completed.length / total : 0;
  const dropoutRate = total > 0 ? (skipped.length + cancelled.length) / total : 0;

  return {
    total,
    completed: completed.length,
    waiting: waiting.length,
    inService: inService.length,
    called: called.length,
    skipped: skipped.length,
    cancelled: cancelled.length,
    avgWaitTimeMs: avg(waitTimes),
    avgServiceTimeMs: avg(serviceTimes),
    maxWaitTimeMs: waitTimes.length ? Math.max(...waitTimes) : 0,
    minWaitTimeMs: waitTimes.length ? Math.min(...waitTimes) : 0,
    completionRate,
    dropoutRate,
  };
}

/**
 * Série temporal de entradas na fila e atendimentos concluídos, agrupados
 * por hora, para os gráficos "Entrada de participantes por horário" e
 * "Atendimentos por horário".
 */
export function buildHourlySeries(entries: QueueEntry[], range: DateRange) {
  const buckets = new Map<string, { hour: string; entradas: number; atendimentos: number }>();

  const cursor = new Date(range.from);
  cursor.setMinutes(0, 0, 0);
  const end = new Date(range.to);

  while (cursor <= end) {
    const key = cursor.toISOString();
    buckets.set(key, {
      hour: cursor.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      entradas: 0,
      atendimentos: 0,
    });
    cursor.setHours(cursor.getHours() + 1);
  }

  for (const entry of entries) {
    const hourKey = new Date(entry.createdAt);
    hourKey.setMinutes(0, 0, 0);
    const bucket = buckets.get(hourKey.toISOString());
    if (bucket) bucket.entradas += 1;

    if (entry.completedAt) {
      const completedHourKey = new Date(entry.completedAt);
      completedHourKey.setMinutes(0, 0, 0);
      const completedBucket = buckets.get(completedHourKey.toISOString());
      if (completedBucket) completedBucket.atendimentos += 1;
    }
  }

  return Array.from(buckets.values());
}

export function buildStatusBreakdown(entries: QueueEntry[]) {
  const metrics = computeMetricsFromEntries(entries);
  return [
    { name: 'Aguardando', value: metrics.waiting, color: '#D0E94B' },
    { name: 'Em atendimento', value: metrics.inService, color: '#9E4ADD' },
    { name: 'Atendidos', value: metrics.completed, color: '#6A00A8' },
    { name: 'Pulados', value: metrics.skipped, color: '#D97706' },
    { name: 'Cancelados', value: metrics.cancelled, color: '#DC2626' },
  ];
}

export async function getDashboardOverview(userId: string, range: DateRange) {
  const events = await prisma.event.findMany({ where: { userId } });
  const eventIds = events.map((e) => e.id);

  const entries = await prisma.queueEntry.findMany({
    where: { eventId: { in: eventIds }, createdAt: { gte: range.from, lte: range.to } },
  });

  const metrics = computeMetricsFromEntries(entries);
  const activeEvents = events.filter((e) => e.status === 'ACTIVE').length;

  const participantsByEvent = events.map((event) => {
    const eventEntries = entries.filter((e) => e.eventId === event.id);
    return {
      name: event.name,
      participantes: eventEntries.length,
      atendidos: eventEntries.filter((e) => e.status === 'COMPLETED').length,
    };
  });

  return {
    activeEvents,
    totalEvents: events.length,
    totalParticipants: metrics.total,
    waiting: metrics.waiting,
    completed: metrics.completed,
    completionRate: metrics.completionRate,
    participantsByEvent,
    statusBreakdown: buildStatusBreakdown(entries),
    hourlySeries: buildHourlySeries(entries, range),
  };
}
