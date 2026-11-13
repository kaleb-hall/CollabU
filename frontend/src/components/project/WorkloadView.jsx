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
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-semibold text-ink">
          This week <span className="ml-1 font-mono text-xs font-normal text-ink-faint">{formatShortDate(week_start)} to {formatShortDate(lastDay)}</span>
        </h2>
        <p className="mt-0.5 text-ink-soft">
          Open tasks due this week compared with free hours left (9:00 to 17:00, minus calendar blocks).
        </p>
      </div>
      <ul>
        {members.map((member) => (
          <li key={member.user_id} className="border-b border-line px-4 py-3 last:border-b-0">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-ink">{member.name}</span>
              <span className="font-mono text-xs text-ink-soft">{hours(member.assigned_hours)} of work, {hours(member.free_hours)} free</span>
            </div>
            <div className="mt-2 grid gap-1" aria-hidden="true">
              <div className="h-1.5 rounded-full bg-paper-deep">
                <div className={`h-full rounded-full ${member.overloaded ? 'bg-accent' : 'bg-status-progress'}`} style={{ width: `${(member.assigned_hours / scale) * 100}%` }} />
              </div>
              <div className="h-1.5 rounded-full bg-paper-deep">
                <div className="h-full rounded-full bg-status-done" style={{ width: `${(member.free_hours / scale) * 100}%` }} />
              </div>
            </div>
            {member.overloaded && (
              <p className="mt-1.5 text-xs font-semibold text-accent">Over by {hours(member.assigned_hours - member.free_hours)}</p>
            )}
          </li>
        ))}
      </ul>
      <p className="flex gap-4 border-t border-line px-4 py-2 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-1.5 w-3 rounded-full bg-status-progress" />Work due</span>
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-1.5 w-3 rounded-full bg-status-done" />Free time</span>
      </p>
    </section>
  );
}
