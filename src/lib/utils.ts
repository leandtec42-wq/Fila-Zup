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

/**
 * Os eventos são todos no Brasil, então toda a lógica de data/hora (exibição,
 * "hoje", validação de data passada) é fixada em America/Sao_Paulo — nunca no
 * fuso do dispositivo de quem está olhando a tela. Sem isso, um admin viajando
 * (ou até o próprio servidor, se não estiver em UTC-3) veria/validaria datas
 * erradas, porque `new Date()` e `Intl.DateTimeFormat` sem `timeZone` explícito
 * usam o fuso local de quem executa o código, não o do evento.
 */
export const EVENT_TIMEZONE = 'America/Sao_Paulo';

export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: EVENT_TIMEZONE }).format(d);
}

export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: EVENT_TIMEZONE }).format(d);
}

/** Data de hoje no formato YYYY-MM-DD, no fuso horário do Brasil. */
export function todayLocalDateInput(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: EVENT_TIMEZONE }).format(new Date());
}

/**
 * Converte uma data (YYYY-MM-DD) no início/fim do dia no Brasil para um
 * instante UTC real. O Brasil não usa mais horário de verão desde 2019, então
 * o deslocamento -03:00 é sempre válido, sem casos especiais de DST.
 */
export function brazilDayStartUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00-03:00`);
}

export function brazilDayEndUtc(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999-03:00`);
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
