import { Menu } from '@base-ui/react/menu';
import { DotsThree } from '@phosphor-icons/react';
import { STATUSES } from '../../lib/status';
import { isUrgent, workDueLabel } from '../../lib/urgency';
import { cx } from '../../lib/cx';

// A task as an index card: title above a faint red rule, the details below.
// `lifted` is the copy that follows the pointer while dragging (tilted, with a shadow).
export default function TaskCard({ task, onOpen, onMove, lifted = false, dragHandle }) {
  const urgent = task.status !== 'completed' && isUrgent(task.due_date);
  const important = task.priority === 'urgent' || task.priority === 'high';

  return (
    <article
      className={cx(
        'group relative rounded-sm border border-line bg-card text-left',
        lifted ? '-rotate-2 scale-[1.03] shadow-lift' : 'hover:border-ink-faint',
        task.status === 'completed' && !lifted && 'opacity-70',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen?.(task)}
        className="block w-full touch-manipulation px-3 pb-2.5 pt-2.5 text-left"
        {...dragHandle}
      >
        <span className={cx('block pr-6 font-medium leading-snug', task.status === 'completed' ? 'text-ink-soft line-through decoration-ink-faint' : 'text-ink')}>
          {task.title}
        </span>
        <span aria-hidden="true" className="mt-2 block h-px bg-margin" />
        <span className="mt-2 flex items-center gap-2 text-xs">
          <span className={cx('font-mono', urgent ? 'font-medium text-accent' : 'text-ink-soft')}>{workDueLabel(task.due_date)}</span>
          {task.estimated_hours ? <span className="font-mono text-ink-faint">{task.estimated_hours}h</span> : null}
          {important && (
            <span className={cx('font-semibold uppercase tracking-wide', task.priority === 'urgent' ? 'text-accent' : 'text-ink-soft')}>
              {task.priority}
            </span>
          )}
          {task.assignee && (
            <span
              title={task.assignee.full_name}
              aria-label={`Assigned to ${task.assignee.full_name}`}
              className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-paper-deep font-display text-[0.65rem] text-ink"
            >
              {task.assignee.first_name.charAt(0)}
            </span>
          )}
        </span>
      </button>
      {onMove && <MoveMenu task={task} onMove={onMove} />}
    </article>
  );
}

// A keyboard and touch friendly way to move a card without dragging
function MoveMenu({ task, onMove }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Move "${task.title}"`}
        className="absolute right-1.5 top-1.5 rounded-sm p-1 text-ink-faint opacity-100 hover:bg-paper-deep hover:text-ink focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        <DotsThree size={18} weight="bold" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-50">
          <Menu.Popup className="min-w-44 rounded-card border border-line bg-card p-1 shadow-lift">
            <p className="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Move to</p>
            {STATUSES.filter((status) => status.value !== task.status).map((status) => (
              <Menu.Item
                key={status.value}
                onClick={() => onMove(task, status.value)}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-ink outline-none data-[highlighted]:bg-paper-deep"
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: status.color }} />
                {status.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
