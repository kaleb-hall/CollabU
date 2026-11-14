import { Menu } from '@base-ui/react/menu';
import { Archive, ArrowCounterClockwise, Check, DotsThree, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useReopenProject, useSetArchived, useSetLocked, useUpdateMySettings } from '../../hooks/useProjects';
import { getErrorMessage } from '../../lib/errors';

// The "..." menu in the project header. Everyone can choose email updates;
// admins can also lock, archive and reopen.
export default function ProjectOptions({ project, me, isAdmin }) {
  const settings = useUpdateMySettings(project.id);
  const lock = useSetLocked(project.id);
  const archive = useSetArchived(project.id);
  const reopen = useReopenProject(project.id);

  const run = (mutation, value, done, failed) => mutation.mutate(value, {
    onSuccess: () => toast.success(done),
    onError: (error) => toast.error(getErrorMessage(error, failed)),
  });

  const emailOn = me?.email_updates ?? true;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Project options"
        className="inline-flex h-10 w-10 items-center justify-center rounded-card border border-line bg-card text-ink-soft hover:bg-paper-deep hover:text-ink"
      >
        <DotsThree size={20} weight="bold" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-50">
          <Menu.Popup className="min-w-60 rounded-card border border-line bg-card p-1 shadow-lift">
            <Menu.CheckboxItem
              checked={emailOn}
              onCheckedChange={(checked) => run(settings, { email_updates: checked },
                checked ? 'You will get emails about big updates' : 'No more emails about this project',
                'Could not change your email setting')}
              className={ITEM}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-ink-faint" aria-hidden="true">
                <Menu.CheckboxItemIndicator><Check size={12} weight="bold" /></Menu.CheckboxItemIndicator>
              </span>
              <span>
                <span className="block">Email me big updates</span>
                <span className="block text-xs text-ink-faint">When someone finishes all their tasks or the project is done</span>
              </span>
            </Menu.CheckboxItem>

            {isAdmin && (
              <>
                <Menu.Separator className="my-1 h-px bg-line" />
                {project.status === 'completed' && (
                  <Menu.Item className={ITEM} onClick={() => run(reopen, undefined, 'Project reopened', 'Could not reopen the project')}>
                    <ArrowCounterClockwise size={16} aria-hidden="true" />Reopen project
                  </Menu.Item>
                )}
                <Menu.Item
                  className={ITEM}
                  onClick={() => run(lock, !project.locked, project.locked ? 'Project unlocked' : 'Project locked', 'Could not change the lock')}
                >
                  {project.locked
                    ? <><LockSimpleOpen size={16} aria-hidden="true" />Unlock project</>
                    : <><LockSimple size={16} aria-hidden="true" />Lock project</>}
                </Menu.Item>
                <Menu.Item
                  className={ITEM}
                  onClick={() => run(archive, !project.archived_at,
                    project.archived_at ? 'Project brought back' : 'Project archived. Find it under Archived on Home.',
                    'Could not change the archive')}
                >
                  <Archive size={16} aria-hidden="true" />
                  {project.archived_at ? 'Unarchive project' : 'Archive project'}
                </Menu.Item>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const ITEM = 'flex cursor-pointer items-start gap-2.5 rounded-sm px-3 py-2 text-ink outline-none data-[highlighted]:bg-paper-deep [&>svg]:mt-0.5';
