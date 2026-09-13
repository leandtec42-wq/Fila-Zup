/**
 * Rate limiter simples em memória (janela deslizante) para proteger rotas
 * públicas (ex: entrada na fila) contra abuso/spam.
 *
 * IMPORTANTE: em produção com múltiplas instâncias serverless (Vercel), cada
 * instância mantém seu próprio contador. Para um limite estritamente global
 * entre instâncias, substitua este módulo por um backend compartilhado como
 * Redis/Upstash (a interface abaixo foi desenhada para ser trocada facilmente).
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = (Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60) * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 20;

// Limpeza periódica para não crescer indefinidamente em memória
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > WINDOW_MS * 2) {
      buckets.delete(key);
    }
  }
}, WINDOW_MS * 2).unref?.();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: bucket.windowStart + windowMs };
  }

  bucket.count += 1;
  return { success: true, remaining: maxRequests - bucket.count, resetAt: bucket.windowStart + windowMs };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
