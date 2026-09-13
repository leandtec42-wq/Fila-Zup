import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validations';
import { handleApiError, ApiError } from '@/lib/api-helpers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { EmailService } from '@/lib/email';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Rota PÚBLICA. Sempre responde com a mesma mensagem genérica, exista ou não
 * uma conta com o e-mail informado — isso evita que alguém descubra quais
 * e-mails estão cadastrados no sistema (user enumeration).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`forgot-password:${ip}`, 5, 60_000);
    if (!limit.success) {
      throw new ApiError(429, 'Muitas tentativas. Aguarde um instante e tente novamente.');
    }

    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordTokenHash: tokenHash,
          resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/redefinir-senha?token=${rawToken}`;
      await EmailService.sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    }

    return NextResponse.json({
      message: 'Se existir uma conta com este e-mail, você receberá as instruções para redefinir sua senha.',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
