'use client';

import useSWR from 'swr';
import { Dialog } from '@/components/ui/dialog';
import { QueueStatusBadge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDateTimeBR, formatDurationShort, queueNumberLabel } from '@/lib/utils';
import { formatPhoneForDisplay } from '@/lib/phone';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ACTION_LABEL: Record<string, string> = {
  QUEUE_JOINED: 'Entrou na fila',
  QUEUE_CALLED: 'Foi chamado(a)',
  SERVICE_STARTED: 'Atendimento iniciado',
  SERVICE_COMPLETED: 'Atendimento concluído',
  QUEUE_SKIPPED: 'Foi pulado(a)',
  QUEUE_CANCELLED: 'Entrada cancelada',
  WHATSAPP_SENT: 'Mensagem de WhatsApp enviada',
  WHATSAPP_FAILED: 'Falha ao enviar WhatsApp',
  PARTICIPANT_DATA_ERASED: 'Dados pessoais removidos (LGPD)',
};

export function ParticipantDetailDialog({ entryId, onClose }: { entryId: string; onClose: () => void }) {
  const { data, isLoading } = useSWR(`/api/queue/${entryId}`, fetcher);

  const entry = data?.entry;

  return (
    <Dialog open onClose={onClose} title={entry ? entry.name : 'Detalhes do participante'} className="max-w-2xl">
      {isLoading || !data ? (
        <LoadingState label="Carregando..." />
      ) : data.error ? (
        <p className="text-danger">{data.error}</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Senha" value={queueNumberLabel(entry.queueNumber)} />
            <Field label="Status" value={<QueueStatusBadge status={entry.status} />} />
            <Field label="Posição" value={data.position ?? '–'} />
            <Field label="E-mail" value={entry.email} />
            <Field label="WhatsApp" value={formatPhoneForDisplay(entry.phone)} />
            <Field label="Evento" value={data.event?.name} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Entrada" value={formatDateTimeBR(entry.createdAt)} />
            <Field label="Chamada" value={entry.calledAt ? formatDateTimeBR(entry.calledAt) : '–'} />
            <Field label="Início atend." value={entry.serviceStartedAt ? formatDateTimeBR(entry.serviceStartedAt) : '–'} />
            <Field label="Conclusão" value={entry.completedAt ? formatDateTimeBR(entry.completedAt) : '–'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Tempo de espera"
              value={
                entry.calledAt
                  ? formatDurationShort(new Date(entry.calledAt).getTime() - new Date(entry.createdAt).getTime())
                  : '–'
              }
            />
            <Field
              label="Tempo de atendimento"
              value={
                entry.completedAt && entry.serviceStartedAt
                  ? formatDurationShort(new Date(entry.completedAt).getTime() - new Date(entry.serviceStartedAt).getTime())
                  : '–'
              }
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Histórico de ações</h3>
            <ol className="space-y-2 border-l-2 border-border pl-4">
              {data.actions.map((action: any) => (
                <li key={action.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">{ACTION_LABEL[action.action] ?? action.action}</span>{' '}
                  <span className="text-muted-foreground">— {formatDateTimeBR(action.createdAt)}</span>
                </li>
              ))}
            </ol>
          </div>

          {data.messages?.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Mensagens de WhatsApp</h3>
              <ul className="space-y-2">
                {data.messages.map((msg: any) => (
                  <li key={msg.id} className="rounded-xl border border-border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{msg.messageType}</span>
                      <span
                        className={
                          msg.status === 'SENT' || msg.status === 'LOGGED_DEV_MODE'
                            ? 'text-success'
                            : msg.status === 'FAILED'
                            ? 'text-danger'
                            : 'text-muted-foreground'
                        }
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTimeBR(msg.createdAt)}</p>
                    {msg.error && <p className="mt-1 text-xs text-danger">{msg.error}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
