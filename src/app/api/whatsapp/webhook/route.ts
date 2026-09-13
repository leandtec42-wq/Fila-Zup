import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Webhook da Meta WhatsApp Cloud API.
 *
 * GET  -> usado pela Meta para verificar a propriedade do endpoint durante a
 *         configuração do webhook (hub.mode / hub.verify_token / hub.challenge).
 * POST -> recebe eventos assíncronos: confirmações de entrega/leitura das
 *         mensagens enviadas e, opcionalmente, respostas dos participantes.
 *
 * Configuração necessária no .env: META_WHATSAPP_VERIFY_TOKEN.
 * Veja o passo a passo completo em docs/WHATSAPP.md.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.META_WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && expectedToken && token === expectedToken) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }

  return new NextResponse('Token de verificação inválido.', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Estrutura do payload documentada em:
    // https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const value = change?.value;
        const statuses = value?.statuses ?? [];

        for (const status of statuses) {
          const providerMessageId: string | undefined = status?.id;
          const newStatus: string | undefined = status?.status; // sent, delivered, read, failed

          if (!providerMessageId) continue;

          const message = await prisma.whatsAppMessage.findFirst({
            where: { providerMessageId },
          });

          if (message && newStatus === 'failed') {
            const errorDetail = status?.errors?.[0]?.title ?? 'Falha reportada pela Meta';
            await prisma.whatsAppMessage.update({
              where: { id: message.id },
              data: { status: 'FAILED', error: errorDetail },
            });
          }
          // Estados "sent"/"delivered"/"read" já refletem que a mensagem foi
          // aceita pela Meta; mantemos o status SENT já registrado no envio.
        }

        // Mensagens recebidas (respostas do participante) ficam disponíveis
        // aqui em value.messages, caso o produto evolua para permitir
        // interação bidirecional pelo WhatsApp.
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[WhatsApp Webhook] Erro ao processar payload:', err);
    // Retornamos 200 mesmo em erro interno para evitar que a Meta desative o
    // webhook por reenvios repetidos; o erro fica registrado no log.
    return NextResponse.json({ received: true });
  }
}
