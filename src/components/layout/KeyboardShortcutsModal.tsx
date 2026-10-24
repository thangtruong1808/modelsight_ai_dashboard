import { Dialog as RadixDialog } from 'radix-ui';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShortcutGroup {
  category: string;
  items: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Global Navigation & Overlays',
    items: [
      { keys: ['⌘', 'K'], description: 'Open Command Palette (search, actions, jump)' },
      { keys: ['['], description: 'Toggle Sidebar collapse / expand' },
      { keys: ['?'], description: 'Open Keyboard Shortcuts cheat sheet' },
      { keys: ['ESC'], description: 'Close active drawer, modal, or command palette' },
    ],
  },
  {
    category: 'Logs Explorer Navigation',
    items: [
      { keys: ['↑', '↓'], description: 'Step to previous / next request log in drawer' },
      { keys: ['k', 'j'], description: 'Vim-style navigation for log records' },
      { keys: ['Enter'], description: 'Open log inspector for focused row' },
    ],
  },
  {
    category: 'Quick Section Jumps',
    items: [
      { keys: ['G', 'O'], description: 'Jump to Overview Dashboard' },
      { keys: ['G', 'M'], description: 'Jump to Models Registry' },
      { keys: ['G', 'L'], description: 'Jump to Logs Explorer' },
      { keys: ['G', 'C'], description: 'Jump to Cost Analytics' },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
        <RadixDialog.Content
          aria-describedby="shortcuts-desc"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-float focus:outline-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                <Keyboard className="h-4 w-4" />
              </div>
              <div>
                <RadixDialog.Title className="text-base font-bold text-text-primary">
                  Keyboard Shortcuts
                </RadixDialog.Title>
                <p id="shortcuts-desc" className="text-xs text-text-muted">
                  Power-user navigation and workflow hotkeys
                </p>
              </div>
            </div>

            <RadixDialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close shortcuts modal"
                className="h-7 w-7 text-text-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </RadixDialog.Close>
          </div>

          {/* Groups */}
          <div className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.category} className="space-y-2">
                <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  {group.category}
                </h4>
                <div className="rounded-xl border border-border-subtle bg-bg-elevated/40 divide-y divide-border-subtle">
                  {group.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3.5 py-2 text-xs"
                    >
                      <span className="text-text-secondary">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="rounded border border-border-default bg-bg-base px-2 py-0.5 font-mono text-[11px] font-semibold text-text-primary shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-5 border-t border-border-subtle pt-3 text-center text-[11px] text-text-muted">
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded border border-border-default bg-bg-base font-mono">
              ?
            </kbd>{' '}
            anywhere to bring up this cheatsheet
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
