import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useMarkAllRead, useMarkRead, useNotificationList, useUnreadCount } from '../hooks/useNotifications';
import { timeAgo } from '../lib/dates';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { data: unread = 0 } = useUnreadCount();

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setOpen(false);
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-600 text-white text-[0.65rem] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
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
    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {list.isPending && <p className="p-4 text-sm text-gray-500">Loading...</p>}
        {list.isError && <p className="p-4 text-sm text-red-600">Could not load notifications.</p>}
        {list.isSuccess && notifications.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Nothing new. You will see assignments, reviews and deadlines here.</p>
        )}
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => openNotification(notification)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex gap-3"
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notification.read ? 'bg-transparent' : 'bg-blue-600'}`}
                />
                <span className="min-w-0">
                  <span className={`block text-sm ${notification.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                    {notification.title}
                  </span>
                  {notification.message && <span className="block text-xs text-gray-500">{notification.message}</span>}
                  <span className="block text-xs text-gray-400 mt-0.5">{timeAgo(notification.created_at)}</span>
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
            className="w-full py-2 text-sm text-blue-600 hover:bg-gray-50 border-t"
          >
            {list.isFetchingNextPage ? 'Loading...' : 'Show older'}
          </button>
        )}
      </div>
    </div>
  );
}
