import { useNavigate } from 'react-router-dom';
import { Dialog } from '@base-ui/react/dialog';
import { Command } from 'cmdk';
import { CalendarBlank, CheckSquareOffset, FolderSimplePlus, GearSix, House } from '@phosphor-icons/react';
import { useProjects } from '../../hooks/useProjects';
import { projectColor } from '../../lib/projectColor';

const ITEM = 'flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-ink data-[selected=true]:bg-paper-deep';
const GROUP = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-faint';

// Ctrl/Cmd+K: jump to a project or page, or start something new
export default function CommandMenu({ open, onOpenChange, onNewTask, onNewProject }) {
  const navigate = useNavigate();
  const projects = (useProjects().data ?? []).filter((project) => project.status === 'active');

  const run = (action) => {
    onOpenChange(false);
    action();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-[12vh] z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-card border border-line bg-card shadow-lift transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
          <Dialog.Title className="sr-only">Search and commands</Dialog.Title>
          <Command label="Search and commands" className={GROUP}>
            <Command.Input
              autoFocus
              placeholder="Search projects and actions"
              className="h-12 w-full border-b border-line bg-transparent px-4 text-base text-ink outline-none placeholder:text-ink-faint"
            />
            <Command.List className="max-h-80 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-6 text-center text-ink-soft">Nothing matches that.</Command.Empty>
              {projects.length > 0 && (
                <Command.Group heading="Projects">
                  {projects.map((project) => (
                    <Command.Item key={project.id} value={`project ${project.title}`} onSelect={() => run(() => navigate(`/projects/${project.id}`))} className={ITEM}>
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: projectColor(project.id) }} />
                      {project.title}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              <Command.Group heading="Create">
                <Command.Item value="new task" onSelect={() => run(onNewTask)} className={ITEM}>
                  <CheckSquareOffset size={18} aria-hidden="true" />New task
                </Command.Item>
                <Command.Item value="new project" onSelect={() => run(onNewProject)} className={ITEM}>
                  <FolderSimplePlus size={18} aria-hidden="true" />New project
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Go to">
                <Command.Item value="go home dashboard" onSelect={() => run(() => navigate('/dashboard'))} className={ITEM}>
                  <House size={18} aria-hidden="true" />Home
                </Command.Item>
                <Command.Item value="go calendar" onSelect={() => run(() => navigate('/calendar'))} className={ITEM}>
                  <CalendarBlank size={18} aria-hidden="true" />Calendar
                </Command.Item>
                <Command.Item value="go settings profile password" onSelect={() => run(() => navigate('/settings'))} className={ITEM}>
                  <GearSix size={18} aria-hidden="true" />Settings
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
