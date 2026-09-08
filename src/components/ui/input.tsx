import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        className={cn(
          'flex h-12 w-full rounded-xl border bg-white px-4 text-base text-foreground placeholder:text-muted-foreground',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id ? `${id}-error` : undefined} role="alert" className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1.5 block text-sm font-medium text-foreground', className)} {...props}>
      {children}
    </label>
  );
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ className, error, id, ...props }, ref) => (
    <textarea
      ref={ref}
      id={id}
      className={cn(
        'flex min-h-[100px] w-full rounded-xl border bg-white px-4 py-3 text-base text-foreground placeholder:text-muted-foreground',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border',
        className
      )}
      aria-invalid={Boolean(error)}
      aria-describedby={error && id ? `${id}-error` : undefined}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(
  ({ className, error, id, children, ...props }, ref) => (
    <select
      ref={ref}
      id={id}
      className={cn(
        'flex h-12 w-full rounded-xl border bg-white px-4 text-base text-foreground',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        error ? 'border-danger' : 'border-border',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
