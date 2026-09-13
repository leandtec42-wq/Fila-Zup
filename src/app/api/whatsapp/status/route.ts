import { NextResponse } from 'next/server';
import { requireUser, handleApiError } from '@/lib/api-helpers';
import { WhatsAppService } from '@/lib/whatsapp';

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ configured: WhatsAppService.isConfigured() });
  } catch (err) {
    return handleApiError(err);
  }
}
