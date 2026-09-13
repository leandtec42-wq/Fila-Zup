import * as React from 'react';
import { cn } from '@/lib/utils';
import { QUEUE_STATUS_LABEL, EVENT_STATUS_LABEL } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-50 text-primary-700',
  success: 'bg-green-50 text-success',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
  accent: 'bg-accent-light text-primary-dark',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

const QUEUE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  WAITING: 'muted',
  CALLED: 'accent',
  IN_SERVICE: 'default',
  COMPLETED: 'success',
  SKIPPED: 'warning',
  CANCELLED: 'danger',
};

export function QueueStatusBadge({ status }: { status: string }) {
  return <Badge variant={QUEUE_STATUS_VARIANT[status] ?? 'default'}>{QUEUE_STATUS_LABEL[status] ?? status}</Badge>;
}

const EVENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  DRAFT: 'muted',
  ACTIVE: 'success',
  PAUSED: 'warning',
  CLOSED: 'danger',
};

export function EventStatusBadge({ status }: { status: string }) {
  return <Badge variant={EVENT_STATUS_VARIANT[status] ?? 'default'}>{EVENT_STATUS_LABEL[status] ?? status}</Badge>;
}
