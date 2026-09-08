import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome completo').max(160),
    companyName: z.string().trim().min(2, 'Informe o nome da empresa').max(160),
    email: z.string().trim().email('E-mail inválido').max(190),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const eventStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED']);

export const createEventSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do evento').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora de início inválida (use HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora de encerramento inválida (use HH:mm)'),
  location: z.string().trim().max(255).optional().or(z.literal('')),
  // Mantido como string simples (sem coerce/transform) para que o tipo de
  // entrada do formulário seja idêntico ao tipo de saída, evitando
  // divergência entre z.input/z.infer no react-hook-form. A conversão final
  // para number | null acontece explicitamente nas rotas de API através de
  // normalizeMaxParticipants (abaixo).
  maxParticipants: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Informe um número inteiro positivo'),
  status: eventStatusEnum.optional(),
  allowReentryAfterCompletion: z.boolean().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();

/**
 * Converte o valor bruto de maxParticipants (string vinda do formulário ou
 * do corpo JSON) para o formato final aceito pelo Prisma (number | null).
 */
export function normalizeMaxParticipants(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
}

export const joinQueueSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome completo')
    .max(160)
    .refine((val) => val.trim().split(/\s+/).length >= 2, 'Informe nome e sobrenome'),
  email: z.string().trim().email('Informe um e-mail válido').max(190),
  phone: z.string().trim().min(8, 'Informe um número de WhatsApp válido').max(20),
  consentWhatsApp: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar receber atualizações pelo WhatsApp' }),
  }),
});

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;

export const queueActionSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export const metricsQuerySchema = z.object({
  range: z.enum(['today', '7d', '30d', 'custom']).default('7d'),
  from: z.string().optional(),
  to: z.string().optional(),
});
