import { useWorkload } from '../../hooks/useProjects';
import { formatShortDate } from '../../lib/dates';
import ErrorState from '../ui/ErrorState';
import Skeleton from '../ui/Skeleton';

const hours = (value) => `${Math.round(value * 10) / 10}h`;

// This week per member: hours of work due vs free hours left
export default function WorkloadView({ projectId }) {
  const workload = useWorkload(projectId);

  if (workload.isPending) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>;
  if (workload.isError) return <ErrorState title="Could not load the workload" error={workload.error} onRetry={workload.refetch} />;

  const { week_start, week_end, members } = workload.data;
  const lastDay = new Date(new Date(week_end).getTime() - 1);
  const scale = Math.max(1, ...members.map((m) => Math.max(m.assigned_hours, m.free_hours)));

  return (
    <section className="rounded-card border border-line bg-card">
      <div className="border-b border-line px-5 py-3">
        <h2 className="font-semibold text-ink">
          This week <span className="ml-1 font-mono text-xs font-normal text-ink-faint">{formatShortDate(week_start)} to {formatShortDate(lastDay)}</span>
        </h2>
        <p className="mt-0.5 text-ink-soft">
          Open tasks due this week compared with free hours left (9:00 to 17:00, minus calendar blocks).
        </p>
      </div>
      <ul>
        {members.map((member) => (
          <li key={member.user_id} className="border-b border-line px-5 py-4 last:border-b-0">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-medium text-ink">{member.name}</span>
              {member.overloaded && (
                <span className="text-xs font-semibold text-accent">Over by {hours(member.assigned_hours - member.free_hours)}</span>
              )}
            </div>
            <div className="mt-3 space-y-2.5">
              <BarLine label="Work due" value={member.assigned_hours} scale={scale}
                fill={member.overloaded ? 'bg-accent' : 'bg-status-progress'} />
              <BarLine label="Free time" value={member.free_hours} scale={scale} fill="bg-status-done" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// One labeled line: what it is, a bar on the shared scale, and the hours lined up on the right
function BarLine({ label, value, scale, fill }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3">
      <span className="text-xs text-ink-soft">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={scale}
        aria-valuenow={value}
        aria-valuetext={hours(value)}
        className="h-2 overflow-hidden rounded-full bg-paper-deep"
      >
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${(value / scale) * 100}%` }} />
      </div>
      <span className="text-right font-mono text-xs text-ink">{hours(value)}</span>
    </div>
  );
}
