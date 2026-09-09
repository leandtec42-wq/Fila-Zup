'use client';

import * as React from 'react';
import { Select } from '@/components/ui/input';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/**
 * Seletor de horário simples: dois dropdowns (hora e minuto) em vez do
 * <input type="time"> nativo do navegador, que exige clicar em cada
 * segmento e digitar os números com precisão.
 */
export function TimePicker({
  value,
  onChange,
  idPrefix,
  error,
}: {
  value?: string;
  onChange: (value: string) => void;
  idPrefix?: string;
  error?: string;
}) {
  const isValid = typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
  const [hh, mm] = (isValid ? value : '09:00').split(':');

  return (
    <div className="flex gap-2">
      <Select
        id={idPrefix ? `${idPrefix}-hour` : undefined}
        aria-label="Hora"
        error={error}
        value={hh}
        onChange={(e) => onChange(`${e.target.value}:${mm}`)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}h
          </option>
        ))}
      </Select>
      <Select
        id={idPrefix ? `${idPrefix}-minute` : undefined}
        aria-label="Minuto"
        error={error}
        value={mm}
        onChange={(e) => onChange(`${hh}:${e.target.value}`)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}min
          </option>
        ))}
      </Select>
    </div>
  );
}
