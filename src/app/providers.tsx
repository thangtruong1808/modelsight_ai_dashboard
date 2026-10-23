import { type ReactNode, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Toaster } from 'sonner';
import { applyThemeToDom, syncSystemTheme } from '@/app/slices/themeSlice';
import { store, useAppDispatch, useAppSelector } from '@/app/store';
import { TooltipProvider } from '@/components/ui/Tooltip';

function ThemeSynchronizer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const resolvedTheme = useAppSelector((state) => state.theme.resolved);
  const themeMode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    applyThemeToDom(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        dispatch(syncSystemTheme());
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [dispatch, themeMode]);

  return (
    <>
      {children}
      <Toaster
        theme={resolvedTheme}
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          className: 'text-xs font-sans',
        }}
      />
    </>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <TooltipProvider>
        <ThemeSynchronizer>{children}</ThemeSynchronizer>
      </TooltipProvider>
    </ReduxProvider>
  );
}

