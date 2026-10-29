import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Select from '../ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';
import { useCreateTaskIn } from '../../hooks/useTasks';
import { fromInputValue } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { projectColor } from '../../lib/projectColor';

// Tasks are due at 17:00 local time on the chosen day
const DUE_TIME = '17:00';

export default function NewTaskDialog({ open, onOpenChange, projectId }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New task">
      {open && <NewTaskForm defaultProjectId={projectId} onDone={() => onOpenChange(false)} />}
    </Modal>
  );
}

function NewTaskForm({ defaultProjectId, onDone }) {
  const { user } = useAuth();
  const projects = (useProjects().data ?? []).filter((project) => project.status === 'active');
  const createTask = useCreateTaskIn();
  const [form, setForm] = useState({
    title: '',
    projectId: defaultProjectId ?? null,
    due: format(new Date(), 'yyyy-MM-dd'),
    mine: true,
  });
  const projectId = form.projectId ?? projects[0]?.id ?? null;

  if (projects.length === 0) {
    return <p className="text-ink-soft">Create a project first, then add tasks to it.</p>;
  }

  const submit = (e) => {
    e.preventDefault();
    createTask.mutate({
      projectId,
      task: {
        title: form.title.trim(),
        due_date: fromInputValue(`${form.due}T${DUE_TIME}`),
        assigned_to: form.mine ? user.id : null,
      },
    }, {
      onSuccess: () => {
        toast.success('Task added');
        onDone();
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not add the task')),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Task" required maxLength={200} value={form.title} placeholder="Read chapter 4"
        onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Project"
          value={projectId}
          onChange={(value) => setForm({ ...form, projectId: value })}
          options={projects.map((project) => ({ value: project.id, label: project.title, dot: projectColor(project.id) }))}
        />
        <Field label="Due" type="date" required value={form.due} className="font-mono"
          onChange={(e) => setForm({ ...form, due: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-ink-soft">
        <input type="checkbox" checked={form.mine} onChange={(e) => setForm({ ...form, mine: e.target.checked })} />
        Assign to me
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={createTask.isPending || !form.title.trim()}>
          {createTask.isPending ? 'Adding...' : 'Add task'}
        </Button>
      </div>
    </form>
  );
}
