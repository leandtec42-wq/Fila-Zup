import { PrismaClient, QueueStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function slug() {
  return crypto.randomBytes(6).toString('base64url');
}

function randomPhone(seed: number) {
  const n = String(900000000 + seed).padStart(9, '0');
  return `+5511${n}`;
}

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Otávio', 'Patrícia', 'Rafael', 'Sofia', 'Thiago', 'Valentina',
];
const LAST_NAMES = [
  'Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima',
];

function randomName(seed: number) {
  const first = FIRST_NAMES[seed % FIRST_NAMES.length];
  const last = LAST_NAMES[(seed * 7) % LAST_NAMES.length];
  return `${first} ${last}`;
}

async function seedEventEntries(eventId: string, count: number, baseDate: Date) {
  const statuses: QueueStatus[] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'WAITING', 'WAITING', 'SKIPPED', 'CANCELLED'];

  for (let i = 1; i <= count; i++) {
    const name = randomName(i);
    const createdAt = new Date(baseDate.getTime() + i * 4 * 60 * 1000); // a cada 4 minutos
    const status = i <= count - 6 ? 'COMPLETED' : statuses[i % statuses.length];

    const calledAt = status !== 'WAITING' ? new Date(createdAt.getTime() + (2 + (i % 5)) * 60 * 1000) : null;
    const serviceStartedAt = status === 'COMPLETED' ? new Date((calledAt as Date).getTime() + 30 * 1000) : null;
    const completedAt =
      status === 'COMPLETED' ? new Date((serviceStartedAt as Date).getTime() + (3 + (i % 4)) * 60 * 1000) : null;

    await prisma.queueEntry.create({
      data: {
        eventId,
        queueNumber: i,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}${i}@exemplo.com`,
        phone: randomPhone(i),
        status,
        consentWhatsApp: true,
        createdAt,
        calledAt,
        serviceStartedAt,
        completedAt,
        updatedAt: completedAt ?? calledAt ?? createdAt,
      },
    });
  }

  await prisma.event.update({ where: { id: eventId }, data: { lastQueueNumber: count } });
}

async function main() {
  console.log('Iniciando seed...');

  const passwordHash = await bcrypt.hash('demo12345', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@zup.com.br' },
    update: {},
    create: {
      name: 'Usuário Demo',
      companyName: 'Zup Demonstração',
      email: 'demo@zup.com.br',
      passwordHash,
    },
  });

  const eventOneDate = new Date();
  eventOneDate.setHours(9, 0, 0, 0);

  const eventOne = await prisma.event.create({
    data: {
      userId: user.id,
      name: 'Feira de Tecnologia 2026',
      description: 'Feira anual de inovação e tecnologia, com estandes de startups e palestras.',
      date: eventOneDate,
      startTime: '09:00',
      endTime: '18:00',
      location: 'Centro de Convenções, São Paulo - SP',
      maxParticipants: 500,
      status: 'ACTIVE',
      publicSlug: slug(),
    },
  });

  const eventTwoDate = new Date();
  eventTwoDate.setDate(eventTwoDate.getDate() - 2);
  eventTwoDate.setHours(14, 0, 0, 0);

  const eventTwo = await prisma.event.create({
    data: {
      userId: user.id,
      name: 'Workshop de Empreendedorismo',
      description: 'Workshop prático sobre como validar e lançar seu primeiro negócio.',
      date: eventTwoDate,
      startTime: '14:00',
      endTime: '17:00',
      location: 'Auditório Central, Rio de Janeiro - RJ',
      maxParticipants: 120,
      status: 'PAUSED',
      publicSlug: slug(),
    },
  });

  await seedEventEntries(eventOne.id, 42, eventOneDate);
  await seedEventEntries(eventTwo.id, 28, eventTwoDate);

  console.log('Seed concluído com sucesso!');
  console.log('----------------------------------------');
  console.log('Credenciais de acesso (DESENVOLVIMENTO):');
  console.log('  E-mail: demo@zup.com.br');
  console.log('  Senha:  demo12345');
  console.log('----------------------------------------');
  console.log(`Link público do evento 1: /fila/${eventOne.publicSlug}`);
  console.log(`Link público do evento 2: /fila/${eventTwo.publicSlug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
