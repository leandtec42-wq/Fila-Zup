'use client';

import * as React from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventInput } from '@/lib/validations';
import { Input, Label, FieldError, Textarea, Select } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function toDateInputValue(date: string) {
  return new Date(date).toISOString().slice(0, 10);
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading } = useSWR(`/api/events/${params.id}`, fetcher);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({ resolver: zodResolver(createEventSchema) });

  React.useEffect(() => {
    if (data?.event) {
      const e = data.event;
      reset({
        name: e.name,
        description: e.description ?? '',
        date: toDateInputValue(e.date),
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location ?? '',
        maxParticipants: e.maxParticipants != null ? String(e.maxParticipants) : undefined,
        status: e.status,
        allowReentryAfterCompletion: e.allowReentryAfterCompletion,
      });
    }
  }, [data, reset]);

  if (isLoading || !data) return <LoadingState label="Carregando evento..." />;

  const onSubmit = async (formData: CreateEventInput) => {
    setSubmitError(null);
    const response = await fetch(`/api/events/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const payload = await response.json();

    if (!response.ok) {
      setSubmitError(payload.error || 'Não foi possível salvar as alterações.');
      return;
    }

    toast({ title: 'Evento atualizado com sucesso', variant: 'success' });
    router.push(`/dashboard/eventos/${params.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Editar evento</h1>

      <Card className="mt-6 p-6">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="name">Nome do evento</Label>
            <Input id="name" error={errors.name?.message} {...register('name')} />
            <FieldError id="name" message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" error={errors.description?.message} {...register('description')} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" error={errors.date?.message} {...register('date')} />
              <FieldError id="date" message={errors.date?.message} />
            </div>
            <div>
              <Label htmlFor="startTime-hour">Hora de início</Label>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <TimePicker idPrefix="startTime" value={field.value} onChange={field.onChange} error={errors.startTime?.message} />
                )}
              />
              <FieldError id="startTime" message={errors.startTime?.message} />
            </div>
            <div>
              <Label htmlFor="endTime-hour">Hora de encerramento</Label>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <TimePicker idPrefix="endTime" value={field.value} onChange={field.onChange} error={errors.endTime?.message} />
                )}
              />
              <FieldError id="endTime" message={errors.endTime?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Local</Label>
            <Input id="location" error={errors.location?.message} {...register('location')} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="maxParticipants">Limite de participantes</Label>
              <Input id="maxParticipants" type="number" min={1} {...register('maxParticipants')} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register('status')}>
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Ativo</option>
                <option value="PAUSED">Pausado</option>
                <option value="CLOSED">Encerrado</option>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-border text-primary" {...register('allowReentryAfterCompletion')} />
            Permitir que participantes já atendidos entrem novamente na fila
          </label>

          {submitError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
