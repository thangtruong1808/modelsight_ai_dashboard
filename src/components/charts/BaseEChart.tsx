import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react';
import * as echarts from 'echarts';
import { Dialog as RadixDialog } from 'radix-ui';
import { Download, Table as TableIcon, X } from 'lucide-react';
import { useAppSelector } from '@/app/store';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';

export interface BaseEChartHandle {
  getChartInstance: () => echarts.ECharts | null;
  exportAsPng: (filename?: string) => void;
  openDataTable: () => void;
}

export interface AccessibleTableData {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface BaseEChartProps extends HTMLAttributes<HTMLDivElement> {
  option: echarts.EChartsOption;
  height?: number | string;
  accessibleTable?: AccessibleTableData;
  onChartReady?: (instance: echarts.ECharts) => void;
  renderer?: 'canvas' | 'svg';
  showToolbar?: boolean;
  exportFileName?: string;
  ariaLabel?: string;
}

// Light and Dark theme palette defaults matching ModelSight AI design system
const THEME_PALETTES = {
  dark: {
    textColor: '#94a3b8',
    textMuted: '#64748b',
    borderColor: '#1e293b',
    backgroundColor: 'transparent',
    tooltipBg: '#161f30',
    tooltipBorder: '#334155',
    tooltipText: '#f1f5f9',
    axisLine: '#1e293b',
    splitLine: '#1e293b',
    colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#38bdf8'],
  },
  light: {
    textColor: '#475569',
    textMuted: '#94a3b8',
    borderColor: '#e2e8f0',
    backgroundColor: 'transparent',
    tooltipBg: '#ffffff',
    tooltipBorder: '#cbd5e1',
    tooltipText: '#0f172a',
    axisLine: '#e2e8f0',
    splitLine: '#f1f5f9',
    colors: ['#4f46e5', '#0891b2', '#059669', '#d97706', '#e11d48', '#7c3aed', '#0284c7'],
  },
};

export const BaseEChart = forwardRef<BaseEChartHandle, BaseEChartProps>(
  (
    {
      option,
      height = 320,
      accessibleTable,
      onChartReady,
      renderer = 'canvas',
      showToolbar = true,
      exportFileName = 'modelsight-telemetry-chart',
      ariaLabel = 'Interactive telemetry chart',
      className,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const resolvedTheme = useAppSelector((state) => state.theme.resolved);

    const optionRef = useRef(option);
    optionRef.current = option;
    const onChartReadyRef = useRef(onChartReady);
    onChartReadyRef.current = onChartReady;

    const exportAsPng = (filename = exportFileName) => {
      const chart = chartRef.current;
      if (!chart) return;

      const dataUrl = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: resolvedTheme === 'dark' ? '#0f1623' : '#ffffff',
      });

      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `${filename}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    useImperativeHandle(ref, () => ({
      getChartInstance: () => chartRef.current,
      exportAsPng,
      openDataTable: () => setIsTableModalOpen(true),
    }));

    // Initialize or re-initialize on theme change
    useEffect(() => {
      const dom = containerRef.current;
      if (!dom) return;

      if (chartRef.current) {
        chartRef.current.dispose();
      }

      const instance = echarts.init(dom, resolvedTheme, {
        renderer,
      });

      chartRef.current = instance;
      if (onChartReadyRef.current) {
        onChartReadyRef.current(instance);
      }

      const palette = THEME_PALETTES[resolvedTheme];

      // Merge base theme styling with provided option
      const themedOption: echarts.EChartsOption = {
        color: palette.colors,
        backgroundColor: palette.backgroundColor,
        textStyle: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: palette.textColor,
        },
        tooltip: {
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          borderWidth: 1,
          padding: [8, 12],
          textStyle: {
            color: palette.tooltipText,
            fontSize: 12,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          extraCssText: 'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25); border-radius: 8px;',
        },
        grid: {
          containLabel: true,
          top: 36,
          right: 20,
          bottom: 24,
          left: 16,
        },
        ...optionRef.current,
      };

      instance.setOption(themedOption, { notMerge: true });

      const resizeObserver = new ResizeObserver(() => {
        instance.resize();
      });
      resizeObserver.observe(dom);

      return () => {
        resizeObserver.disconnect();
        instance.dispose();
        chartRef.current = null;
      };
    }, [resolvedTheme, renderer]); // Recreate when theme or renderer changes

    // Update options reactively when option prop updates without disposing the chart
    useEffect(() => {
      if (chartRef.current) {
        chartRef.current.setOption(option, { notMerge: false, lazyUpdate: true });
      }
    }, [option]);

    return (
      <div className={cn('relative flex flex-col w-full', className)} {...props}>
        {showToolbar && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
            {accessibleTable && (
              <Tooltip content="View accessible data table">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md bg-bg-surface/80 border border-border-default backdrop-blur-xs text-text-muted hover:text-text-primary"
                  onClick={() => setIsTableModalOpen(true)}
                  aria-label="View data in tabular format"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                </Button>
              </Tooltip>
            )}

            <Tooltip content="Export chart as PNG">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md bg-bg-surface/80 border border-border-default backdrop-blur-xs text-text-muted hover:text-text-primary"
                onClick={() => exportAsPng()}
                aria-label="Export chart as high-resolution image"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          </div>
        )}

        <div
          ref={containerRef}
          role="img"
          aria-label={ariaLabel}
          style={{ width: '100%', height }}
        />

        {/* Accessible Data Table Modal */}
        {accessibleTable && (
          <RadixDialog.Root open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
            <RadixDialog.Portal>
              <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
              <RadixDialog.Content
                aria-describedby="accessible-table-desc"
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border-strong bg-bg-surface p-6 shadow-float focus:outline-none max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                  <div>
                    <RadixDialog.Title className="text-base font-semibold text-text-primary">
                      {accessibleTable.title}
                    </RadixDialog.Title>
                    <p id="accessible-table-desc" className="text-xs text-text-secondary mt-0.5">
                      Accessible tabular representation of the active telemetry chart series
                    </p>
                  </div>
                  <RadixDialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close table view">
                      <X className="h-4 w-4" />
                    </Button>
                  </RadixDialog.Close>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto">
                  <table
                    className="w-full text-left text-xs border-collapse"
                    aria-label={accessibleTable.title}
                  >
                    <thead className="sticky top-0 bg-bg-elevated border-b border-border-default text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        {accessibleTable.columns.map((col, idx) => (
                          <th key={idx} scope="col" className="px-3 py-2.5">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {accessibleTable.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-bg-elevated/40">
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-3 py-2 text-text-primary font-mono tabular-nums"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end border-t border-border-subtle pt-3">
                  <Button variant="outline" size="sm" onClick={() => setIsTableModalOpen(false)}>
                    Close Table View
                  </Button>
                </div>
              </RadixDialog.Content>
            </RadixDialog.Portal>
          </RadixDialog.Root>
        )}
      </div>
    );
  }
);

BaseEChart.displayName = 'BaseEChart';
