import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import {
  formatCompactNumber,
  formatCurrency,
  formatLatency,
  formatPercent,
} from '@/lib/formatters';

interface AnimatedCounterProps {
  value: number;
  unit: 'count' | 'percent' | 'ms' | 'currency' | 'ratio';
  durationMs?: number;
  className?: string;
}

function formatValueWithUnit(val: number, unit: AnimatedCounterProps['unit']): string {
  switch (unit) {
    case 'count':
      return formatCompactNumber(val);
    case 'percent':
      return formatPercent(val, 2);
    case 'ms':
      return formatLatency(val);
    case 'currency':
      return formatCurrency(val, 2);
    case 'ratio':
      return val.toString();
    default:
      return val.toLocaleString();
  }
}

export function AnimatedCounter({
  value,
  unit,
  durationMs = 750,
  className = '',
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) return;

    if (prefersReducedMotion) {
      node.textContent = formatValueWithUnit(value, unit);
      prevValueRef.current = value;
      return;
    }

    const start = prevValueRef.current;
    const end = value;

    const controls = animate(start, end, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1], // Custom smooth cubic bezier
      onUpdate: (latest) => {
        node.textContent = formatValueWithUnit(latest, unit);
      },
      onComplete: () => {
        prevValueRef.current = end;
      },
    });

    return () => controls.stop();
  }, [value, unit, durationMs, prefersReducedMotion]);

  return (
    <span ref={spanRef} className={`font-mono tabular-nums tracking-tight font-bold ${className}`}>
      {formatValueWithUnit(value, unit)}
    </span>
  );
}
