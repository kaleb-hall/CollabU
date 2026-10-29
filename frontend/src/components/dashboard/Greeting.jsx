import { format } from 'date-fns';

function partOfDay(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Greeting({ firstName, openCount, lateCount }) {
  const now = new Date();
  return (
    <div className="mb-8">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
        <time dateTime={now.toISOString()}>{format(now, 'EEE d MMM yyyy')}</time>
      </p>
      <h1 className="mt-1 font-display text-4xl text-ink sm:text-5xl">
        {partOfDay(now.getHours())}, {firstName}.
      </h1>
      <p className="mt-2 text-ink-soft">
        {openCount === 0 ? 'Nothing on your plate right now.' : `${openCount} open task${openCount === 1 ? '' : 's'} assigned to you`}
        {lateCount > 0 && <span className="font-semibold text-accent">{`, ${lateCount} late`}</span>}
        {openCount > 0 && '.'}
      </p>
    </div>
  );
}
