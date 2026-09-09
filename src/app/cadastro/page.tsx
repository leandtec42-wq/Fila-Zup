'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '@/components/logo';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/ui/google-icon';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setSubmitError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = await response.json();

      if (!response.ok) {
        setSubmitError(payload.error || 'Não foi possível criar sua conta. Tente novamente.');
        return;
      }

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setSubmitError('Conta criada, mas não foi possível entrar automaticamente. Faça login.');
        router.push('/login');
        return;
      }

      toast({ title: 'Conta criada com sucesso!', description: 'Vamos criar seu primeiro evento.', variant: 'success' });
      router.push('/dashboard/eventos/novo');
      router.refresh();
    } catch {
      setSubmitError('Não foi possível criar sua conta. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/60 to-background px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={40} textClassName="text-xl font-bold text-primary" />
        </Link>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-elevated">
          <h1 className="text-2xl font-bold text-foreground">Crie sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comece a organizar suas filas em poucos minutos.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" autoComplete="name" error={errors.name?.message} {...register('name')} />
              <FieldError id="name" message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="companyName">Nome da empresa</Label>
              <Input id="companyName" error={errors.companyName?.message} {...register('companyName')} />
              <FieldError id="companyName" message={errors.companyName?.message} />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              <FieldError id="email" message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <FieldError id="password" message={errors.password?.message} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <FieldError id="confirmPassword" message={errors.confirmPassword?.message} />
            </div>

            {submitError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
                {submitError}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Criar conta
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => signIn('google', { callbackUrl: '/dashboard/eventos/novo' })}
          >
            <GoogleIcon className="h-4 w-4" />
            Criar conta com Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
