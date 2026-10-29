import { useWorkload } from '../hooks/useProjects';
import { formatShortDate } from '../lib/dates';
import { getErrorMessage } from '../lib/errors';

const hours = (value) => `${Math.round(value * 10) / 10}h`;

export default function WorkloadView({ projectId }) {
  const workload = useWorkload(projectId);

  if (workload.isPending) return <p className="text-gray-600">Loading workload...</p>;
  if (workload.isError) return <p className="text-red-600">{getErrorMessage(workload.error)}</p>;

  const { week_start, week_end, members } = workload.data;
  const lastDay = new Date(new Date(week_end).getTime() - 1);
  const scale = Math.max(1, ...members.map((m) => Math.max(m.assigned_hours, m.free_hours)));

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">This week</h3>
        <p className="text-sm text-gray-600">
          {formatShortDate(week_start)} to {formatShortDate(lastDay)}. Open tasks due this week compared with
          free hours left this week (9:00 to 17:00, minus calendar blocks).
        </p>
      </div>
      <ul className="space-y-4">
        {members.map((member) => (
          <li key={member.user_id}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{member.name}</span>
              <span className="text-gray-600">{hours(member.assigned_hours)} of work, {hours(member.free_hours)} free</span>
            </div>
            <div className="mt-1 space-y-1" aria-hidden="true">
              <div className="h-2 rounded bg-gray-100">
                <div
                  className={`h-2 rounded ${member.overloaded ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${(member.assigned_hours / scale) * 100}%` }}
                />
              </div>
              <div className="h-2 rounded bg-gray-100">
                <div className="h-2 rounded bg-teal-400" style={{ width: `${(member.free_hours / scale) * 100}%` }} />
              </div>
            </div>
            {member.overloaded && (
              <p className="text-xs font-semibold text-red-700 mt-1">
                Over by {hours(member.assigned_hours - member.free_hours)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
