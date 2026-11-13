import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Button from '../ui/Button';
import { cx } from '../../lib/cx';

const VIEW_LABELS = { month: 'Month', week: 'Week', day: 'Day', agenda: 'List' };

// Replaces react-big-calendar's toolbar so it matches the rest of the app
export default function CalendarToolbar({ label, onNavigate, onView, view, views }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2.5">
      <Button size="sm" variant="secondary" onClick={() => onNavigate('TODAY')}>Today</Button>
      <div className="flex">
        <button type="button" aria-label="Previous" onClick={() => onNavigate('PREV')} className="rounded-card p-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink">
          <CaretLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Next" onClick={() => onNavigate('NEXT')} className="rounded-card p-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink">
          <CaretRight size={18} aria-hidden="true" />
        </button>
      </div>
      <h2 className="font-display text-lg text-ink">{label}</h2>
      <div role="group" aria-label="View" className="ml-auto flex rounded-card border border-line p-0.5">
        {views.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={view === name}
            onClick={() => onView(name)}
            className={cx('rounded-sm px-2.5 py-1 text-xs font-semibold', view === name ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink')}
          >
            {VIEW_LABELS[name]}
          </button>
        ))}
      </div>
    </div>
  );
}
