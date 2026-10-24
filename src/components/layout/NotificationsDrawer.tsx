import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog as RadixDialog } from 'radix-ui';
import {
  Bell,
  Check,
  CheckCheck,
  Coins,
  Cpu,
  ExternalLink,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { setNotificationsOpen } from '@/app/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface NotificationItem {
  id: string;
  category: 'incident' | 'drift' | 'budget' | 'deployment';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link: string;
  severity: 'critical' | 'warning' | 'info';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'incident',
    title: 'Production LLM Tail Latency Breach',
    message: 'claude-3-7-sonnet-prod p95 latency reached 785ms (configured SLA: 650ms).',
    timestamp: '8 mins ago',
    isRead: false,
    link: '/alerts',
    severity: 'critical',
  },
  {
    id: 'notif-2',
    category: 'drift',
    title: 'Feature Drift Anomaly (PSI > 0.25)',
    message: 'Input feature ip_asn_entropy_score crossed critical drift threshold (PSI: 0.285).',
    timestamp: '24 mins ago',
    isRead: false,
    link: '/drift',
    severity: 'warning',
  },
  {
    id: 'notif-3',
    category: 'budget',
    title: 'Monthly Compute Budget Warning',
    message: 'Current month spend reached 74.3% of the $65,000 enterprise allocation.',
    timestamp: '1 hour ago',
    isRead: false,
    link: '/cost',
    severity: 'warning',
  },
  {
    id: 'notif-4',
    category: 'deployment',
    title: 'Canary Deployment Traffic Split',
    message:
      'gpt-4o-customer-support v4.2.0-canary successfully routed 15% live production traffic.',
    timestamp: '3 hours ago',
    isRead: true,
    link: '/models/gpt-4o-customer-support?tab=versions',
    severity: 'info',
  },
  {
    id: 'notif-5',
    category: 'incident',
    title: 'Upstream HTTP 429 Quota Exceeded',
    message:
      'Upstream Bedrock provider triggered 180 rate-limit rejections on customer support agent.',
    timestamp: '5 hours ago',
    isRead: true,
    link: '/logs?status=429',
    severity: 'critical',
  },
];

export function NotificationsDrawer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector((state) => state.ui.notificationsOpen);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'incident' | 'drift'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'incident') return n.category === 'incident';
    if (filter === 'drift') return n.category === 'drift';
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.info('Notifications cleared');
  };

  const handleItemClick = (notif: NotificationItem) => {
    // Mark as read
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    dispatch(setNotificationsOpen(false));
    navigate(notif.link);
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => dispatch(setNotificationsOpen(open))}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
        <RadixDialog.Content
          aria-describedby="notif-desc"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border-default bg-bg-surface shadow-float focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <RadixDialog.Title className="text-sm font-bold text-text-primary">
                    Notifications Center
                  </RadixDialog.Title>
                  {unreadCount > 0 && (
                    <Badge variant="critical" className="text-[10px] px-1.5 py-0 font-mono">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <p id="notif-desc" className="text-xs text-text-muted mt-0.5">
                  Platform alerts, drift notices & SLA triggers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleMarkAllRead}
                  className="gap-1 text-[11px] text-text-muted hover:text-text-primary"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </Button>
              )}
              <RadixDialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close notifications"
                  className="h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </RadixDialog.Close>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 border-b border-border-subtle bg-bg-elevated/40 px-4 py-2 text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'incident', label: 'Incidents' },
                { id: 'drift', label: 'Drift' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                  filter === tab.id
                    ? 'bg-accent-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="ml-auto text-[11px] text-text-muted hover:text-status-critical transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle p-3 space-y-1">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-text-muted space-y-2">
                <Check className="h-6 w-6 text-status-healthy" />
                <p className="font-semibold text-text-primary">No notifications</p>
                <p>You are all caught up with your monitoring alerts.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={cn(
                    'group relative flex items-start gap-3 rounded-lg p-3 text-xs transition-colors cursor-pointer border',
                    notif.isRead
                      ? 'border-transparent bg-transparent hover:bg-bg-elevated/60 text-text-muted'
                      : 'border-border-default bg-bg-elevated text-text-primary shadow-xs'
                  )}
                >
                  {/* Category Icon */}
                  <div className="mt-0.5 shrink-0">
                    {notif.category === 'incident' ? (
                      <ShieldAlert className="h-4 w-4 text-status-critical" />
                    ) : notif.category === 'drift' ? (
                      <Zap className="h-4 w-4 text-status-warning" />
                    ) : notif.category === 'budget' ? (
                      <Coins className="h-4 w-4 text-status-warning" />
                    ) : (
                      <Cpu className="h-4 w-4 text-accent-cyan" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-text-primary line-clamp-1">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <Badge
                        variant={notif.severity}
                        dot
                        className="text-[9px] py-0 px-1.5 capitalize font-mono"
                      >
                        {notif.category}
                      </Badge>
                      <span className="text-[10px] text-accent-primary group-hover:underline flex items-center gap-0.5">
                        Inspect <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-accent-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border-default bg-bg-elevated/40 p-3 text-center text-[11px] text-text-muted">
            Notifications are routed via ModelSight Event Bridge
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
