import { lazy, Suspense } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu } from '@base-ui/react/menu';
import { CheckSquareOffset, FolderSimplePlus, GearSix, MagnifyingGlass, Plus, SignOut } from '@phosphor-icons/react';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { cx } from '../../lib/cx';
import { modKey } from '../../lib/platform';

// The search code downloads right after the page appears, so it never delays the first paint
const SearchBar = lazy(() => import('./SearchBar'));
const SEARCH_LABEL = 'Search or jump to';

const MENU_POPUP = 'min-w-48 rounded-card border border-line bg-card p-1 shadow-lift transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0';

// On phones the search is hidden until `phoneSearch` is on; then it fills the bar.
export default function TopBar({ searchFocus, phoneSearch, onEndPhoneSearch, onNewTask, onNewProject }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-paper-deep/95 px-4 backdrop-blur-sm md:bg-transparent md:pl-0 md:backdrop-blur-none">
      <NavLink to="/dashboard" className={cx('font-display text-xl text-ink md:hidden', phoneSearch && 'hidden')}>CollabU</NavLink>
      <div className={cx('w-full max-w-md', phoneSearch ? 'block' : 'hidden md:block')}>
        <Suspense fallback={<SearchPlaceholder />}>
          <SearchBar
            focusRequest={searchFocus}
            onNewTask={onNewTask}
            onNewProject={onNewProject}
            onDone={onEndPhoneSearch}
          />
        </Suspense>
      </div>
      {phoneSearch && (
        <button type="button" onClick={onEndPhoneSearch} aria-label="Cancel search" className="shrink-0 font-semibold text-ink-soft md:hidden">
          Cancel
        </button>
      )}
      <div className={cx('ml-auto items-center gap-1', phoneSearch ? 'hidden md:flex' : 'flex')}>
        <CreateMenu onNewTask={onNewTask} onNewProject={onNewProject} />
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  );
}

function CreateMenu({ onNewTask, onNewProject }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="mr-1 inline-flex h-9 items-center gap-1.5 rounded-card bg-ink px-3 font-semibold text-paper hover:bg-ink-soft">
        <Plus size={16} weight="bold" aria-hidden="true" />
        <span>Create</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup className={MENU_POPUP}>
            <MenuItem icon={CheckSquareOffset} onClick={onNewTask}>New task</MenuItem>
            <MenuItem icon={FolderSimplePlus} onClick={onNewProject}>New project</MenuItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
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
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card font-display text-ink hover:bg-paper-deep"
      >
        {user.first_name?.charAt(0)}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup className={MENU_POPUP}>
            <div className="px-3 py-2">
              <p className="font-semibold text-ink">{name}</p>
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
      className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-ink outline-none data-[highlighted]:bg-paper-deep"
    >
      <Icon size={16} aria-hidden="true" />
      {children}
    </Menu.Item>
  );
}

// Looks like the search box while its code finishes downloading
function SearchPlaceholder() {
  return (
    <div className="flex h-9 items-center gap-2 rounded-card border border-line bg-card px-3 text-ink-faint">
      <MagnifyingGlass size={16} aria-hidden="true" />
      <span className="flex-1">{SEARCH_LABEL}</span>
      <kbd className="hidden rounded-sm border border-line px-1.5 font-mono text-[0.6875rem] md:inline">{modKey} K</kbd>
    </div>
  );
}
