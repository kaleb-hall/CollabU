import { NavLink } from 'react-router-dom';
import { SidebarSimple } from '@phosphor-icons/react';
import ProjectNav, { Tip } from './ProjectNav';
import { MAIN_LINKS } from './navLinks';
import { cx } from '../../lib/cx';

// Desktop sidebar: main links and projects. Collapses to a narrow rail.
export default function Sidebar({ collapsed, onToggle, onNewProject }) {
  return (
    <nav
      aria-label="Sidebar"
      className={cx(
        'sticky top-0 hidden h-screen shrink-0 flex-col gap-5 overflow-y-auto px-3 py-3 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cx('flex h-8 items-center', collapsed ? 'justify-center' : 'justify-between px-2')}>
        {!collapsed && <NavLink to="/dashboard" className="font-display text-xl text-ink">CollabU</NavLink>}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-card p-1.5 text-ink-faint hover:bg-card hover:text-ink"
        >
          <SidebarSimple size={18} aria-hidden="true" />
        </button>
      </div>

      <ul className="space-y-0.5">
        {MAIN_LINKS.map(({ to, label, icon: Icon }) => {
          const link = (
            <NavLink
              to={to}
              aria-label={collapsed ? label : undefined}
              className={({ isActive }) => cx(
                'flex h-8 items-center gap-2.5 rounded-card px-2 font-medium text-ink-soft hover:bg-card hover:text-ink',
                collapsed && 'justify-center',
                isActive && 'bg-card text-ink',
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {!collapsed && label}
            </NavLink>
          );
          return <li key={to}>{collapsed ? <Tip label={label}>{link}</Tip> : link}</li>;
        })}
      </ul>

      <ProjectNav collapsed={collapsed} onNewProject={onNewProject} />
    </nav>
  );
}
