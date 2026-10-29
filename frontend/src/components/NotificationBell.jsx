import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover } from '@base-ui/react/popover';
import { useAnimate } from 'motion/react-mini';
import { prefersReducedMotion } from '../lib/motion';
import { Bell } from '@phosphor-icons/react';
import { useMarkAllRead, useMarkRead, useNotificationList, useUnreadCount } from '../hooks/useNotifications';
import { timeAgo } from '../lib/dates';
import { cx } from '../lib/cx';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useUnreadCount();
  const unread = data ?? 0;
  const scope = useWiggleOnIncrease(data);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex h-10 w-10 items-center justify-center rounded-card text-ink-soft hover:bg-paper-deep hover:text-ink"
      >
        <span ref={scope} className="flex">
          <Bell size={22} aria-hidden="true" />
        </span>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-accent px-1 font-mono text-[0.65rem] font-medium text-on-accent">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="z-50">
          <Popover.Popup className="w-[min(22rem,calc(100vw-2rem))] rounded-card border border-line bg-card shadow-lift transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            <NotificationPanel onClose={() => setOpen(false)} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

// A small shake when a new notification arrives while the page is open.
// `count` is undefined until the first load, so opening a page never shakes it.
function useWiggleOnIncrease(count) {
  const [scope, animate] = useAnimate();
  const previous = useRef(count);
  useEffect(() => {
    const arrived = previous.current !== undefined && count > previous.current;
    if (arrived && !prefersReducedMotion() && scope.current?.animate) {
      animate(scope.current, { rotate: [0, -16, 13, -8, 4, 0] }, { duration: 0.6 });
    }
    previous.current = count;
  }, [count, animate, scope]);
  return scope;
}

function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const list = useNotificationList(true);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const notifications = list.data ?? [];

  const openNotification = (notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    onClose();
    if (notification.link) navigate(notification.link);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Popover.Title className="font-display text-lg text-ink">Notifications</Popover.Title>
        <button type="button" onClick={() => markAllRead.mutate()} className="text-sm font-semibold text-ink-soft hover:text-ink">
          Mark all read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {list.isPending && <p className="p-4 text-sm text-ink-soft">Loading...</p>}
        {list.isError && <p className="p-4 text-sm text-accent">Could not load notifications.</p>}
        {list.isSuccess && notifications.length === 0 && (
          <p className="p-4 text-sm text-ink-soft">Nothing new. Assignments, reviews and deadlines show up here.</p>
        )}
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => openNotification(notification)}
                className="flex w-full gap-3 px-4 py-3 text-left hover:bg-paper-deep"
              >
                <span
                  aria-hidden="true"
                  className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', notification.read ? 'bg-transparent' : notification.type === 'deadline' ? 'bg-accent' : 'bg-ink')}
                />
                <span className="min-w-0">
                  <span className={cx('block text-sm', notification.read ? 'text-ink-soft' : 'font-semibold text-ink')}>
                    {notification.title}
                  </span>
                  {notification.message && <span className="block text-xs text-ink-faint">{notification.message}</span>}
                  <span className="mt-0.5 block font-mono text-xs text-ink-faint">{timeAgo(notification.created_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {list.hasNextPage && (
          <button
            type="button"
            onClick={() => list.fetchNextPage()}
            disabled={list.isFetchingNextPage}
            className="w-full border-t border-line py-2 text-sm font-semibold text-ink-soft hover:bg-paper-deep"
          >
            {list.isFetchingNextPage ? 'Loading...' : 'Show older'}
          </button>
        )}
      </div>
    </>
  );
}
