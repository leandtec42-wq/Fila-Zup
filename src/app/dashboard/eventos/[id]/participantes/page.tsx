'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { Search, Eye, SkipForward, XCircle, Trash2 } from 'lucide-react';
import { EventSubNav } from '@/components/sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { QueueStatusBadge } from '@/components/ui/badge';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ParticipantDetailDialog } from '@/components/participant-detail-dialog';
import { formatDateTimeBR, queueNumberLabel } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ParticipantsPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null);
  const [eraseEntryId, setEraseEntryId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const queryString = new URLSearchParams({
    page: String(page),
    pageSize: '15',
    ...(status && { status }),
    ...(debouncedSearch && { search: debouncedSearch }),
  }).toString();

  const key = `/api/events/${params.id}/queue?${queryString}`;
  const { data, isLoading } = useSWR(key, fetcher, { refreshInterval: 10000 });

  async function handleAction(entryId: string, action: 'call' | 'skip' | 'cancel') {
    const url = action === 'call' ? `/api/events/${params.id}/queue/next` : `/api/queue/${entryId}/${action}`;
    const response = await fetch(url, { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      toast({ title: 'Ação não realizada', description: payload.error, variant: 'error' });
      return;
    }
    toast({ title: 'Ação realizada com sucesso', variant: 'success' });
    mutate(key);
  }

  async function handleErase() {
    if (!eraseEntryId) return;
    const response = await fetch(`/api/queue/${eraseEntryId}`, { method: 'DELETE' });
    if (response.ok) {
      toast({ title: 'Dados do participante removidos', variant: 'success' });
      mutate(key);
    } else {
      toast({ title: 'Não foi possível remover os dados', variant: 'error' });
    }
    setEraseEntryId(null);
  }

  const entries = data?.entries ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Participantes</h1>
        <p className="text-sm text-muted-foreground">Busque, filtre e gerencie todos os participantes deste evento.</p>
      </div>

      <EventSubNav eventId={params.id} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-48"
        >
          <option value="">Todos os status</option>
          <option value="WAITING">Aguardando</option>
          <option value="CALLED">Chamado</option>
          <option value="IN_SERVICE">Em atendimento</option>
          <option value="COMPLETED">Atendido</option>
          <option value="SKIPPED">Pulado</option>
          <option value="CANCELLED">Cancelado</option>
        </Select>
      </div>

      {isLoading && !data ? (
        <LoadingState label="Carregando participantes..." />
      ) : entries.length === 0 ? (
        <EmptyState title="Nenhum participante encontrado" description="Ajuste os filtros ou aguarde novas inscrições." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posição</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Atendimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono font-semibold text-primary">{queueNumberLabel(entry.queueNumber)}</TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.email}</p>
                  </TableCell>
                  <TableCell>
                    <QueueStatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell>{entry.position ?? '–'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTimeBR(entry.createdAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.completedAt ? formatDateTimeBR(entry.completedAt) : '–'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedEntryId(entry.id)} aria-label="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {entry.status === 'WAITING' && (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(entry.id, 'skip')} aria-label="Pular">
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      )}
                      {['WAITING', 'CALLED', 'IN_SERVICE'].includes(entry.status) && (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(entry.id, 'cancel')} aria-label="Cancelar" className="text-danger hover:bg-red-50">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEraseEntryId(entry.id)} aria-label="Excluir dados" className="text-danger hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} · {pagination.total} participantes
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedEntryId && (
        <ParticipantDetailDialog entryId={selectedEntryId} onClose={() => setSelectedEntryId(null)} />
      )}

      <ConfirmDialog
        open={Boolean(eraseEntryId)}
        onClose={() => setEraseEntryId(null)}
        onConfirm={handleErase}
        title="Excluir dados do participante"
        description="Isso removerá permanentemente o nome, e-mail e telefone deste participante (LGPD), mantendo apenas o registro estatístico anônimo. Esta ação não pode ser desfeita."
        confirmLabel="Excluir dados"
      />
    </div>
  );
}
