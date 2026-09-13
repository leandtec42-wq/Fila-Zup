'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setSubmitError(null);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();

    if (!response.ok) {
      setSubmitError(payload.error || 'Não foi possível redefinir sua senha. Tente novamente.');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 2500);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/60 to-background px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={40} textClassName="text-xl font-bold text-primary" />
        </Link>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-elevated">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-foreground">Senha redefinida!</h1>
              <p className="mt-2 text-sm text-muted-foreground">Redirecionando para o login...</p>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="text-sm text-danger">
                Link inválido. Solicite um novo link em{' '}
                <Link href="/esqueci-senha" className="font-semibold underline">
                  esqueci minha senha
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">Criar nova senha</h1>
              <p className="mt-1 text-sm text-muted-foreground">Escolha uma nova senha para sua conta.</p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <input type="hidden" {...register('token')} />
                <div>
                  <Label htmlFor="password">Nova senha</Label>
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
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
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
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redefinir senha'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
