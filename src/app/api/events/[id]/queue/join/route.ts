import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { joinQueueSchema } from '@/lib/validations';
import { normalizePhoneToE164 } from '@/lib/phone';
import { joinQueue, QueueError } from '@/lib/queue';
import { handleApiError, ApiError } from '@/lib/api-helpers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Rota PÚBLICA — não exige autenticação. O participante entra na fila
 * informando apenas nome, e-mail e WhatsApp. Toda validação é feita aqui no
 * servidor (nunca confiamos apenas no frontend).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`join:${ip}`, 8, 60_000);
    if (!limit.success) {
      throw new ApiError(429, 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.');
    }

    const body = await req.json();
    const data = joinQueueSchema.parse(body);

    const normalizedPhone = normalizePhoneToE164(data.phone);
    if (!normalizedPhone) {
      throw new ApiError(422, 'Este número de WhatsApp parece inválido. Confira o DDD e tente novamente.');
    }

    // aceita tanto o cuid interno quanto o publicSlug para robustez
    const event = await prisma.event.findFirst({
      where: { OR: [{ id: params.id }, { publicSlug: params.id }] },
    });

    if (!event) {
      throw new ApiError(404, 'Evento não encontrado.');
    }

    const { entry, position, whatsapp } = await joinQueue({
      event,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: normalizedPhone,
      consentWhatsApp: data.consentWhatsApp,
    });

    return NextResponse.json(
      {
        entry: {
          id: entry.id,
          queueNumber: entry.queueNumber,
          status: entry.status,
          createdAt: entry.createdAt,
        },
        position,
        whatsappSent: whatsapp.ok,
        whatsappDevMode: whatsapp.devMode,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof QueueError) return handleApiError(err);
    return handleApiError(err);
  }
}
