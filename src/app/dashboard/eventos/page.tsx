'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EventCard, EventCardData } from '@/components/event-card';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EventsPage() {
  const { data, isLoading } = useSWR('/api/events', fetcher);
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [confirmClose, setConfirmClose] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const events: EventCardData[] = data?.events ?? [];

  async function handleDuplicate(id: string) {
    const response = await fetch(`/api/events/${id}/duplicate`, { method: 'POST' });
    if (response.ok) {
      toast({ title: 'Evento duplicado com sucesso', variant: 'success' });
      mutate('/api/events');
    } else {
      toast({ title: 'Não foi possível duplicar o evento', variant: 'error' });
    }
  }

  async function handleClose() {
    if (!confirmClose) return;
    setActionLoading(true);
    const response = await fetch(`/api/events/${confirmClose}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    setActionLoading(false);
    setConfirmClose(null);
    if (response.ok) {
      toast({ title: 'Evento encerrado', variant: 'success' });
      mutate('/api/events');
    } else {
      toast({ title: 'Não foi possível encerrar o evento', variant: 'error' });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    const response = await fetch(`/api/events/${confirmDelete}`, { method: 'DELETE' });
    setActionLoading(false);
    setConfirmDelete(null);
    if (response.ok) {
      toast({ title: 'Evento excluído', variant: 'success' });
      mutate('/api/events');
    } else {
      toast({ title: 'Não foi possível excluir o evento', variant: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus eventos</h1>
          <p className="text-sm text-muted-foreground">Gerencie todos os seus eventos e filas.</p>
        </div>
        <Link href="/dashboard/eventos/novo">
          <Button variant="accent">
            <Plus className="h-4 w-4" /> Novo evento
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <LoadingState label="Carregando eventos..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Nenhum evento criado ainda"
          description="Crie seu primeiro evento para gerar o link público da fila."
          action={
            <Link href="/dashboard/eventos/novo">
              <Button variant="accent">
                <Plus className="h-4 w-4" /> Criar meu primeiro evento
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDuplicate={handleDuplicate}
              onClose={(id) => setConfirmClose(id)}
              onDelete={(id) => setConfirmDelete(id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmClose)}
        onClose={() => setConfirmClose(null)}
        onConfirm={handleClose}
        title="Encerrar evento"
        description="Ao encerrar, o evento não aceitará mais novas pessoas na fila. Esta ação pode ser revertida editando o evento."
        confirmLabel="Encerrar evento"
        isDanger={false}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir evento"
        description="Esta ação é permanente e removerá todos os dados da fila deste evento, incluindo participantes e histórico. Não é possível desfazer."
        confirmLabel="Excluir permanentemente"
        isLoading={actionLoading}
      />
    </div>
  );
}
