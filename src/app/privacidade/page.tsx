import Link from 'next/link';
import { Logo } from '@/components/logo';

export const metadata = { title: 'Política de Privacidade — Zup' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Logo size={32} />
      </Link>

      <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

      <div className="mt-8 max-w-none space-y-6 leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Quais dados coletamos</h2>
          <p>
            Ao entrar na fila de um evento, coletamos apenas: <strong>nome completo</strong>,{' '}
            <strong>e-mail</strong> e <strong>número de WhatsApp</strong>. Esses dados são fornecidos
            diretamente pelo participante e são estritamente necessários para organizar a fila e enviar
            atualizações sobre a posição de atendimento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Para que usamos esses dados</h2>
          <p>
            Os dados são usados exclusivamente para: (a) gerar sua posição e senha na fila; (b) exibir seu
            status de atendimento; (c) enviar mensagens via WhatsApp sobre sua posição e chamada; e (d)
            gerar métricas agregadas e anônimas para o organizador do evento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Consentimento para WhatsApp</h2>
          <p>
            Nenhuma mensagem é enviada sem o consentimento explícito do participante, marcado no momento do
            cadastro na fila através do checkbox "Concordo em receber atualizações sobre minha posição na
            fila pelo WhatsApp".
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Compartilhamento de dados</h2>
          <p>
            Seus dados não são vendidos nem compartilhados com terceiros, exceto com a Meta Platforms, Inc.
            (WhatsApp), estritamente para o envio das mensagens de notificação da fila.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Exibição pública</h2>
          <p>
            Na tela pública da fila, nome completo, telefone e e-mail nunca são exibidos publicamente para
            outros participantes — apenas o número da senha e a posição.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Seus direitos (LGPD)</h2>
          <p>
            Você pode solicitar a exclusão dos seus dados pessoais a qualquer momento entrando em contato
            com o organizador do evento, que pode remover seus dados através do painel administrativo. Ao
            excluir, seu nome, e-mail e telefone são anonimizados permanentemente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Retenção</h2>
          <p>
            Os dados são mantidos pelo tempo necessário para a realização do evento e geração de métricas,
            podendo ser excluídos pelo organizador a qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Contato</h2>
          <p>Dúvidas sobre esta política podem ser enviadas para contato@zup.com.br.</p>
        </section>
      </div>
    </main>
  );
}
