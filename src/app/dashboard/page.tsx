'use client';

import * as React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { CalendarDays, Users, ListChecks, CheckCircle2, TrendingUp, Plus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/input';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Range = 'today' | '7d' | '30d';

export default function DashboardPage() {
  const [range, setRange] = React.useState<Range>('7d');
  const { data, isLoading } = useSWR(`/api/dashboard/overview?range=${range}`, fetcher, {
    refreshInterval: 20000,
  });

  const overview = data?.overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral de todos os seus eventos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onChange={(e) => setRange(e.target.value as Range)} className="w-40">
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </Select>
          <Link href="/dashboard/eventos/novo">
            <Button variant="accent">
              <Plus className="h-4 w-4" /> Novo evento
            </Button>
          </Link>
        </div>
      </div>

      {isLoading || !overview ? (
        <LoadingState label="Carregando dashboard..." />
      ) : overview.totalEvents === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Você ainda não criou nenhum evento"
          description="Crie seu primeiro evento para começar a organizar sua fila de atendimento."
          action={
            <Link href="/dashboard/eventos/novo">
              <Button variant="accent">
                <Plus className="h-4 w-4" /> Criar meu primeiro evento
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Eventos ativos" value={overview.activeEvents} icon={<CalendarDays className="h-4 w-4" />} />
            <StatCard label="Total de participantes" value={overview.totalParticipants} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Pessoas na fila" value={overview.waiting} icon={<ListChecks className="h-4 w-4" />} />
            <StatCard label="Pessoas atendidas" value={overview.completed} icon={<CheckCircle2 className="h-4 w-4" />} accent />
            <StatCard
              label="Taxa de conclusão"
              value={`${Math.round(overview.completionRate * 100)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Participantes por evento" description="Comparativo de participantes e atendimentos">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.participantsByEvent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DEEE" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="participantes" fill="#6A00A8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="atendidos" fill="#D0E94B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status dos participantes" description="Distribuição geral no período selecionado">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {overview.statusBreakdown.map((entry: { color: string }, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
