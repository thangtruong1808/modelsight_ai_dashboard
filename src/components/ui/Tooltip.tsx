import type { ReactNode } from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';
import { cn } from '@/lib/cn';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RadixTooltip.Provider delayDuration={180}>{children}</RadixTooltip.Provider>;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  disabled = false,
}: TooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'z-50 overflow-hidden rounded-lg border border-border-strong bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-text-primary shadow-float',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-border-strong" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

