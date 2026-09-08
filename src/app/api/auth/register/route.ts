import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { handleApiError, ApiError } from '@/lib/api-helpers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`register:${ip}`, 10, 60_000);
    if (!limit.success) {
      throw new ApiError(429, 'Muitas tentativas. Aguarde um instante e tente novamente.');
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new ApiError(409, 'Já existe uma conta com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        email: data.email.toLowerCase(),
        passwordHash,
      },
      select: { id: true, name: true, email: true, companyName: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
