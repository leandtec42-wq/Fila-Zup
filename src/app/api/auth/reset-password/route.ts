import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validations';
import { handleApiError, ApiError } from '@/lib/api-helpers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Rota PÚBLICA. Recebe o token enviado por e-mail (texto puro) e compara o
 * HASH dele com o que está salvo no banco — assim, mesmo se o banco vazar,
 * ninguém consegue recriar o token original a partir do hash.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`reset-password:${ip}`, 10, 60_000);
    if (!limit.success) {
      throw new ApiError(429, 'Muitas tentativas. Aguarde um instante e tente novamente.');
    }

    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: { resetPasswordTokenHash: tokenHash, resetPasswordExpires: { gt: new Date() } },
    });

    if (!user) {
      throw new ApiError(400, 'Este link de redefinição é inválido ou já expirou. Solicite um novo.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetPasswordTokenHash: null, resetPasswordExpires: null },
    });

    return NextResponse.json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    return handleApiError(err);
  }
}
