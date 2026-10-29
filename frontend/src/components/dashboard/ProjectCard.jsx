import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { parseApiDate } from '../../lib/dates';
import { deadlineLabel, isUrgent } from '../../lib/urgency';
import { cx } from '../../lib/cx';

const URGENT_WITHIN_DAYS = 3;

// A project as a notebook page: margin line on the left, deadline stamp on the right.
export default function ProjectCard({ project, index }) {
  const { total, completed } = project.task_counts;
  const progress = total ? completed / total : 0;
  const urgent = isUrgent(project.deadline, URGENT_WITHIN_DAYS);

  return (
    <Link
      to={`/projects/${project.id}`}
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
      className="animate-rise group relative block rounded-card border border-line bg-card py-5 pl-9 pr-5 shadow-card transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-5 w-px bg-margin" />
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-xl leading-snug text-ink">{project.title}</h3>
        <div data-urgent={urgent} className="shrink-0 text-right">
          <p className={cx('font-mono text-xs font-medium', urgent ? 'text-accent' : 'text-ink-soft')}>
            {format(parseApiDate(project.deadline), 'MMM d').toUpperCase()}
          </p>
          <p className={cx('text-xs', urgent ? 'font-semibold text-accent' : 'text-ink-faint')}>
            {deadlineLabel(project.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-ink-soft">{completed} of {total} done</span>
          <Members members={project.members} />
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
          <div className="h-full rounded-full bg-status-done" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        {project.next_task ? (
          <>
            <span className="text-ink-faint">Next: </span>
            <span className="text-ink">{project.next_task.title}</span>
          </>
        ) : total ? 'Every task is done.' : 'No tasks yet.'}
      </p>
    </Link>
  );
}

function Members({ members }) {
  const shown = members.slice(0, 4);
  return (
    <span className="flex -space-x-1.5" aria-label={`${members.length} member${members.length === 1 ? '' : 's'}`}>
      {shown.map((member) => (
        <span
          key={member.user_id}
          title={`${member.user.first_name} ${member.user.last_name}`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-card bg-paper-deep font-display text-[0.7rem] text-ink"
        >
          {member.user.first_name.charAt(0)}
        </span>
      ))}
      {members.length > shown.length && (
        <span className="flex h-6 items-center pl-2.5 font-mono text-[0.7rem] text-ink-faint">+{members.length - shown.length}</span>
      )}
    </span>
  );
}
