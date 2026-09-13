'use client';

import * as React from 'react';
import { signOut } from 'next-auth/react';
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';

export function Header({ userName, companyName }: { userName: string; companyName: string }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-foreground hover:bg-muted lg:hidden"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={mobileNavOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">{companyName}</p>
          <p className="text-xs text-muted-foreground">Olá, {userName.split(' ')[0]}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative rounded-full p-2 text-foreground hover:bg-muted"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-white p-1.5 shadow-elevated animate-fade-in"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{userName}</p>
              </div>
              <button
                role="menuitem"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 top-16 z-20 bg-white lg:hidden">
          <Sidebar mobile />
        </div>
      )}
    </header>
  );
}
