import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export function StatCard({
  label,
  value,
  icon,
  accent = false,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: boolean;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', accent && 'border-accent bg-accent-light/30', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              accent ? 'bg-accent text-primary-dark' : 'bg-primary-50 text-primary'
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
    </Card>
  );
}
