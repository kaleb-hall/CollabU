import { useActivity } from '../hooks/useProjects';
import { timeAgo } from '../lib/dates';
import { getErrorMessage } from '../lib/errors';

export default function ActivityFeed({ projectId }) {
  const feed = useActivity(projectId);
  const activities = feed.data ?? [];

  if (feed.isPending) return <p className="text-sm text-gray-500">Loading activity...</p>;
  if (feed.isError) return <p className="text-sm text-red-600">{getErrorMessage(feed.error)}</p>;
  if (activities.length === 0) {
    return <p className="text-sm text-gray-600">Nothing has happened yet. Add a task to get things going.</p>;
  }

  return (
    <div>
      <ul className="space-y-3">
        {activities.map((activity) => (
          <li key={activity.id} className="flex items-start gap-3">
            <span aria-hidden="true" className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gray-400" />
            <span className="min-w-0">
              <span className="block text-sm text-gray-900">{activity.description}</span>
              <span className="block text-xs text-gray-500">{timeAgo(activity.created_at)}</span>
            </span>
          </li>
        ))}
      </ul>
      {feed.hasNextPage && (
        <button
          type="button"
          onClick={() => feed.fetchNextPage()}
          disabled={feed.isFetchingNextPage}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700"
        >
          {feed.isFetchingNextPage ? 'Loading...' : 'Show older'}
        </button>
      )}
    </div>
  );
}
