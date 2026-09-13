'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { Logo } from '@/components/logo';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // Sempre mostramos a mesma tela de sucesso, exista ou não a conta.
    setSubmitted(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/60 to-background px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={40} textClassName="text-xl font-bold text-primary" />
        </Link>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-elevated">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
                <MailCheck className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-foreground">Verifique seu e-mail</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Se existir uma conta com esse e-mail, enviamos um link para você redefinir sua senha. O link
                é válido por 1 hora.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Informe seu e-mail e enviaremos um link para você criar uma nova senha.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <FieldError id="email" message={errors.email?.message} />
                </div>

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link de redefinição'}
                </Button>
              </form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
