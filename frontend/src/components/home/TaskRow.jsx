import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@base-ui/react/checkbox';
import { Check } from '@phosphor-icons/react';
import StatusLozenge from '../ui/StatusLozenge';
import { prefersReducedMotion } from '../../lib/motion';
import { projectColor } from '../../lib/projectColor';
import { isUrgent, workDueLabel } from '../../lib/urgency';
import { cx } from '../../lib/cx';

// How long the check-off animation runs before the task is saved and removed.
// Matches the CSS below: tick, then slide away (120 + 300ms), then fold shut (400 + 220ms).
export const LEAVE_MS = 650;

// One of my tasks: check it off, see where it lives, and when it is due (lined up in mono)
export default function TaskRow({ task, onComplete }) {
  const urgent = isUrgent(task.due_date);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const check = () => {
    if (leaving) return;
    if (prefersReducedMotion()) {
      onComplete(task);
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(() => onComplete(task), LEAVE_MS);
  };

  return (
    <li
      data-leaving={leaving}
      className={cx(
        'group/row grid border-b border-line [grid-template-rows:1fr] last:border-b-0',
        'transition-[grid-template-rows,border-color] duration-[220ms] ease-in',
        'data-[leaving=true]:pointer-events-none data-[leaving=true]:border-transparent data-[leaving=true]:delay-[400ms] data-[leaving=true]:[grid-template-rows:0fr]',
      )}
    >
      <div className="flex min-h-0 items-center gap-3 overflow-hidden px-4 py-2 hover:bg-paper">
        <Checkbox.Root
          checked={leaving}
          onCheckedChange={check}
          aria-label={`Mark "${task.title}" done`}
          className={cx(
            'flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-colors',
            leaving ? 'animate-tick border-status-done bg-status-done text-card' : 'border-ink-faint bg-card hover:border-ink',
          )}
        >
          <Checkbox.Indicator><Check size={12} weight="bold" /></Checkbox.Indicator>
        </Checkbox.Root>
        <Link
          to={`/projects/${task.project.id}`}
          tabIndex={leaving ? -1 : undefined}
          className={cx(
            'flex min-w-0 flex-1 items-center gap-3',
            'transition-[transform,opacity] duration-300 ease-in',
            'group-data-[leaving=true]/row:translate-x-12 group-data-[leaving=true]/row:opacity-0 group-data-[leaving=true]/row:delay-[120ms]',
          )}
        >
          <span className="min-w-0 flex-1">
            <span className={cx(
              'block truncate font-medium decoration-ink-faint transition-colors',
              leaving ? 'text-ink-faint line-through' : 'text-ink',
            )}>
              {task.title}
            </span>
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
      </div>
    </li>
  );
}
