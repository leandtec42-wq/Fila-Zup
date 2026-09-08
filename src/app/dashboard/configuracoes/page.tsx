import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WhatsAppStatusCard } from '@/components/whatsapp-status-card';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, companyName: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Informações da sua conta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da conta</CardTitle>
          <CardDescription>Essas informações identificam sua empresa no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Nome" value={user?.name} />
          <InfoRow label="Empresa" value={user?.companyName} />
          <InfoRow label="E-mail" value={user?.email} />
          <InfoRow label="Conta criada em" value={user?.createdAt ? new Intl.DateTimeFormat('pt-BR').format(user.createdAt) : '–'} />
        </CardContent>
      </Card>

      <WhatsAppStatusCard />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
