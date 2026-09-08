import { describe, it, expect } from 'vitest';
import { normalizePhoneToE164, maskPhone, maskEmail } from '@/lib/phone';

describe('normalizePhoneToE164', () => {
  it('normaliza um celular brasileiro com DDD sem código do país', () => {
    expect(normalizePhoneToE164('(11) 99999-9999')).toBe('+5511999999999');
  });

  it('normaliza um número já em E.164', () => {
    expect(normalizePhoneToE164('+5511999999999')).toBe('+5511999999999');
  });

  it('normaliza um número somente com dígitos', () => {
    expect(normalizePhoneToE164('11999999999')).toBe('+5511999999999');
  });

  it('rejeita números obviamente inválidos', () => {
    expect(normalizePhoneToE164('123')).toBeNull();
    expect(normalizePhoneToE164('')).toBeNull();
    expect(normalizePhoneToE164('abcdefghij')).toBeNull();
  });
});

describe('maskPhone', () => {
  it('mascara o telefone mantendo início e os 4 últimos dígitos', () => {
    const masked = maskPhone('+5511999999999');
    expect(masked.endsWith('9999')).toBe(true);
    expect(masked).toContain('****');
  });
});

describe('maskEmail', () => {
  it('mascara o usuário do e-mail mantendo o domínio', () => {
    expect(maskEmail('joao.silva@gmail.com')).toMatch(/^jo\*+@gmail\.com$/);
  });

  it('lida com e-mails sem @ retornando um placeholder seguro', () => {
    expect(maskEmail('invalido')).toBe('***');
  });
});
