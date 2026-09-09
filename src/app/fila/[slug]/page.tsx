'use client';

import * as React from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Clock, Users, MessageCircleHeart, AlertCircle, PauseCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Input, Label, FieldError } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { queueNumberLabel, formatDateBR } from '@/lib/utils';

const publicJoinSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome completo')
    .refine((val) => val.trim().split(/\s+/).length >= 2, 'Informe nome e sobrenome'),
  email: z.string().trim().email('Informe um e-mail válido'),
  phone: z.string().trim().min(8, 'Informe um WhatsApp válido'),
  consentWhatsApp: z.boolean().refine((v) => v === true, 'É necessário aceitar receber atualizações pelo WhatsApp'),
});

type PublicJoinInput = z.infer<typeof publicJoinSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function storageKey(slug: string) {
  return `zup:entry:${slug}`;
}

export default function PublicQueuePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { data, isLoading, error } = useSWR(`/api/public/events/${slug}`, fetcher, { refreshInterval: 15000 });
  const [entryId, setEntryId] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(slug));
    if (stored) setEntryId(stored);
    setHydrated(true);
  }, [slug]);

  if (isLoading || !hydrated) {
    return (
      <PublicShell>
        <LoadingState label="Carregando evento..." />
      </PublicShell>
    );
  }

  if (error || data?.error) {
    return (
      <PublicShell>
        <ErrorCard title="Evento não encontrado" description="Verifique se o link que você recebeu está correto." />
      </PublicShell>
    );
  }

  const event = data.event;

  return (
    <PublicShell>
      {entryId ? (
        <QueueStatusView entryId={entryId} eventName={event.name} onLeave={() => {
          window.localStorage.removeItem(storageKey(slug));
          setEntryId(null);
        }} />
      ) : (
        <JoinQueueView slug={slug} event={event} onJoined={(id) => {
          window.localStorage.setItem(storageKey(slug), id);
          setEntryId(id);
        }} />
      )}
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-primary-50/70 to-background px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Logo size={40} textClassName="text-xl font-bold text-primary" />
      </div>
      <div className="w-full max-w-md animate-fade-in-up">{children}</div>
    </main>
  );
}

