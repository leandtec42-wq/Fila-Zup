import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireOwnedEvent, handleApiError } from '@/lib/api-helpers';
import { callNext } from '@/lib/queue';

/**
 * O botão "CHAMAR PRÓXIMO". Usa atualização condicional no banco (ver
 * src/lib/queue.ts) para garantir que cliques concorrentes de dois
 * administradores nunca chamem a mesma pessoa duas vezes.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const event = await requireOwnedEvent(user.id, params.id);

    const { entry, whatsapp } = await callNext(event);

    return NextResponse.json({ entry, whatsappSent: whatsapp.ok, whatsappDevMode: whatsapp.devMode });
  } catch (err) {
    return handleApiError(err);
  }
}
