'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { EventSubNav } from '@/components/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CallNextButton, CurrentServingCard, NextUpList } from '@/components/queue-card';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const LIVE_REFRESH_MS = 4000;

export default function EventQueuePage({ params }: { params: { id: string } }) {
  const key = `/api/events/${params.id}/queue/live?limit=8`;
  const { data, isLoading } = useSWR(key, fetcher, { refreshInterval: LIVE_REFRESH_MS });
  const { toast } = useToast();
  const [callLoading, setCallLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  async function handleCallNext() {
    setCallLoading(true);
    try {
      const response = await fetch(`/api/events/${params.id}/queue/next`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        toast({ title: 'Não foi possível chamar o próximo', description: payload.error, variant: 'error' });
        return;
      }
      toast({ title: `${payload.entry.name} foi chamado(a)`, description: payload.whatsappSent ? 'WhatsApp enviado.' : 'Falha ao enviar WhatsApp — verifique a configuração.', variant: payload.whatsappSent ? 'success' : 'info' });
      mutate(key);
    } finally {
      setCallLoading(false);
    }
  }

  async function handleAction(entryId: string, action: 'start' | 'complete' | 'skip' | 'cancel') {
    setActionLoading(entryId);
    try {
      const response = await fetch(`/api/queue/${entryId}/${action}`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        toast({ title: 'Ação não realizada', description: payload.error, variant: 'error' });
        return;
      }
      mutate(key);
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading && !data) return <LoadingState label="Carregando fila..." />;

  const current = data?.current ?? null;
  const next = data?.next ?? [];
  const counts = data?.counts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{data?.event?.name}</h1>
        <p className="text-sm text-muted-foreground">Fila em tempo real</p>
      </div>

      <EventSubNav eventId={params.id} />

      {data?.event?.status !== 'ACTIVE' && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-warning">
          Este evento está com status <strong>{data?.event?.status}</strong>. Novos participantes só podem
          entrar na fila quando o evento estiver <strong>Ativo</strong>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CurrentServingCard
            entry={current}
            onStart={(id) => handleAction(id, 'start')}
            onComplete={(id) => handleAction(id, 'complete')}
            isLoading={actionLoading === current?.id}
          />

          <CallNextButton onClick={handleCallNext} isLoading={callLoading} disabled={!counts || counts.waiting === 0} />

          <Card>
            <CardHeader>
              <CardTitle>Próximos ({counts?.waiting ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <NextUpList
                entries={next}
                onSkip={(id) => handleAction(id, 'skip')}
                onCancel={(id) => handleAction(id, 'cancel')}
                loadingId={actionLoading}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Total de inscritos" value={counts?.total ?? 0} />
            <SummaryRow label="Aguardando" value={counts?.waiting ?? 0} />
            <SummaryRow label="Atendidos" value={counts?.completed ?? 0} />
            <SummaryRow label="Pulados" value={counts?.skipped ?? 0} />
            <SummaryRow label="Cancelados" value={counts?.cancelled ?? 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}
