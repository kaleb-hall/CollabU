import { NavLink } from 'react-router-dom';
import { FolderSimple, MagnifyingGlass } from '@phosphor-icons/react';
import { MAIN_LINKS } from './navLinks';
import { cx } from '../../lib/cx';

const ITEM = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.6875rem] font-semibold';

// Phone navigation along the bottom, within thumb reach
export default function MobileNav({ onProjects, onSearch }) {
  return (
    <nav aria-label="Phone navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card md:hidden">
      {MAIN_LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => cx(ITEM, isActive ? 'text-ink' : 'text-ink-faint')}>
          <Icon size={22} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      <button type="button" onClick={onProjects} className={cx(ITEM, 'text-ink-faint')}>
        <FolderSimple size={22} aria-hidden="true" />
        Projects
      </button>
      <button type="button" onClick={onSearch} className={cx(ITEM, 'text-ink-faint')}>
        <MagnifyingGlass size={22} aria-hidden="true" />
        Search
      </button>
    </nav>
  );
}