function ErrorCard({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-elevated">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-danger">
        {icon ?? <AlertCircle className="h-7 w-7" />}
      </div>
      <h1 className="mt-4 text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function JoinQueueView({
  slug,
  event,
  onJoined,
}: {
  slug: string;
  event: { name: string; description?: string | null; date: string; startTime: string; endTime: string; location?: string | null; status: string; waitingCount: number; companyName: string };
  onJoined: (entryId: string) => void;
}) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PublicJoinInput>({ resolver: zodResolver(publicJoinSchema), defaultValues: { consentWhatsApp: false } });

  const consentWhatsApp = watch('consentWhatsApp');

  if (event.status === 'DRAFT') {
    return <ErrorCard title="Evento ainda não publicado" description="Este evento ainda não está disponível para inscrições." icon={<PauseCircle className="h-7 w-7" />} />;
  }

  if (event.status === 'PAUSED') {
    return <ErrorCard title="Fila pausada" description="Este evento não está aceitando novas pessoas na fila no momento. Tente novamente em instantes." icon={<PauseCircle className="h-7 w-7" />} />;
  }

  if (event.status === 'CLOSED') {
    return <ErrorCard title="Evento encerrado" description="Este evento já foi encerrado e não aceita mais inscrições na fila." icon={<XCircle className="h-7 w-7" />} />;
  }

  const onSubmit = async (formData: PublicJoinInput) => {
    setSubmitError(null);
    try {
      const response = await fetch(`/api/events/${slug}/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const payload = await response.json();

      if (!response.ok) {
        setSubmitError(payload.error || 'Não foi possível entrar na fila. Tente novamente.');
        return;
      }

      onJoined(payload.entry.id);
    } catch {
      setSubmitError('Não foi possível entrar na fila. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-elevated sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{event.companyName}</p>
      <h1 className="mt-1 text-2xl font-bold text-foreground">{event.name}</h1>
      {event.description && <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{formatDateBR(event.date)}</span>
        <span>
          {event.startTime} - {event.endTime}
        </span>
        {event.location && <span>{event.location}</span>}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary">
        <Users className="h-4 w-4" />
        {event.waitingCount} {event.waitingCount === 1 ? 'pessoa aguardando' : 'pessoas aguardando'} agora
      </div>

      <h2 className="mt-6 text-lg font-bold text-foreground">Entre na fila</h2>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" autoComplete="name" placeholder="Seu nome completo" error={errors.name?.message} {...register('name')} />
          <FieldError id="name" message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="voce@email.com" error={errors.email?.message} {...register('email')} />
          <FieldError id="email" message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="phone">WhatsApp</Label>
          <PhoneInput id="phone" error={errors.phone?.message} {...register('phone')} />
          <FieldError id="phone" message={errors.phone?.message} />
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
          <input
            id="consentWhatsApp"
            type="checkbox"
            checked={consentWhatsApp}
            onChange={(e) => setValue('consentWhatsApp', e.target.checked, { shouldValidate: true })}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="consentWhatsApp" className="text-sm text-foreground">
            Concordo em receber atualizações sobre minha posição na fila pelo WhatsApp.
          </label>
        </div>
        <FieldError message={errors.consentWhatsApp?.message} />

        {submitError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
            {submitError}
          </p>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" isLoading={isSubmitting}>
          ENTRAR NA FILA
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Seus dados são usados apenas para organizar a fila deste evento.{' '}
        <a href="/privacidade" target="_blank" className="underline">
          Política de privacidade
        </a>
      </p>
    </div>
  );
}

function QueueStatusView({ entryId, eventName, onLeave }: { entryId: string; eventName: string; onLeave: () => void }) {
  const { data, error } = useSWR(`/api/public/queue/${entryId}`, fetcher, { refreshInterval: 5000 });

  if (error) {
    return <ErrorCard title="Não foi possível carregar sua posição" description="Verifique sua conexão com a internet." />;
  }

  if (!data) {
    return <LoadingState label="Buscando sua posição na fila..." />;
  }

  if (data.error) {
    return <ErrorCard title="Registro não encontrado" description="Não encontramos seu registro nesta fila." />;
  }

  const { status, queueNumber, position, peopleAhead } = data;

  if (status === 'COMPLETED') {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-elevated">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">Atendimento concluído!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Obrigado por participar do evento {eventName}. Sua senha era {queueNumberLabel(queueNumber)}.
        </p>
        <Button variant="outline" className="mt-6" onClick={onLeave}>
          Entrar em outra fila
        </Button>
      </div>
    );
  }

  if (status === 'SKIPPED' || status === 'CANCELLED') {
    return (
      <ErrorCard
        title={status === 'SKIPPED' ? 'Você foi pulado na fila' : 'Sua entrada foi cancelada'}
        description="Procure a organização do evento para mais informações."
        icon={<XCircle className="h-7 w-7" />}
      />
    );
  }

  const isBeingCalled = status === 'CALLED' || status === 'IN_SERVICE';

  return (
    <div className="rounded-2xl border-2 border-primary bg-white p-8 text-center shadow-elevated">
      {!isBeingCalled && (
        <button
          type="button"
          onClick={onLeave}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      )}
      {isBeingCalled ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary-dark animate-pulse-ring">
            <MessageCircleHeart className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Chegou a sua vez!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Dirija-se ao atendimento.</p>
        </>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Você está na fila!</p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Sua senha</p>
        </>
      )}

      <p className="mt-2 text-5xl font-extrabold tracking-tight text-primary">{queueNumberLabel(queueNumber)}</p>

      {!isBeingCalled && (
        <>
          <div className="mt-6 flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Você está em {position}º lugar
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {peopleAhead === 0 ? 'Você é o próximo!' : `${peopleAhead} ${peopleAhead === 1 ? 'pessoa à sua frente' : 'pessoas à sua frente'}`}
          </p>
        </>
      )}

      <div className="mt-6 rounded-xl bg-primary-50 p-4 text-sm text-primary">
        Fique atento ao seu WhatsApp. Você receberá uma mensagem quando sua vez estiver próxima ou quando for
        chamado.
      </div>
    </div>
  );
}
