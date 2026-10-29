import { NavLink } from 'react-router-dom';
import { Tooltip } from '@base-ui/react/tooltip';
import { Plus } from '@phosphor-icons/react';
import Skeleton from '../ui/Skeleton';
import { useProjects } from '../../hooks/useProjects';
import { projectColor } from '../../lib/projectColor';
import { cx } from '../../lib/cx';

// The project list in the sidebar and the phone drawer. Collapsed, it shows dots with tooltips.
export default function ProjectNav({ collapsed = false, onNewProject, onNavigate }) {
  const projects = useProjects();
  const active = (projects.data ?? []).filter((project) => project.status === 'active');

  return (
    <div>
      <div className={cx('mb-1 flex items-center px-2', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Projects</span>}
        <button
          type="button"
          onClick={onNewProject}
          aria-label="New project"
          className="rounded-sm p-1 text-ink-faint hover:bg-card hover:text-ink"
        >
          <Plus size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>
      {projects.isPending && (
        <div className="space-y-2 px-2 py-1">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-5" />)}</div>
      )}
      {projects.isSuccess && active.length === 0 && !collapsed && (
        <p className="px-2 py-1 text-xs text-ink-faint">No projects yet</p>
      )}
      <ul className="space-y-0.5">
        {active.map((project) => {
          const open = project.task_counts.total - project.task_counts.completed;
          const link = (
            <NavLink
              to={`/projects/${project.id}`}
              onClick={onNavigate}
              aria-label={collapsed ? project.title : undefined}
              className={({ isActive }) => cx(
                'flex h-8 items-center gap-2.5 rounded-card px-2 text-ink-soft hover:bg-card hover:text-ink',
                collapsed && 'justify-center',
                isActive && 'bg-card font-semibold text-ink',
              )}
            >
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: projectColor(project.id) }} />
              {!collapsed && <span className="flex-1 truncate">{project.title}</span>}
              {!collapsed && open > 0 && <span className="font-mono text-xs text-ink-faint">{open}</span>}
            </NavLink>
          );
          return (
            <li key={project.id}>
              {collapsed ? <Tip label={project.title}>{link}</Tip> : link}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Tip({ label, children }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={8} className="z-50">
          <Tooltip.Popup className="rounded-sm bg-ink px-2 py-1 text-xs text-paper">{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
