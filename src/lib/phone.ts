import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normaliza um telefone para o formato internacional E.164.
 * Se o número não vier com DDI, assume Brasil (+55) por padrão.
 * Retorna null se o número for inválido.
 */
export function normalizePhoneToE164(rawPhone: string, defaultCountry: 'BR' = 'BR'): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;

  const trimmed = rawPhone.trim();
  if (trimmed.length === 0) return null;

  // Tenta interpretar já como internacional (com +) primeiro
  const withPlus = trimmed.startsWith('+') ? trimmed : undefined;

  const candidate = withPlus
    ? parsePhoneNumberFromString(withPlus)
    : parsePhoneNumberFromString(trimmed, defaultCountry);

  if (!candidate || !candidate.isValid()) {
    return null;
  }

  return candidate.number; // já vem em E.164, ex: +5511999999999
}

/**
 * Formata um telefone E.164 para exibição amigável, ex: +55 (11) 99999-9999
 */
export function formatPhoneForDisplay(e164Phone: string): string {
  const phone = parsePhoneNumberFromString(e164Phone);
  if (!phone) return e164Phone;
  return phone.formatInternational();
}

/**
 * Mascara o telefone para exibição pública (evita expor número completo).
 * Ex: +5511999999999 -> +55 11 9****-9999
 */
export function maskPhone(e164Phone: string): string {
  if (!e164Phone || e164Phone.length < 6) return '****';
  const visibleStart = e164Phone.slice(0, e164Phone.length - 8);
  const lastFour = e164Phone.slice(-4);
  return `${visibleStart}****${lastFour}`;
}

/**
 * Mascara e-mail para exibição pública. Ex: joao.silva@gmail.com -> jo***@gmail.com
 */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(user.length - 2, 3))}@${domain}`;
}
