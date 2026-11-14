import { format } from 'date-fns';
import AppShell from '../components/layout/AppShell';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import MyWork from '../components/home/MyWork';
import ProjectList from '../components/home/ProjectList';
import { useProjects } from '../hooks/useProjects';
import { useMyTasks } from '../hooks/useTasks';
import { isUrgent } from '../lib/urgency';
import { isArchived } from '../lib/completion';

// Home: my work first, projects beside it. Like Jira's "For you" or Google Tasks.
export default function Dashboard() {
  return (
    <AppShell>
      <HomeContent />
    </AppShell>
  );
}

function HomeContent() {
  const projectsQuery = useProjects();
  const tasksQuery = useMyTasks();
  const error = projectsQuery.error || tasksQuery.error;

  if (error) {
    return (
      <ErrorState
        title="Could not load your work"
        error={error}
        onRetry={() => { projectsQuery.refetch(); tasksQuery.refetch(); }}
      />
    );
  }
  if (projectsQuery.isPending || tasksQuery.isPending) return <HomeSkeleton />;

  const projects = projectsQuery.data.filter((project) => !isArchived(project));
  const archived = projectsQuery.data.filter(isArchived);
  const open = tasksQuery.data.filter((task) => task.status !== 'completed');
  const late = open.filter((task) => isUrgent(task.due_date, -1)).length;

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink">Home</h1>
        <p className="mt-1 text-ink-soft">
          <time className="font-mono text-xs uppercase tracking-wide text-ink-faint">{format(new Date(), 'EEE d MMM')}</time>
          <span className="mx-2 text-line" aria-hidden="true">|</span>
          {open.length} open
          {late > 0 && <span className="font-semibold text-accent">, {late} late</span>}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <MyWork tasks={tasksQuery.data} />
        <div><ProjectList projects={projects} archived={archived} /></div>
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading your work">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="mb-6 mt-2 h-4 w-48" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-2">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    </div>
  );
}
