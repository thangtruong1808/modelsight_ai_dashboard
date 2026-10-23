import { useId } from 'react';
import type { ModelHealthStatus } from '@/types';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  status?: ModelHealthStatus | 'indigo' | 'info';
  className?: string;
  fillOpacity?: number;
}

const COLOR_MAP: Record<string, { stroke: string; fill: string }> = {
  healthy: {
    stroke: '#10b981',
    fill: 'rgba(16, 185, 129, 0.18)',
  },
  degraded: {
    stroke: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.18)',
  },
  critical: {
    stroke: '#f43f5e',
    fill: 'rgba(244, 63, 94, 0.18)',
  },
  indigo: {
    stroke: '#6366f1',
    fill: 'rgba(99, 102, 241, 0.18)',
  },
  info: {
    stroke: '#38bdf8',
    fill: 'rgba(56, 189, 248, 0.18)',
  },
};

export function Sparkline({
  data,
  width = 120,
  height = 36,
  status = 'healthy',
  className = '',
  fillOpacity = 0.2,
}: SparklineProps) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return (
      <div
        className={`h-9 w-28 animate-pulse rounded bg-bg-subtle/50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  const colorConfig = COLOR_MAP[status] ?? COLOR_MAP['healthy']!;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible shrink-0 ${className}`}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorConfig.stroke} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={colorConfig.stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={colorConfig.stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Indicator point for the latest reading */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1]?.split(',')[0]}
          cy={points[points.length - 1]?.split(',')[1]}
          r="2.5"
          fill={colorConfig.stroke}
          className="ring-2 ring-bg-surface"
        />
      )}
    </svg>
  );
}
