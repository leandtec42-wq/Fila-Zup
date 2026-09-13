'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Users, BarChart3, Settings, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/eventos', label: 'Eventos', icon: CalendarDays },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-64 shrink-0 flex-col border-r border-border bg-white',
        mobile ? 'flex h-full w-full' : 'hidden lg:flex'
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Logo size={32} />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white shadow-card'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Zup © {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}

export function EventSubNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/eventos/${eventId}`;

  const items = [
    { href: base, label: 'Visão geral', icon: LayoutDashboard, exact: true },
    { href: `${base}/fila`, label: 'Fila em tempo real', icon: ListChecks },
    { href: `${base}/participantes`, label: 'Participantes', icon: Users },
    { href: `${base}/metricas`, label: 'Métricas', icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-4">
      {items.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              isActive ? 'bg-primary text-white' : 'bg-muted text-foreground/70 hover:bg-primary-100'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
