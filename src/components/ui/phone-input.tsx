'use client';

import * as React from 'react';
import { Input, InputProps } from '@/components/ui/input';

/**
 * Input de telefone com máscara amigável para o formato brasileiro enquanto
 * o usuário digita. A normalização real para E.164 acontece no servidor
 * (src/lib/phone.ts) — este componente só melhora a experiência de digitação.
 */
function maskBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);

  // Com código do país (ex: 55 11 99999 9999)
  if (digits.startsWith('55') && digits.length > 11) {
    const country = digits.slice(0, 2);
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    const firstPart = rest.length > 4 ? rest.slice(0, rest.length - 4) : rest;
    const lastPart = rest.length > 4 ? rest.slice(-4) : '';
    return `+${country} (${ddd}) ${firstPart}${lastPart ? '-' + lastPart : ''}`.trim();
  }

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) {
    return ddd ? `(${ddd}) ${rest}` : rest;
  }
  const firstPart = rest.slice(0, rest.length - 4);
  const lastPart = rest.slice(-4);
  return `(${ddd}) ${firstPart}-${lastPart}`;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, value, ...props }, ref) => {
    const [display, setDisplay] = React.useState(typeof value === 'string' ? value : '');

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(11) 99999-9999"
        value={display}
        onChange={(e) => {
          const masked = maskBrazilianPhone(e.target.value);
          setDisplay(masked);
          if (onChange) {
            const cloned = { ...e, target: { ...e.target, value: masked } };
            onChange(cloned as React.ChangeEvent<HTMLInputElement>);
          }
        }}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = 'PhoneInput';
