'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/ui/google-icon';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setSubmitError(null);
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setSubmitError('E-mail ou senha incorretos.');
      return;
    }

    toast({ title: 'Login realizado com sucesso', variant: 'success' });
    router.push(searchParams.get('callbackUrl') || '/dashboard');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/60 to-background px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={40} textClassName="text-xl font-bold text-primary" />
        </Link>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-elevated">
          <h1 className="text-2xl font-bold text-foreground">Entrar na sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse o painel para administrar seus eventos.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <FieldError id="password" message={errors.password?.message} />
            </div>

            {submitError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
                {submitError}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
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
            onClick={() => signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/dashboard' })}
          >
            <GoogleIcon className="h-4 w-4" />
            Entrar com Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem uma conta?{' '}
            <Link href="/cadastro" className="font-semibold text-primary hover:underline">
              Criar meu evento
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
