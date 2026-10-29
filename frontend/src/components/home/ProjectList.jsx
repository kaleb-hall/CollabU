import { Link } from 'react-router-dom';
import { Notebook } from '@phosphor-icons/react';
import Button from '../ui/Button';
import { useAppActions } from '../../hooks/useAppActions';
import { formatShortDate } from '../../lib/dates';
import { projectColor } from '../../lib/projectColor';
import { deadlineLabel, isUrgent } from '../../lib/urgency';
import { cx } from '../../lib/cx';

const URGENT_WITHIN_DAYS = 3;

// Every active project as one compact row: progress and deadline at a glance
export default function ProjectList({ projects }) {
  const { openNewProject } = useAppActions();

  return (
    <section aria-labelledby="projects-title" className="overflow-hidden rounded-card border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id="projects-title" className="font-semibold text-ink">Projects</h2>
        <span className="font-mono text-xs text-ink-faint">{projects.length}</span>
      </div>
      {projects.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Notebook size={32} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
          <p className="font-display text-lg text-ink">No projects yet</p>
          <p className="mx-auto mt-1 max-w-xs text-ink-soft">Pick a template for your next group assignment and we suggest the tasks.</p>
          <Button className="mt-4" size="sm" onClick={openNewProject}>Start a project</Button>
        </div>
      ) : (
        <ul>
          {projects.map((project) => <ProjectRow key={project.id} project={project} />)}
        </ul>
      )}
    </section>
  );
}

function ProjectRow({ project }) {
  const { total, completed } = project.task_counts;
  const urgent = isUrgent(project.deadline, URGENT_WITHIN_DAYS);
  return (
    <li className="border-b border-line last:border-b-0">
      <Link to={`/projects/${project.id}`} className="block px-4 py-3 hover:bg-paper">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: projectColor(project.id) }} />
          <span className="flex-1 truncate font-medium text-ink">{project.title}</span>
          <span data-urgent={urgent} className={cx('font-mono text-xs', urgent ? 'font-medium text-accent' : 'text-ink-soft')}>
            {formatShortDate(project.deadline)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 pl-[1.125rem]">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
            <div className="h-full rounded-full bg-status-done" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
          </div>
          <span className="font-mono text-xs text-ink-faint">{completed}/{total}</span>
          <span data-urgent={urgent} className={cx('w-24 text-right text-xs', urgent ? 'font-semibold text-accent' : 'text-ink-faint')}>
            {deadlineLabel(project.deadline)}
          </span>
        </div>
      </Link>
    </li>
  );
}
