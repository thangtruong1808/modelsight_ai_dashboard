import { NavLink, useLocation } from 'react-router';
import { Dialog as RadixDialog } from 'radix-ui';
import { ChevronLeft, ChevronRight, Cpu, X } from 'lucide-react';
import { NAV_ITEMS, type NavItemConfig } from '@/app/navigation';
import { setMobileNavOpen, toggleSidebar } from '@/app/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';

const SECTIONS: Array<NavItemConfig['section']> = ['Observability', 'Operations', 'Governance'];

function isNavItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/') {
    return pathname === '/';
  }
  if (itemPath === '/alerts') {
    return pathname === '/alerts';
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function SidebarNavList({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary dashboard navigation"
      className="flex-1 space-y-5 overflow-y-auto px-3 py-4"
    >
      {SECTIONS.map((section) => {
        const items = NAV_ITEMS.filter((item) => item.section === section);
        return (
          <div key={section} className="space-y-1">
            {!collapsed ? (
              <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {section}
              </div>
            ) : (
              <div className="mx-auto my-1 h-px w-6 bg-border-default" aria-hidden="true" />
            )}

            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item.path);

                const linkElement = (
                  <NavLink
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      collapsed && 'justify-center px-0 py-2.5',
                      active
                        ? 'bg-accent-primary/12 text-accent-primary font-semibold'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    )}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-accent-primary"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active
                          ? 'text-accent-primary'
                          : 'text-text-muted group-hover:text-text-primary'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={item.badge.variant}
                            dot={item.badge.text === 'LIVE'}
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {item.badge.text}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                );

                return (
                  <li key={item.id}>
                    <Tooltip
                      disabled={!collapsed}
                      side="right"
                      content={
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="font-mono text-[10px] text-text-secondary">
                              ({item.badge.text})
                            </span>
                          )}
                        </div>
                      }
                    >
                      {linkElement}
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const mobileNavOpen = useAppSelector((state) => state.ui.mobileNavOpen);

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Sidebar"
        className={cn(
          'hidden md:flex flex-col shrink-0 border-r border-border-default bg-bg-surface transition-[width] duration-200 ease-out select-none',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-border-default px-4',
            collapsed ? 'justify-center px-2' : 'justify-between'
          )}
        >
          <BrandLogo collapsed={collapsed} />
        </div>

        {/* Navigation Links */}
        <SidebarNavList collapsed={collapsed} />

        {/* Cluster Telemetry Footer & Collapse Trigger */}
        <div className="border-t border-border-default p-3 space-y-2">
          {!collapsed && (
            <div className="rounded-lg border border-border-default bg-bg-elevated/60 p-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                  <Cpu className="h-3.5 w-3.5 text-accent-cyan" />
                  Cluster: <strong className="text-text-primary">us-east-ml-01</strong>
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-status-healthy tabular-nums">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-healthy animate-pulse" />
                  99.97%
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-muted tabular-nums">
                <span>Ingestion: 4,820 req/s</span>
                <span>14 Models</span>
              </div>
            </div>
          )}

          <div
            className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}
          >
            {!collapsed && (
              <span className="text-[11px] text-text-muted font-mono">v2.6.0-prod</span>
            )}
            <Tooltip
              side="right"
              content={collapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={() => dispatch(toggleSidebar())}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer (Radix Dialog) */}
      <RadixDialog.Root
        open={mobileNavOpen}
        onOpenChange={(open) => dispatch(setMobileNavOpen(open))}
      >
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden" />
          <RadixDialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border-default bg-bg-surface shadow-float focus:outline-none md:hidden"
          >
            <div className="flex h-14 items-center justify-between border-b border-border-default px-4">
              <RadixDialog.Title asChild>
                <div>
                  <BrandLogo />
                </div>
              </RadixDialog.Title>
              <RadixDialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close navigation menu">
                  <X className="h-4 w-4" />
                </Button>
              </RadixDialog.Close>
            </div>
            <SidebarNavList
              collapsed={false}
              onNavigate={() => dispatch(setMobileNavOpen(false))}
            />
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  );
}
