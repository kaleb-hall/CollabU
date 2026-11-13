import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { CalendarBlank, CheckSquareOffset, FolderSimplePlus, GearSix, House, MagnifyingGlass } from '@phosphor-icons/react';
import { useProjects } from '../../hooks/useProjects';
import { modKey } from '../../lib/platform';
import { projectColor } from '../../lib/projectColor';

const ITEM = 'flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-ink data-[selected=true]:bg-paper-deep';
const GROUP = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-faint';

const SEARCH_LABEL = 'Search or jump to';

// The top bar search: type to jump to a project or page, or start something new.
// Results drop down right under the box. Ctrl/Cmd+K puts the cursor here (focusRequest).
// Plain search: every word typed must appear in the result (no fuzzy letter skipping)
function matches(value, search, keywords = []) {
  const text = [value, ...keywords].join(' ').toLowerCase();
  return search.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word)) ? 1 : 0;
}

export default function SearchBar({ focusRequest, onNewTask, onNewProject, onDone }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const projects = (useProjects().data ?? []).filter((project) => project.status === 'active');

  // Focusing the box opens the results (see onFocus below)
  useEffect(() => {
    if (focusRequest > 0) inputRef.current?.focus();
  }, [focusRequest]);

  const close = () => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    onDone?.();
  };

  const run = (action) => {
    close();
    action();
  };

  return (
    <Command
      label={SEARCH_LABEL}
      loop
      filter={matches}
      className={`relative w-full ${GROUP}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="flex h-9 items-center gap-2 rounded-card border border-line bg-card px-3 text-ink-faint focus-within:border-ink-faint focus-within:ring-2 focus-within:ring-focus/30">
        <MagnifyingGlass size={16} aria-hidden="true" />
        <Command.Input
          ref={inputRef}
          value={query}
          onValueChange={(value) => { setQuery(value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
          aria-label={SEARCH_LABEL}
          placeholder={SEARCH_LABEL}
          className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-faint"
        />
        {!open && <kbd className="hidden rounded-sm border border-line px-1.5 font-mono text-[0.6875rem] md:inline">{modKey} K</kbd>}
      </div>

      {open && (
        // Keep focus in the box while clicking a result
        <div onMouseDown={(event) => event.preventDefault()} className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-card border border-line bg-card shadow-lift">
          <Command.List className="max-h-[min(24rem,70vh)] overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-ink-soft">Nothing matches that.</Command.Empty>
            {projects.length > 0 && (
              <Command.Group heading="Projects">
                {projects.map((project) => (
                  <Command.Item key={project.id} value={`project ${project.title}`} onSelect={() => run(() => navigate(`/projects/${project.id}`))} className={ITEM}>
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: projectColor(project.id) }} />
                    {project.title}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            <Command.Group heading="Create">
              <Command.Item value="new task" onSelect={() => run(() => onNewTask())} className={ITEM}>
                <CheckSquareOffset size={18} aria-hidden="true" />New task
              </Command.Item>
              <Command.Item value="new project" onSelect={() => run(onNewProject)} className={ITEM}>
                <FolderSimplePlus size={18} aria-hidden="true" />New project
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Go to">
              <Command.Item value="go home dashboard" onSelect={() => run(() => navigate('/dashboard'))} className={ITEM}>
                <House size={18} aria-hidden="true" />Home
              </Command.Item>
              <Command.Item value="go calendar" onSelect={() => run(() => navigate('/calendar'))} className={ITEM}>
                <CalendarBlank size={18} aria-hidden="true" />Calendar
              </Command.Item>
              <Command.Item value="go settings profile password" onSelect={() => run(() => navigate('/settings'))} className={ITEM}>
                <GearSix size={18} aria-hidden="true" />Settings
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      )}
    </Command>
  );
}
