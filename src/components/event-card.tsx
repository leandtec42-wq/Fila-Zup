'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, CheckCircle2, MoreVertical, Copy, Pencil, Trash2, XCircle } from 'lucide-react';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { EventStatusBadge } from '@/components/ui/badge';
import { formatDateBR } from '@/lib/utils';

export type EventCardData = {
  id: string;
  name: string;
  date: string | Date;
  status: string;
  totalParticipants: number;
  totalCompleted: number;
  publicSlug: string;
  location?: string | null;
};

export function EventCard({
  event,
  onDuplicate,
  onClose,
  onDelete,
}: {
  event: EventCardData;
  onDuplicate: (id: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <Card className="flex flex-col p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/dashboard/eventos/${event.id}`} className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground hover:text-primary">{event.name}</h3>
        </Link>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Mais ações"
            aria-haspopup="menu"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-border bg-white p-1.5 shadow-elevated"
            >
              <Link
                href={`/dashboard/eventos/${event.id}/editar`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <Pencil className="h-4 w-4" /> Editar
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(event.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <Copy className="h-4 w-4" /> Duplicar
              </button>
              {event.status !== 'CLOSED' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onClose(event.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <XCircle className="h-4 w-4" /> Encerrar
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(event.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" /> {formatDateBR(event.date)}
        </span>
        {event.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {event.location}
          </span>
        )}
      </div>

      <div className="mt-4">
        <EventStatusBadge status={event.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">{event.totalParticipants}</p>
            <p className="text-xs text-muted-foreground">Participantes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <div>
            <p className="text-sm font-semibold text-foreground">{event.totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Atendidos</p>
          </div>
        </div>
      </div>

      <Link
        href={`/dashboard/eventos/${event.id}`}
        className="mt-4 inline-flex items-center justify-center rounded-xl border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary-50"
      >
        Abrir evento
      </Link>
    </Card>
  );
}
