import { Link } from 'react-router-dom';
import { Checkbox } from '@base-ui/react/checkbox';
import { Check } from '@phosphor-icons/react';
import StatusLozenge from '../ui/StatusLozenge';
import { projectColor } from '../../lib/projectColor';
import { isUrgent, workDueLabel } from '../../lib/urgency';
import { cx } from '../../lib/cx';

// One of my tasks: check it off, see where it lives, and when it is due (lined up in mono)
export default function TaskRow({ task, onComplete }) {
  const urgent = isUrgent(task.due_date);
  return (
    <li className="group flex items-center gap-3 border-b border-line px-4 py-2 last:border-b-0 hover:bg-paper">
      <Checkbox.Root
        checked={false}
        onCheckedChange={() => onComplete(task)}
        aria-label={`Mark "${task.title}" done`}
        className="flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-sm border-[1.5px] border-ink-faint bg-card hover:border-ink"
      >
        <Checkbox.Indicator><Check size={12} weight="bold" /></Checkbox.Indicator>
      </Checkbox.Root>
      <Link to={`/projects/${task.project.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">{task.title}</span>
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: projectColor(task.project.id) }} />
            <span className="truncate">{task.project.title}</span>
          </span>
        </span>
        {task.status !== 'todo' && <StatusLozenge status={task.status} />}
        <span className={cx('w-16 shrink-0 text-right font-mono text-xs', urgent ? 'font-medium text-accent' : 'text-ink-soft')}>
          {workDueLabel(task.due_date)}
        </span>
      </Link>
    </li>
  );
}
