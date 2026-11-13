import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import TaskRow from './TaskRow';
import { useAppActions } from '../../hooks/useAppActions';
import { useSetMyTaskStatus } from '../../hooks/useTasks';
import { getErrorMessage } from '../../lib/errors';
import { groupMyWork } from '../../lib/myWork';
import { cx } from '../../lib/cx';

// My open tasks across every project, grouped by when they are due
export default function MyWork({ tasks }) {
  const { openNewTask } = useAppActions();
  const setStatus = useSetMyTaskStatus();
  const groups = groupMyWork(tasks);

  const complete = (task) => {
    const onError = (error) => toast.error(getErrorMessage(error, 'Could not update the task'));
    setStatus.mutate({ task, status: 'completed' }, { onError });
    toast(`Marked "${task.title}" done`, {
      action: { label: 'Undo', onClick: () => setStatus.mutate({ task, status: task.status }, { onError }) },
    });
  };

  return (
    <section aria-labelledby="my-work-title" className="overflow-hidden rounded-card border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id="my-work-title" className="font-semibold text-ink">My work</h2>
        <span className="font-mono text-xs text-ink-faint">{groups.reduce((sum, g) => sum + g.tasks.length, 0)} open</span>
      </div>
      <button
        type="button"
        onClick={() => openNewTask()}
        className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left text-ink-faint hover:bg-paper hover:text-ink"
      >
        <Plus size={16} weight="bold" aria-hidden="true" />
        Add a task
      </button>
      {groups.length === 0 ? (
        <p className="px-4 py-10 text-center">
          <span className="block font-display text-lg text-ink">You are all caught up</span>
          <span className="mt-1 block text-ink-soft">Nothing assigned to you is open.</span>
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.key}>
            <h3 className={cx(
              'flex items-center gap-2 bg-paper px-4 py-1.5 text-xs font-semibold uppercase tracking-wide',
              group.key === 'late' ? 'text-accent' : 'text-ink-faint',
            )}>
              {group.label}
              <span className="font-mono font-normal">{group.tasks.length}</span>
            </h3>
            <ul>
              {group.tasks.map((task) => <TaskRow key={task.id} task={task} onComplete={complete} />)}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
