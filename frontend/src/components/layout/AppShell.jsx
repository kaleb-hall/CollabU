import { NavLink, useNavigate } from 'react-router-dom';
import { Menu } from '@base-ui/react/menu';
import { CalendarBlank, GearSix, House, SignOut } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import { cx } from '../../lib/cx';
import NotificationBell from '../NotificationBell';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: House },
  { to: '/calendar', label: 'Calendar', icon: CalendarBlank },
];

// The frame around every signed-in page: header on top, and on phones a bottom tab bar.
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-card focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <NavLink to="/dashboard" className="font-display text-2xl text-ink">
            CollabU
          </NavLink>
          <nav aria-label="Main" className="hidden gap-1 sm:flex">
            {NAV.map((item) => <TopLink key={item.to} {...item} />)}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <AccountMenu />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card sm:hidden">
        {NAV.map((item) => <BottomLink key={item.to} {...item} />)}
      </nav>
    </div>
  );
}

function TopLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cx(
        'rounded-card px-3 py-2 text-sm font-semibold transition-colors',
        isActive ? 'text-ink underline decoration-accent decoration-2 underline-offset-8' : 'text-ink-soft hover:text-ink',
      )}
    >
      {label}
    </NavLink>
  );
}

function BottomLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cx(
        'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold',
        isActive ? 'text-ink' : 'text-ink-faint',
      )}
    >
      <Icon size={22} aria-hidden="true" />
      {label}
    </NavLink>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user.full_name ?? `${user.first_name} ${user.last_name}`;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Account menu for ${name}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card font-display text-ink hover:bg-paper-deep"
      >
        {user.first_name?.charAt(0)}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-50">
          <Menu.Popup className="min-w-52 rounded-card border border-line bg-card p-1 shadow-lift transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-ink">{name}</p>
              <p className="text-xs text-ink-faint">{user.email}</p>
            </div>
            <Menu.Separator className="my-1 h-px bg-line" />
            <MenuItem icon={GearSix} onClick={() => navigate('/settings')}>Settings</MenuItem>
            <MenuItem icon={SignOut} onClick={() => { logout(); navigate('/login'); }}>Log out</MenuItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function MenuItem({ icon: Icon, children, onClick }) {
  return (
    <Menu.Item
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 rounded-card px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-paper-deep"
    >
      <Icon size={18} aria-hidden="true" />
      {children}
    </Menu.Item>
  );
}
