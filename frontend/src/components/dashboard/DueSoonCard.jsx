import { Link } from 'react-router-dom';
import { dueStamp, isUrgent } from '../../lib/urgency';
import { cx } from '../../lib/cx';

const SHOWN = 6;

// My open tasks on an index card: red line on top, blue rules, dates lined up in mono.
export default function DueSoonCard({ tasks }) {
  const open = tasks.filter((task) => task.status !== 'completed').slice(0, SHOWN);

  return (
    <section aria-labelledby="due-soon-title" className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <div className="border-b-2 border-margin px-5 pb-2 pt-4">
        <h2 id="due-soon-title" className="font-display text-xl text-ink">Due soon</h2>
      </div>
      {open.length === 0 ? (
        <p className="ruled px-5 py-[0.6rem] text-sm leading-9 text-ink-soft [--rule-gap:2.25rem]">
          Nothing due. Enjoy it, or pick up something new.
        </p>
      ) : (
        <ul className="ruled [--rule-gap:3.5rem]">
          {open.map((task) => {
            const urgent = isUrgent(task.due_date);
            return (
              <li key={task.id}>
                <Link to={`/projects/${task.project.id}`} className="flex h-14 items-center gap-4 px-5 hover:bg-paper-deep/60">
                  <span className={cx('w-20 shrink-0 font-mono text-xs font-medium', urgent ? 'text-accent' : 'text-ink-soft')}>
                    {dueStamp(task.due_date)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{task.title}</span>
                    <span className="block truncate text-xs text-ink-faint">{task.project.title}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-line px-5 py-3">
        <Link to="/calendar" className="text-sm font-semibold text-ink-soft hover:text-ink">Open calendar</Link>
      </div>
    </section>
  );
}
