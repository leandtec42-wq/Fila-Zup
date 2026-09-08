'use client';

import * as React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Copy, Eye, Pencil, Users, ListChecks, CheckCircle2, SkipForward } from 'lucide-react';
import { EventSubNav } from '@/components/sidebar';
import { EventStatusBadge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDateBR } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EventOverviewPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useSWR(`/api/events/${params.id}`, fetcher);
  const { data: liveData } = useSWR(`/api/events/${params.id}/queue/live`, fetcher, { refreshInterval: 8000 });
  const { toast } = useToast();

  if (isLoading || !data) return <LoadingState label="Carregando evento..." />;
  if (data.error) return <p className="text-danger">{data.error}</p>;

  const event = data.event;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/fila/${event.publicSlug}`;
  const counts = liveData?.counts;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
              <EventStatusBadge status={event.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {formatDateBR(event.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {event.startTime} - {event.endTime}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {event.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast({ title: 'Link copiado!', variant: 'success' });
              }}
            >
              <Copy className="h-4 w-4" /> Copiar link
            </Button>
            <a href={`/fila/${event.publicSlug}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" /> Ver fila pública
              </Button>
            </a>
            <Link href={`/dashboard/eventos/${event.id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <EventSubNav eventId={event.id} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={counts?.total ?? '–'} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Aguardando" value={counts?.waiting ?? '–'} icon={<ListChecks className="h-4 w-4" />} accent />
        <StatCard label="Atendidos" value={counts?.completed ?? '–'} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Pulados" value={counts?.skipped ?? '–'} icon={<SkipForward className="h-4 w-4" />} />
        <StatCard label="Cancelados" value={counts?.cancelled ?? '–'} />
        <StatCard label="Limite" value={event.maxParticipants ?? 'Sem limite'} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/dashboard/eventos/${event.id}/fila`}>
          <Button variant="accent" size="lg">
            Ir para a fila em tempo real
          </Button>
        </Link>
        <Link href={`/dashboard/eventos/${event.id}/participantes`}>
          <Button variant="outline" size="lg">
            Ver participantes
          </Button>
        </Link>
        <Link href={`/dashboard/eventos/${event.id}/metricas`}>
          <Button variant="outline" size="lg">
            Ver métricas
          </Button>
        </Link>
      </div>
    </div>
  );
}
