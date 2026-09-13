import nodemailer from 'nodemailer';

/**
 * EmailService — envio de e-mails transacionais via SMTP (nodemailer).
 *
 * Segue o mesmo princípio do WhatsAppService: se as credenciais
 * (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) não estiverem configuradas
 * no .env, o serviço entra em "modo desenvolvimento" — o e-mail é apenas
 * impresso no console, e nenhuma chamada de rede é feita. Nunca fingimos
 * que um e-mail foi enviado de verdade quando não foi.
 */

function isConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

type SendResult = { ok: boolean; error?: string; devMode: boolean };

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return cachedTransporter;
}

async function dispatch(params: { to: string; subject: string; text: string; html: string }): Promise<SendResult> {
  if (!isConfigured()) {
    // eslint-disable-next-line no-console
    console.log(`[E-mail - MODO DEV, SMTP não configurado] Para ${params.to}: "${params.subject}"\n${params.text}`);
    return { ok: true, devMode: true };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return { ok: true, devMode: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao enviar e-mail';
    // eslint-disable-next-line no-console
    console.error('[E-mail] Falha ao enviar:', message);
    return { ok: false, error: message, devMode: false };
  }
}

export const EmailService = {
  isConfigured,

  async sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }): Promise<SendResult> {
    const text =
      `Olá, ${params.name}!\n\n` +
      `Recebemos um pedido para redefinir a senha da sua conta no Zup.\n` +
      `Clique no link abaixo para criar uma nova senha (válido por 1 hora):\n\n` +
      `${params.resetUrl}\n\n` +
      `Se você não pediu essa redefinição, pode ignorar este e-mail com segurança.`;

    const html =
      `<p>Olá, ${params.name}!</p>` +
      `<p>Recebemos um pedido para redefinir a senha da sua conta no Zup.</p>` +
      `<p><a href="${params.resetUrl}">Clique aqui para criar uma nova senha</a> (válido por 1 hora).</p>` +
      `<p>Se você não pediu essa redefinição, pode ignorar este e-mail com segurança.</p>`;

    return dispatch({ to: params.to, subject: 'Redefinir sua senha — Zup', text, html });
  },
};
