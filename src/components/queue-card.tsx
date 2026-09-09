'use client';

import { PhoneCall, Play, CheckCircle2, SkipForward, XCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueueStatusBadge } from '@/components/ui/badge';
import { queueNumberLabel, formatDurationShort } from '@/lib/utils';
import * as React from 'react';

export type QueueEntryLike = {
  id: string;
  queueNumber: number;
  name: string;
  status: string;
  createdAt: string | Date;
  calledAt?: string | Date | null;
};

function useElapsed(since?: string | Date | null) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!since) return null;
  return now - new Date(since).getTime();
}

export function CurrentServingCard({
  entry,
  onStart,
  onComplete,
  isLoading,
}: {
  entry: QueueEntryLike | null;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  isLoading?: boolean;
}) {
  const elapsed = useElapsed(entry?.calledAt);

  if (!entry) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-muted/40 p-8 text-center">
        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium text-muted-foreground">Ninguém está sendo atendido agora.</p>
        <p className="text-sm text-muted-foreground">Clique em "Chamar próximo" para iniciar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-glow-primary">
      <p className="text-xs font-bold uppercase tracking-widest text-accent">Agora</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-extrabold tracking-tight">{queueNumberLabel(entry.queueNumber)}</p>
          <p className="mt-1 text-lg font-medium">{entry.name}</p>
        </div>
        <div className="text-right">
          <QueueStatusBadge status={entry.status} />
          {elapsed !== null && (
            <p className="mt-1 text-sm text-white/80">Há {formatDurationShort(elapsed)}</p>
          )}
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        {entry.status === 'CALLED' && (
          <Button variant="accent" onClick={() => onStart(entry.id)} isLoading={isLoading} className="flex-1">
            <Play className="h-4 w-4" /> Iniciar atendimento
          </Button>
        )}
        {entry.status === 'IN_SERVICE' && (
          <Button variant="accent" onClick={() => onComplete(entry.id)} isLoading={isLoading} className="flex-1">
            <CheckCircle2 className="h-4 w-4" /> Finalizar atendimento
          </Button>
        )}
      </div>
    </div>
  );
}

export function NextUpList({
  entries,
  onSkip,
  onCancel,
  loadingId,
}: {
  entries: QueueEntryLike[];
  onSkip: (id: string) => void;
  onCancel: (id: string) => void;
  loadingId?: string | null;
}) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Não há próximos participantes aguardando.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry, idx) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary">
              {idx + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {queueNumberLabel(entry.queueNumber)} · {entry.name}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSkip(entry.id)}
              isLoading={loadingId === entry.id}
              aria-label={`Pular ${entry.name}`}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancel(entry.id)}
              isLoading={loadingId === entry.id}
              aria-label={`Cancelar ${entry.name}`}
              className="text-danger hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CallNextButton({ onClick, isLoading, disabled }: { onClick: () => void; isLoading?: boolean; disabled?: boolean }) {
  return (
    <Button
      variant="accent"
      size="lg"
      onClick={onClick}
      isLoading={isLoading}
      disabled={disabled}
      className="w-full text-lg shadow-elevated animate-pulse-ring"
    >
      <PhoneCall className="h-5 w-5" />
      CHAMAR PRÓXIMO
    </Button>
  );
}
