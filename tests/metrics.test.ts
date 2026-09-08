import { describe, it, expect } from 'vitest';
import { computeMetricsFromEntries, buildStatusBreakdown } from '@/lib/metrics';
import type { QueueEntry } from '@prisma/client';

function makeEntry(overrides: Partial<QueueEntry>): QueueEntry {
  const base: QueueEntry = {
    id: 'id-' + Math.random(),
    eventId: 'event-1',
    queueNumber: 1,
    name: 'Fulano de Tal',
    email: 'fulano@example.com',
    phone: '+5511999999999',
    status: 'WAITING',
    consentWhatsApp: true,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    calledAt: null,
    serviceStartedAt: null,
    completedAt: null,
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  };
  return { ...base, ...overrides };
}

describe('computeMetricsFromEntries', () => {
  it('calcula totais por status corretamente', () => {
    const entries = [
      makeEntry({ status: 'WAITING' }),
      makeEntry({ status: 'WAITING' }),
      makeEntry({ status: 'COMPLETED' }),
      makeEntry({ status: 'SKIPPED' }),
      makeEntry({ status: 'CANCELLED' }),
    ];

    const metrics = computeMetricsFromEntries(entries);

    expect(metrics.total).toBe(5);
    expect(metrics.waiting).toBe(2);
    expect(metrics.completed).toBe(1);
    expect(metrics.skipped).toBe(1);
    expect(metrics.cancelled).toBe(1);
  });

  it('calcula tempo médio de espera com base em createdAt -> calledAt', () => {
    const createdAt = new Date('2026-01-01T10:00:00Z');
    const calledAt = new Date('2026-01-01T10:05:00Z'); // 5 minutos depois
    const completedAt = new Date('2026-01-01T10:10:00Z');
    const serviceStartedAt = new Date('2026-01-01T10:06:00Z');

    const entries = [
      makeEntry({ status: 'COMPLETED', createdAt, calledAt, serviceStartedAt, completedAt }),
    ];

    const metrics = computeMetricsFromEntries(entries);

    expect(metrics.avgWaitTimeMs).toBe(5 * 60 * 1000);
    expect(metrics.avgServiceTimeMs).toBe(4 * 60 * 1000);
  });

  it('calcula taxa de conclusão e desistência', () => {
    const entries = [
      makeEntry({ status: 'COMPLETED' }),
      makeEntry({ status: 'COMPLETED' }),
      makeEntry({ status: 'SKIPPED' }),
      makeEntry({ status: 'CANCELLED' }),
    ];

    const metrics = computeMetricsFromEntries(entries);

    expect(metrics.completionRate).toBe(0.5);
    expect(metrics.dropoutRate).toBe(0.5);
  });

  it('retorna zero para tempos quando não há entradas concluídas', () => {
    const metrics = computeMetricsFromEntries([]);
    expect(metrics.avgWaitTimeMs).toBe(0);
    expect(metrics.avgServiceTimeMs).toBe(0);
    expect(metrics.completionRate).toBe(0);
  });
});

describe('buildStatusBreakdown', () => {
  it('retorna um item por status com contagem correta', () => {
    const entries = [makeEntry({ status: 'WAITING' }), makeEntry({ status: 'COMPLETED' })];
    const breakdown = buildStatusBreakdown(entries);

    const waiting = breakdown.find((b) => b.name === 'Aguardando');
    const completed = breakdown.find((b) => b.name === 'Atendidos');

    expect(waiting?.value).toBe(1);
    expect(completed?.value).toBe(1);
  });
});
