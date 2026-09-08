import Link from 'next/link';
import { Logo } from '@/components/logo';
import {
  QrCode,
  Users,
  PhoneCall,
  BarChart3,
  MessageCircle,
  Radar,
  ListChecks,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const BENEFITS = [
  { icon: ListChecks, title: 'Crie eventos em minutos', description: 'Configure nome, data, local e limite de participantes com um formulário simples e rápido.' },
  { icon: Radar, title: 'Organize sua fila', description: 'Cada participante recebe um número sequencial e sua posição é sempre calculada em tempo real.' },
  { icon: MessageCircle, title: 'Avise pelo WhatsApp', description: 'Integração real com a Meta WhatsApp Cloud API avisa automaticamente quando chegar a vez de cada um.' },
  { icon: PhoneCall, title: 'Acompanhe atendimentos', description: 'Chame o próximo com um clique — protegido contra cliques duplicados e concorrência.' },
  { icon: BarChart3, title: 'Veja métricas de verdade', description: 'Tempo médio de espera, taxa de atendimento, gráficos por horário e muito mais.' },
  { icon: Users, title: 'Contatos organizados', description: 'Nome, e-mail e WhatsApp de cada participante, com busca, filtros e exportação.' },
];

const STEPS = [
  { number: '01', title: 'Crie seu evento', description: 'Defina nome, data, horário e local. Em segundos seu evento está pronto.' },
  { number: '02', title: 'Compartilhe o link', description: 'Um link público exclusivo é gerado automaticamente para o seu evento.' },
  { number: '03', title: 'Pessoas entram na fila', description: 'Sem precisar criar conta — só nome, e-mail e WhatsApp.' },
  { number: '04', title: 'O sistema organiza tudo', description: 'Números sequenciais, posição em tempo real e histórico completo.' },
  { number: '05', title: 'Chame as pessoas', description: 'Um botão gigante: "Chamar próximo". Notificação automática pelo WhatsApp.' },
  { number: '06', title: 'Acompanhe os resultados', description: 'Dashboard com gráficos e métricas de cada evento, sempre atualizado.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size={32} />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              ENTRAR
            </Link>
            <Link
              href="/cadastro"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-primary-dark shadow-card transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              CRIAR MEU EVENTO
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 to-background">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-accent-light px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-dark">
              Novo · Notificações reais via WhatsApp
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Gerencie filas de eventos de forma <span className="text-primary">simples</span> e{' '}
              <span className="text-primary">inteligente</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Crie eventos, organize a fila de atendimento e avise cada participante pelo WhatsApp assim
              que chegar a vez dele. Tudo em tempo real, tudo em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-primary-dark shadow-elevated transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                CRIAR MEU EVENTO <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-6 py-3.5 text-base font-bold text-primary hover:bg-primary-50"
              >
                ENTRAR
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Sem custo de setup</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Participante não cria conta</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Pronto para produção</span>
            </div>
          </div>

          {/* Demonstração visual do dashboard */}
          <div className="relative">
            <div className="rounded-3xl border border-border bg-white p-4 shadow-elevated">
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-accent">Agora</p>
                  <p className="mt-1 text-3xl font-extrabold">#027</p>
                  <p className="text-sm">Beatriz Andrade</p>
                </div>
                <PhoneCall className="h-10 w-10 text-accent" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted p-3 text-center">
                  <p className="text-xl font-bold text-foreground">48</p>
                  <p className="text-[11px] text-muted-foreground">Na fila</p>
                </div>
                <div className="rounded-xl bg-muted p-3 text-center">
                  <p className="text-xl font-bold text-foreground">132</p>
                  <p className="text-[11px] text-muted-foreground">Atendidos</p>
                </div>
                <div className="rounded-xl bg-muted p-3 text-center">
                  <p className="text-xl font-bold text-foreground">96%</p>
                  <p className="text-[11px] text-muted-foreground">Conclusão</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {['#028 Carlos Menezes', '#029 Ana Beatriz', '#030 Pedro Lucas'].map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary">Aguardando</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-4 shadow-elevated sm:block">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-primary-dark">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">WhatsApp enviado</p>
                  <p className="text-[11px] text-muted-foreground">"Chegou a sua vez! 🎉"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tudo que você precisa para organizar sua fila
          </h2>
          <p className="mt-3 text-muted-foreground">
            Um sistema completo, pensado para quem organiza eventos e precisa de agilidade, controle e uma
            ótima experiência para os participantes.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-border bg-white p-6 shadow-card transition-shadow hover:shadow-elevated">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <benefit.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{benefit.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-primary-dark py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
            <p className="mt-3 text-white/70">Do primeiro clique ao último atendimento, em seis passos simples.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="text-3xl font-extrabold text-accent">{step.number}</span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <QrCode className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          Pronto para organizar sua próxima fila?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Crie sua conta gratuitamente e publique seu primeiro evento em menos de 5 minutos.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-primary-dark shadow-elevated transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            CRIAR MEU EVENTO <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-6 py-3.5 text-base font-bold text-primary hover:bg-primary-50"
          >
            ENTRAR
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Logo size={28} textClassName="text-base font-bold text-primary" />
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacidade" className="hover:text-primary">Política de privacidade</Link>
            <a href="mailto:contato@zup.com.br" className="hover:text-primary">Contato</a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Zup. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
