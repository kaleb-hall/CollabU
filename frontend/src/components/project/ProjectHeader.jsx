import { Link } from 'react-router-dom';
import { CalendarCheck, LockSimple, Plus, SealCheck } from '@phosphor-icons/react';
import ProjectOptions from './ProjectOptions';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { formatShortDate } from '../../lib/dates';
import { deadlineLabel, isUrgent } from '../../lib/urgency';
import { cx } from '../../lib/cx';

const URGENT_WITHIN_DAYS = 3;

export default function ProjectHeader({ project, tasks, me, isAdmin, canComplete, onComplete, completing, onAddTask, onPlan, planning }) {
  const done = tasks.filter((task) => task.status === 'completed').length;
  const open = tasks.length - done;
  const finished = project.status === 'completed';
  const urgent = isUrgent(project.deadline, URGENT_WITHIN_DAYS);

  return (
    <header className="mb-6">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-ink-faint">
        <Link to="/dashboard" className="hover:text-ink">Home</Link>
        <span className="mx-1.5" aria-hidden="true">/</span>
        <span aria-current="page">{project.title}</span>
      </nav>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-display text-3xl text-ink">{project.title}</h1>
            {finished && <Tag icon={SealCheck} className="text-status-done">Completed</Tag>}
            {project.locked && <Tag icon={LockSimple}>Locked</Tag>}
            {project.archived_at && <Tag>Archived</Tag>}
          </div>
          {project.description && <p className="mt-1 max-w-2xl text-ink-soft">{project.description}</p>}
          <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-baseline gap-2">
              <dt className="sr-only">Deadline</dt>
              <dd className={cx('font-mono text-xs', urgent ? 'font-medium text-accent' : 'text-ink-soft')}>
                DUE {formatShortDate(project.deadline).toUpperCase()}
              </dd>
              <dd className={cx('text-xs', urgent ? 'font-semibold text-accent' : 'text-ink-faint')}>{deadlineLabel(project.deadline)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Progress</dt>
              <dd className="h-1.5 w-28 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
                <div className="h-full rounded-full bg-status-done" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
              </dd>
              <dd className="font-mono text-xs text-ink-soft">{done} of {tasks.length} done</dd>
            </div>
            <div className="flex items-center">
              <dt className="sr-only">Team</dt>
              <dd className="flex -space-x-1.5">
                {project.members.slice(0, 5).map((member) => (
                  <span
                    key={member.user_id}
                    title={member.user.full_name}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-paper bg-paper-deep font-display text-[0.7rem] text-ink"
                  >
                    {member.user.first_name.charAt(0)}
                  </span>
                ))}
              </dd>
              <dd className="ml-2 text-xs text-ink-faint">{project.members.length} {project.members.length === 1 ? 'member' : 'members'}</dd>
            </div>
          </dl>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!project.locked && (
            <>
              <Button variant="secondary" onClick={onPlan} disabled={planning || tasks.length === 0}>
                <CalendarCheck size={18} aria-hidden="true" />
                {planning ? 'Planning...' : 'Plan schedule'}
              </Button>
              <Button variant={canComplete ? 'secondary' : 'primary'} onClick={onAddTask}>
                <Plus size={16} weight="bold" aria-hidden="true" />
                Add task
              </Button>
            </>
          )}
          {canComplete && <CompleteButton openTasks={open} onComplete={onComplete} completing={completing} />}
          <ProjectOptions project={project} me={me} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}

function Tag({ icon: Icon, className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-sm border border-line px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink-soft', className)}>
      {Icon && <Icon size={14} weight="bold" aria-hidden="true" />}
      {children}
    </span>
  );
}

// With tasks still open (only the creator gets this far), ask before finishing
function CompleteButton({ openTasks, onComplete, completing }) {
  const button = (
    <Button disabled={completing} onClick={openTasks ? undefined : onComplete}>
      <SealCheck size={18} weight="bold" aria-hidden="true" />
      {completing ? 'Completing...' : 'Complete project'}
    </Button>
  );
  if (!openTasks) return button;
  return (
    <ConfirmDialog
      trigger={button}
      title="Complete the project?"
      description={`${openTasks} ${openTasks === 1 ? 'task is' : 'tasks are'} still open. The project will be locked, and you can reopen it later.`}
      confirmLabel="Complete anyway"
      confirmVariant="primary"
      onConfirm={onComplete}
    />
  );
}
