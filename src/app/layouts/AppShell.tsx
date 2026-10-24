import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { GlobalFilterBar } from '@/app/layouts/GlobalFilterBar';
import { Sidebar } from '@/app/layouts/Sidebar';
import { Topbar } from '@/app/layouts/Topbar';
import { setCommandPaletteOpen, toggleSidebar } from '@/app/slices/uiSlice';
import { useAppDispatch } from '@/app/store';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { KeyboardShortcutsModal } from '@/components/layout/KeyboardShortcutsModal';
import { NotificationsDrawer } from '@/components/layout/NotificationsDrawer';
import { Skeleton } from '@/components/ui/Skeleton';

function RouteLoadingFallback() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Loading page content">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function AppShell() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        dispatch(setCommandPaletteOpen(true));
        return;
      }

      if (!isEditable && !event.metaKey && !event.ctrlKey && event.key === '[') {
        event.preventDefault();
        dispatch(toggleSidebar());
        return;
      }

      if (!isEditable && !event.metaKey && !event.ctrlKey && event.key === '?') {
        event.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <div className="flex min-h-screen w-full bg-bg-canvas text-text-primary">
      {/* Skip to main content link for keyboard/screen-reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent-primary focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-float"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main id="main-content" className="flex-1 overflow-x-hidden">
          <Suspense fallback={<RouteLoadingFallback />}>
            <motion.div
              key={location.pathname}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mx-auto w-full max-w-[1680px] p-4 sm:p-6"
            >
              <GlobalFilterBar />
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>

      {/* Global Interactive Overlays */}
      <CommandPalette />
      <NotificationsDrawer />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
