import { useState } from 'react';
import { toast } from 'sonner';
import { BookOpenText, Code, FilmSlate, Flask, FileText, PresentationChart, Square, UsersThree } from '@phosphor-icons/react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { useCreateProject } from '../../hooks/useProjects';
import { fromInputValue } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { PROJECT_TEMPLATES } from '../../lib/projectTemplates';

const ICONS = {
  custom: Square,
  research_paper: FileText,
  software_project: Code,
  presentation: PresentationChart,
  group_project: UsersThree,
  lab_experiment: Flask,
  study_guide: BookOpenText,
  video_project: FilmSlate,
};

const EMPTY = { title: '', description: '', deadline: '' };

export default function NewProjectDialog({ open, onOpenChange }) {
  const [template, setTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const createProject = useCreateProject();

  const close = () => {
    onOpenChange(false);
    setTemplate(null);
    setForm(EMPTY);
  };

  const submit = (e) => {
    e.preventDefault();
    const suggested = template.id !== 'custom';
    createProject.mutate({
      ...form,
      deadline: fromInputValue(form.deadline),
      auto_generate_tasks: suggested,
      template: suggested ? template.id : null,
    }, {
      onSuccess: (data) => {
        toast.success(suggested ? `Project created with ${data.suggestions?.tasks_created ?? 0} suggested tasks` : 'Project created');
        close();
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not create the project')),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={template ? 'Project details' : 'New project'}
      description={template ? `Template: ${template.name}` : 'Pick a starting point. Templates add suggested tasks you can edit.'}
    >
      {!template ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROJECT_TEMPLATES.map((option) => {
            const Icon = ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTemplate(option)}
                className="flex items-start gap-3 rounded-card border border-line p-3 text-left transition-colors hover:border-ink-faint hover:bg-paper"
              >
                <Icon size={26} className="mt-0.5 shrink-0 text-ink-soft" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-ink">{option.name}</span>
                  <span className="block text-sm text-ink-soft">{option.description}</span>
                  {option.hours > 0 && <span className="mt-0.5 block font-mono text-xs text-ink-faint">about {option.hours}h of work</span>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required maxLength={200} value={form.title} placeholder="Final research paper"
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Field label="Description" as="textarea" rows={3} value={form.description}
            hint={template.id === 'custom' ? undefined : 'Words like "lab" or "slides" help us suggest better tasks.'}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Field label="Deadline" type="datetime-local" required value={form.deadline} className="font-mono"
            onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setTemplate(null)}>Back</Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create project'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
