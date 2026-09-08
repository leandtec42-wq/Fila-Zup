import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gera um identificador público curto, único e difícil de adivinhar
 * para compor a URL pública do evento: /fila/{slug}
 */
export function generatePublicSlug(): string {
  return crypto.randomBytes(6).toString('base64url'); // ~8 caracteres, url-safe
}

export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(d);
}

export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

export function formatDurationShort(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours === 0) return `${remMinutes}min ${seconds}s`;
  return `${hours}h ${remMinutes}min`;
}

export function queueNumberLabel(n: number): string {
  return `#${String(n).padStart(3, '0')}`;
}

export const EVENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  CLOSED: 'Encerrado',
};

export const QUEUE_STATUS_LABEL: Record<string, string> = {
  WAITING: 'Aguardando',
  CALLED: 'Chamado',
  IN_SERVICE: 'Em atendimento',
  COMPLETED: 'Atendido',
  SKIPPED: 'Pulado',
  CANCELLED: 'Cancelado',
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
