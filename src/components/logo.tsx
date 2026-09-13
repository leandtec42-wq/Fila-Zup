import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({
  size = 36,
  showText = true,
  textClassName,
  className,
}: {
  size?: number;
  showText?: boolean;
  textClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/logo.png"
        alt="Zup"
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-xl"
      />
      {showText && <span className={cn('text-lg font-bold text-primary', textClassName)}>Zup</span>}
    </div>
  );
}
