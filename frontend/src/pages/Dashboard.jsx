import { useState } from 'react';
import { Notebook, Plus } from '@phosphor-icons/react';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import DueSoonCard from '../components/dashboard/DueSoonCard';
import Greeting from '../components/dashboard/Greeting';
import NewProjectDialog from '../components/dashboard/NewProjectDialog';
import ProjectCard from '../components/dashboard/ProjectCard';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useMyTasks } from '../hooks/useTasks';
import { isUrgent } from '../lib/urgency';

export default function Dashboard() {
  const { user } = useAuth();
  const projectsQuery = useProjects();
  const tasksQuery = useMyTasks();
  const [creating, setCreating] = useState(false);

  const error = projectsQuery.error || tasksQuery.error;
  const loading = projectsQuery.isPending || tasksQuery.isPending;

  let body;
  if (error) {
    body = (
      <ErrorState
        title="Could not load your dashboard"
        error={error}
        onRetry={() => { projectsQuery.refetch(); tasksQuery.refetch(); }}
      />
    );
  } else if (loading) {
    body = <DashboardSkeleton />;
  } else {
    const projects = projectsQuery.data.filter((project) => project.status === 'active');
    const openTasks = tasksQuery.data.filter((task) => task.status !== 'completed');
    body = (
      <>
        <Greeting
          firstName={user.first_name}
          openCount={openTasks.length}
          lateCount={openTasks.filter((task) => isUrgent(task.due_date, -1)).length}
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-labelledby="projects-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="projects-title" className="font-display text-2xl text-ink">Projects</h2>
              <Button onClick={() => setCreating(true)}>
                <Plus size={18} weight="bold" aria-hidden="true" />
                New project
              </Button>
            </div>
            {projects.length === 0 ? (
              <EmptyState
                icon={Notebook}
                title="No projects yet"
                action={<Button onClick={() => setCreating(true)}>Start a project</Button>}
              >
                Start one for your next group assignment. Pick a template and we will suggest the tasks.
              </EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}
              </div>
            )}
          </section>
          {/* On phones, what is due comes first; on wide screens it sits on the right */}
          <aside className="order-first lg:order-none">
            <DueSoonCard tasks={tasksQuery.data} />
          </aside>
        </div>
      </>
    );
  }

  return (
    <AppShell>
      {body}
      <NewProjectDialog open={creating} onOpenChange={setCreating} />
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your desk">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-10 w-80 max-w-full" />
      <Skeleton className="mt-3 mb-8 h-4 w-56" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
