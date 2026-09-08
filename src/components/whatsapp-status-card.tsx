'use client';

import useSWR from 'swr';
import { MessageCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function WhatsAppStatusCard() {
  const { data } = useSWR('/api/whatsapp/status', fetcher);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" /> Integração com WhatsApp
        </CardTitle>
        <CardDescription>Status da integração com a Meta WhatsApp Cloud API.</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.configured ? (
          <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-semibold text-foreground">Credenciais configuradas</p>
              <p className="text-sm text-muted-foreground">As mensagens estão sendo enviadas de verdade pela Meta Cloud API.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">Modo desenvolvimento (sem envio real)</p>
              <p className="text-sm text-muted-foreground">
                Configure META_WHATSAPP_ACCESS_TOKEN e META_WHATSAPP_PHONE_NUMBER_ID no arquivo .env para
                ativar o envio real. Veja o passo a passo em docs/WHATSAPP.md.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
