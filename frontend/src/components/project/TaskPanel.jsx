import { useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import FileAttachments from './FileAttachments';
import TaskComments from '../tasks/TaskComments';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Field from '../ui/Field';
import Select from '../ui/Select';
import Sheet from '../ui/Sheet';
import { useDeleteTask, useUpdateTask } from '../../hooks/useTasks';
import { fromInputValue, toInputValue } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { STATUSES } from '../../lib/status';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));
const NOBODY = 'nobody';

// Everything about one task in a side panel: edit it, attach files, talk about it
export default function TaskPanel({ task, members, ownerId, open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Task">
      {task && (
        <div className="space-y-6">
          <TaskForm key={task.id} task={task} members={members} onDeleted={() => onOpenChange(false)} />
          <FileAttachments projectId={task.project_id} taskId={task.id} ownerId={ownerId} />
          <TaskComments taskId={task.id} projectId={task.project_id} />
        </div>
      )}
    </Sheet>
  );
}

function TaskForm({ task, members, onDeleted }) {
  const update = useUpdateTask(task.project_id);
  const remove = useDeleteTask(task.project_id);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to ?? NOBODY,
    due_date: toInputValue(task.due_date),
    estimated_hours: task.estimated_hours ?? '',
  });
  const set = (key) => (value) => setForm({ ...form, [key]: value?.target ? value.target.value : value });

  const save = (e) => {
    e.preventDefault();
    update.mutate({
      taskId: task.id,
      changes: {
        ...form,
        title: form.title.trim(),
        assigned_to: form.assigned_to === NOBODY ? null : form.assigned_to,
        due_date: fromInputValue(form.due_date),
        estimated_hours: parseFloat(form.estimated_hours) || null,
      },
    }, {
      onSuccess: () => toast.success('Task saved'),
      onError: (error) => toast.error(getErrorMessage(error, 'Could not save the task')),
    });
  };

  const destroy = () => remove.mutate(task.id, {
    onSuccess: () => {
      toast.success('Task deleted');
      onDeleted();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete the task')),
  });

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Title" required maxLength={200} value={form.title} onChange={set('title')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Status" value={form.status} onChange={set('status')} options={STATUSES} />
        <Select label="Priority" value={form.priority} onChange={set('priority')} options={PRIORITIES} />
        <Select
          label="Assignee"
          value={form.assigned_to}
          onChange={set('assigned_to')}
          options={[{ value: NOBODY, label: 'Nobody yet' }, ...members.map((m) => ({ value: m.user_id, label: m.user.full_name }))]}
        />
        <Field label="Estimate (hours)" type="number" min="0.25" step="0.25" value={form.estimated_hours}
          className="font-mono" onChange={set('estimated_hours')} />
      </div>
      <Field label="Due" type="datetime-local" required value={form.due_date} className="font-mono" onChange={set('due_date')} />
      <Field label="Notes" as="textarea" rows={3} value={form.description} onChange={set('description')} />
      <div className="flex items-center justify-between gap-2">
        <ConfirmDialog
          trigger={(
            <Button variant="ghost" size="sm" className="text-ink-soft hover:text-accent">
              <Trash size={16} aria-hidden="true" />Delete task
            </Button>
          )}
          title="Delete this task?"
          description={`"${task.title}" and its comments will be deleted. Its files stay on the project.`}
          confirmLabel="Delete task"
          onConfirm={destroy}
        />
        <Button type="submit" disabled={update.isPending || !form.title.trim()}>
          {update.isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
