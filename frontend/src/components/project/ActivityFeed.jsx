import { useActivity } from '../../hooks/useProjects';
import { timeAgo } from '../../lib/dates';
import ErrorState from '../ui/ErrorState';
import Skeleton from '../ui/Skeleton';

export default function ActivityFeed({ projectId }) {
  const feed = useActivity(projectId);
  const activities = feed.data ?? [];

  if (feed.isPending) return <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>;
  if (feed.isError) return <ErrorState title="Could not load activity" error={feed.error} onRetry={feed.refetch} />;

  return (
    <section className="rounded-card border border-line bg-card">
      {activities.length === 0 ? (
        <p className="px-4 py-10 text-center text-ink-soft">Nothing has happened yet. Add a task to get things going.</p>
      ) : (
        <ol className="px-4 py-2">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-baseline gap-4 border-b border-line py-2.5 last:border-b-0">
              <span className="w-24 shrink-0 font-mono text-xs text-ink-faint">{timeAgo(activity.created_at)}</span>
              <span className="text-ink">{activity.description}</span>
            </li>
          ))}
        </ol>
      )}
      {feed.hasNextPage && (
        <button
          type="button"
          onClick={() => feed.fetchNextPage()}
          disabled={feed.isFetchingNextPage}
          className="w-full border-t border-line py-2 font-semibold text-ink-soft hover:bg-paper"
        >
          {feed.isFetchingNextPage ? 'Loading...' : 'Show older'}
        </button>
      )}
    </section>
  );
}
