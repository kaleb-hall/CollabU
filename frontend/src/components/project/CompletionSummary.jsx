import { CaretRight, DownloadSimple, SealCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';
import ErrorState from '../ui/ErrorState';
import Skeleton from '../ui/Skeleton';
import { useProjectSummary } from '../../hooks/useProjects';
import { timeTaken } from '../../lib/completion';
import { formatDate } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { formatSize } from '../../lib/files';
import { fileService } from '../../services/fileService';

// The banner on a finished project: how long it took, who did what, and the files.
export default function CompletionSummary({ project }) {
  const summary = useProjectSummary(project.id, project.status === 'completed');

  if (summary.isPending) return <Skeleton className="mb-6 h-40" />;
  if (summary.isError) return <div className="mb-6"><ErrorState title="Could not load the summary" error={summary.error} onRetry={summary.refetch} /></div>;

  const data = summary.data;
  const download = (file) => fileService.download(file)
    .catch((error) => toast.error(getErrorMessage(error, 'Could not download the file')));

  return (
    <section aria-label="Project summary" className="mb-6 rounded-card border border-line bg-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3">
        <SealCheck size={24} weight="duotone" className="text-status-done" aria-hidden="true" />
        <h2 className="font-semibold text-ink">Completed {formatDate(data.completed_at)}</h2>
        <p className="text-sm text-ink-soft">
          Took <span className="font-mono text-ink">{timeTaken(data.started_at, data.completed_at).toLowerCase()}</span>
          {data.completed_by && <>, finished by {data.completed_by.full_name}</>}
        </p>
      </div>

      {data.final_note && (
        <blockquote className="border-b border-line px-5 py-4">
          <p className="whitespace-pre-line font-display text-lg leading-snug text-ink">&ldquo;{data.final_note}&rdquo;</p>
          {data.completed_by && <footer className="mt-1 text-sm text-ink-soft">{data.completed_by.full_name}</footer>}
        </blockquote>
      )}

      <dl className="grid grid-cols-3 divide-x divide-line">
        <Stat label="Tasks done" value={data.completed_tasks.length} />
        <Stat label="Contributors" value={data.contributors.length} />
        <Stat label="Files" value={data.files.length} />
      </dl>

      {data.contributors.length > 0 && (
        <ul aria-label="Who contributed" className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
          {data.contributors.map(({ user, tasks_completed: count }) => (
            <li key={user.id} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper-deep font-display text-xs text-ink" aria-hidden="true">
                {user.first_name.charAt(0)}
              </span>
              <span className="text-ink">{user.full_name}</span>
              <span className="font-mono text-xs text-ink-soft">{count} {count === 1 ? 'task' : 'tasks'}</span>
            </li>
          ))}
        </ul>
      )}

      <Details title={`Completed tasks (${data.completed_tasks.length})`}>
        {data.completed_tasks.length === 0 ? <Empty>No tasks were completed.</Empty> : (
          <ul>
            {data.completed_tasks.map((task) => (
              <li key={task.id} className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-ink">{task.title}</span>
                <span className="shrink-0 text-xs text-ink-soft">{task.assignee?.full_name ?? 'Nobody'}</span>
              </li>
            ))}
          </ul>
        )}
        {data.open_task_count > 0 && (
          <p className="pt-1 text-xs text-ink-faint">{data.open_task_count} {data.open_task_count === 1 ? 'task was' : 'tasks were'} left open.</p>
        )}
      </Details>

      <Details title={`Files (${data.files.length})`}>
        {data.files.length === 0 ? <Empty>No files were attached.</Empty> : (
          <ul>
            {data.files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 py-1">
                <span className="min-w-0 truncate text-ink">{file.filename}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-ink-faint">{formatSize(file.size)}</span>
                  <button type="button" onClick={() => download(file)} aria-label={`Download ${file.filename}`}
                    className="rounded-sm p-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink">
                    <DownloadSimple size={18} aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Details>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="px-5 py-3">
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="font-mono text-2xl text-ink">{value}</dd>
    </div>
  );
}

function Details({ title, children }) {
  return (
    <details className="group border-t border-line">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">
        <CaretRight size={14} weight="bold" className="text-ink-faint transition-transform group-open:rotate-90" aria-hidden="true" />
        {title}
      </summary>
      <div className="px-5 pb-4 pl-11">{children}</div>
    </details>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-ink-soft">{children}</p>;
}
