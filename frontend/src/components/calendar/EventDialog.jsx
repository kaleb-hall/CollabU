import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import StatusLozenge from '../ui/StatusLozenge';
import { useDeleteBlock } from '../../hooks/useCalendarBlocks';
import { describeRepeat } from '../../lib/blockForm';
import { formatDateTime, formatTime } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';

// Details for a task or a busy block picked on the calendar
export default function EventDialog({ event, onClose }) {
  return (
    <Modal open={Boolean(event)} onOpenChange={(open) => { if (!open) onClose(); }} title={event?.title ?? ''}>
      {event?.kind === 'task' && <TaskDetails event={event} />}
      {event?.kind === 'block' && <BlockDetails event={event} onDeleted={onClose} />}
    </Modal>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

function TaskDetails({ event }) {
  const task = event.data;
  return (
    <>
      <dl className="divide-y divide-line">
        {task.project && <Row label="Project">{task.project.title}</Row>}
        <Row label="Status"><StatusLozenge status={task.status} /></Row>
        <Row label="Due"><span className="font-mono">{formatDateTime(task.due_date)}</span></Row>
        {task.start_date && <Row label="Planned"><span className="font-mono">{formatDateTime(event.start)} to {formatTime(event.end)}</span></Row>}
      </dl>
      <div className="mt-5 flex justify-end">
        <Link to={`/projects/${task.project_id}`} className="inline-flex h-10 items-center rounded-card bg-ink px-4 font-semibold text-paper hover:bg-ink-soft">
          Open project
        </Link>
      </div>
    </>
  );
}

function BlockDetails({ event, onDeleted }) {
  const block = event.data;
  const deleteBlock = useDeleteBlock();
  const repeat = describeRepeat(block);

  const destroy = () => deleteBlock.mutate(block.id, {
    onSuccess: () => {
      toast.success('Busy time deleted');
      onDeleted();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete')),
  });

  return (
    <>
      <dl className="divide-y divide-line">
        <Row label="Type"><span className="capitalize">{block.block_type}</span></Row>
        <Row label="When"><span className="font-mono">{formatDateTime(event.start)} to {formatTime(event.end)}</span></Row>
        {repeat && <Row label="Repeats">{repeat}</Row>}
        {block.description && <Row label="Notes">{block.description}</Row>}
      </dl>
      <div className="mt-5 flex justify-end">
        <ConfirmDialog
          trigger={<Button variant="secondary">{repeat ? 'Delete every repeat' : 'Delete busy time'}</Button>}
          title={repeat ? 'Delete every repeat?' : 'Delete this busy time?'}
          description={repeat ? `All repeats of "${block.title}" will be removed from your calendar.` : `"${block.title}" will be removed from your calendar.`}
          confirmLabel="Delete"
          onConfirm={destroy}
        />
      </div>
    </>
  );
}
