'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Eye, LayoutDashboard, Share2, CheckCircle2 } from 'lucide-react';
import { createEventSchema, type CreateEventInput } from '@/lib/validations';
import { Input, Label, FieldError, Textarea, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = React.useState<{ id: string; publicSlug: string; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { status: 'DRAFT' },
  });

  const onSubmit = async (data: CreateEventInput) => {
    setSubmitError(null);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await response.json();

      if (!response.ok) {
        setSubmitError(payload.error || 'Não foi possível criar o evento.');
        return;
      }

      setCreatedEvent(payload.event);
    } catch {
      setSubmitError('Não foi possível criar o evento. Tente novamente.');
    }
  };

  if (createdEvent) {
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/fila/${createdEvent.publicSlug}`;

    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Seu evento está pronto.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{createdEvent.name}</p>

          <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link da fila</p>
            <p className="mt-1 break-all font-mono text-sm text-primary">{publicUrl}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast({ title: 'Link copiado!', variant: 'success' });
              }}
            >
              <Copy className="h-4 w-4" /> Copiar link
            </Button>
            <a href={`/fila/${createdEvent.publicSlug}`} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4" /> Visualizar fila
              </Button>
            </a>
            <Link href={`/dashboard/eventos/${createdEvent.id}`}>
              <Button className="w-full">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Button
              variant="accent"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: createdEvent.name, url: publicUrl });
                } else {
                  navigator.clipboard.writeText(publicUrl);
                  toast({ title: 'Link copiado para compartilhar!', variant: 'success' });
                }
              }}
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Novo evento</h1>
      <p className="mt-1 text-sm text-muted-foreground">Preencha os dados abaixo para criar sua fila.</p>

      <Card className="mt-6 p-6">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="name">Nome do evento</Label>
            <Input id="name" placeholder="Ex: Feira de Tecnologia 2026" error={errors.name?.message} {...register('name')} />
            <FieldError id="name" message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" placeholder="Conte um pouco sobre o evento" error={errors.description?.message} {...register('description')} />
            <FieldError id="description" message={errors.description?.message} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" error={errors.date?.message} {...register('date')} />
              <FieldError id="date" message={errors.date?.message} />
            </div>
            <div>
              <Label htmlFor="startTime">Hora de início</Label>
              <Input id="startTime" type="time" error={errors.startTime?.message} {...register('startTime')} />
              <FieldError id="startTime" message={errors.startTime?.message} />
            </div>
            <div>
              <Label htmlFor="endTime">Hora de encerramento</Label>
              <Input id="endTime" type="time" error={errors.endTime?.message} {...register('endTime')} />
              <FieldError id="endTime" message={errors.endTime?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Local</Label>
            <Input id="location" placeholder="Ex: Centro de Convenções, São Paulo" error={errors.location?.message} {...register('location')} />
            <FieldError id="location" message={errors.location?.message} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="maxParticipants">Limite de participantes (opcional)</Label>
              <Input id="maxParticipants" type="number" min={1} placeholder="Sem limite" error={errors.maxParticipants?.message} {...register('maxParticipants')} />
              <FieldError id="maxParticipants" message={errors.maxParticipants?.message} />
            </div>
            <div>
              <Label htmlFor="status">Status inicial</Label>
              <Select id="status" defaultValue="DRAFT" {...register('status')}>
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Ativo</option>
                <option value="PAUSED">Pausado</option>
              </Select>
            </div>
          </div>

          {submitError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Criar evento
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
