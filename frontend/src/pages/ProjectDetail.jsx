import { Suspense, lazy, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs } from '@base-ui/react/tabs';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import ActivityFeed from '../components/project/ActivityFeed';
import AllDoneStrip from '../components/project/AllDoneStrip';
import Board from '../components/project/Board';
import CompletionSummary from '../components/project/CompletionSummary';
import FileAttachments from '../components/project/FileAttachments';
import InviteMemberModal from '../components/project/InviteMemberModal';
import ProjectHeader from '../components/project/ProjectHeader';
import TaskPanel from '../components/project/TaskPanel';
import TeamPanel from '../components/project/TeamPanel';
import WorkloadView from '../components/project/WorkloadView';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import { useAppActions } from '../hooks/useAppActions';
import { useAuth } from '../hooks/useAuth';
import { useCompleteProject, useProject } from '../hooks/useProjects';
import { useCalculateSchedule, useProjectTasks } from '../hooks/useTasks';
import { allTasksDone, canComplete, timeTaken } from '../lib/completion';
import { userTimeZone } from '../lib/dates';
import { getErrorMessage } from '../lib/errors';

// Loaded the first time someone finishes a project
const Celebration = lazy(() => import('../components/project/Celebration'));

const TABS = [
  ['board', 'Board'],
  ['workload', 'Workload'],
  ['activity', 'Activity'],
  ['files', 'Files'],
  ['team', 'Team'],
];

export default function ProjectDetail() {
  return (
    <AppShell>
      <ProjectPage />
    </AppShell>
  );
}

function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { openNewTask } = useAppActions();
  const projectQuery = useProject(id);
  const tasksQuery = useProjectTasks(id);
  const schedule = useCalculateSchedule(id);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [inviting, setInviting] = useState(false);
  const complete = useCompleteProject(id);
  // What the celebration shows, kept after the project data changes underneath it
  const [celebrating, setCelebrating] = useState(null);

  const error = projectQuery.error || tasksQuery.error;
  if (error) {
    return <ErrorState title="Could not open this project" error={error} onRetry={() => { projectQuery.refetch(); tasksQuery.refetch(); }} />;
  }
  if (projectQuery.isPending || tasksQuery.isPending) return <ProjectSkeleton />;

  const project = projectQuery.data;
  const tasks = tasksQuery.data;
  const me = project.members.find((m) => m.user_id === user.id);
  const isAdmin = me?.role === 'admin';
  const finished = project.status === 'completed';
  const mayComplete = canComplete(project, tasks, user.id);

  const finish = () => complete.mutate(undefined, {
    onSuccess: ({ project: done }) => setCelebrating({
      project: done,
      stats: { done: tasks.filter((task) => task.status === 'completed').length, took: timeTaken(done.created_at, done.completed_at) },
    }),
    onError: (completeError) => toast.error(getErrorMessage(completeError, 'Could not complete the project')),
  });

  const plan = () => schedule.mutate(userTimeZone(), {
    onSuccess: (result) => {
      toast.success('Schedule planned: tasks now have assignees and dates');
      result.warnings.forEach((warning) => toast(warning, { duration: 8000 }));
    },
    onError: (planError) => toast.error(getErrorMessage(planError, 'Could not plan the schedule')),
  });

  return (
    <>
      <ProjectHeader
        project={project} tasks={tasks} me={me} isAdmin={isAdmin}
        canComplete={mayComplete} onComplete={finish} completing={complete.isPending}
        onAddTask={() => openNewTask(project.id)} onPlan={plan} planning={schedule.isPending}
      />
      {finished && <CompletionSummary project={project} />}
      {!finished && allTasksDone(tasks) && mayComplete && <AllDoneStrip onComplete={finish} completing={complete.isPending} />}
      <Tabs.Root defaultValue="board">
        <Tabs.List className="relative mb-5 flex gap-1 overflow-x-auto border-b border-line">
          {TABS.map(([value, label]) => (
            <Tabs.Tab
              key={value}
              value={value}
              className="shrink-0 px-3 pb-2.5 pt-1 font-semibold text-ink-faint hover:text-ink data-[selected]:text-ink"
            >
              {label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="absolute bottom-0 left-[var(--active-tab-left)] h-0.5 w-[var(--active-tab-width)] bg-ink transition-all duration-200" />
        </Tabs.List>
        <Tabs.Panel value="board">
          <Board projectId={project.id} tasks={tasks} locked={project.locked} onOpenTask={(task) => setOpenTaskId(task.id)} />
        </Tabs.Panel>
        <Tabs.Panel value="workload"><WorkloadView projectId={project.id} /></Tabs.Panel>
        <Tabs.Panel value="activity"><ActivityFeed projectId={project.id} /></Tabs.Panel>
        <Tabs.Panel value="files"><FileAttachments projectId={project.id} ownerId={project.created_by} locked={project.locked} /></Tabs.Panel>
        <Tabs.Panel value="team">
          <TeamPanel project={project} isAdmin={isAdmin && !project.locked} currentUserId={user.id} onInvite={() => setInviting(true)} />
        </Tabs.Panel>
      </Tabs.Root>

      <TaskPanel
        task={tasks.find((task) => task.id === openTaskId)}
        members={project.members}
        ownerId={project.created_by}
        locked={project.locked}
        open={openTaskId !== null}
        onOpenChange={(open) => { if (!open) setOpenTaskId(null); }}
      />
      <InviteMemberModal projectId={project.id} open={inviting} onOpenChange={setInviting} />
      {celebrating && (
        <Suspense fallback={null}>
          <Celebration project={celebrating.project} stats={celebrating.stats} open onClose={() => setCelebrating(null)} />
        </Suspense>
      )}
    </>
  );
}

function ProjectSkeleton() {
  return (
    <div role="status" aria-label="Loading project">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mb-8 mt-3 h-4 w-96 max-w-full" />
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-64 shrink-0" />)}
      </div>
    </div>
  );
}
