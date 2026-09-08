'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Clock, Users, CheckCircle2, TrendingDown, TrendingUp, Timer } from 'lucide-react';
import {
  LineChart,
  Line,
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
import { EventSubNav } from '@/components/sidebar';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { Select } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDurationShort } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EventMetricsPage({ params }: { params: { id: string } }) {
  const [range, setRange] = React.useState<'today' | '7d' | '30d'>('7d');
  const { data, isLoading } = useSWR(`/api/events/${params.id}/metrics?range=${range}`, fetcher, {
    refreshInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Métricas</h1>
          <p className="text-sm text-muted-foreground">Indicadores detalhados deste evento.</p>
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value as any)} className="w-44">
          <option value="today">Hoje</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
        </Select>
      </div>

      <EventSubNav eventId={params.id} />

      {isLoading || !data ? (
        <LoadingState label="Calculando métricas..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total de participantes" value={data.metrics.total} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Taxa de atendimento" value={`${Math.round(data.metrics.completionRate * 100)}%`} icon={<TrendingUp className="h-4 w-4" />} accent />
            <StatCard label="Taxa de desistência" value={`${Math.round(data.metrics.dropoutRate * 100)}%`} icon={<TrendingDown className="h-4 w-4" />} />
            <StatCard label="Tempo médio de espera" value={formatDurationShort(data.metrics.avgWaitTimeMs)} icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Tempo médio de atendimento" value={formatDurationShort(data.metrics.avgServiceTimeMs)} icon={<Timer className="h-4 w-4" />} />
            <StatCard label="Maior tempo de espera" value={formatDurationShort(data.metrics.maxWaitTimeMs)} />
            <StatCard label="Menor tempo de espera" value={formatDurationShort(data.metrics.minWaitTimeMs)} />
            <StatCard label="Atendidos" value={data.metrics.completed} icon={<CheckCircle2 className="h-4 w-4" />} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Entrada de participantes por horário" description="Quantas pessoas entraram na fila em cada horário">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hourlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DEEE" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="entradas" stroke="#6A00A8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Atendimentos por horário" description="Quantos atendimentos foram concluídos em cada horário">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DEEE" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="atendimentos" fill="#D0E94B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status dos participantes" description="Distribuição por status no período">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.statusBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {data.statusBreakdown.map((entry: { color: string }, index: number) => (
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
