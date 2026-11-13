import { UserPlus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useRemoveMember } from '../../hooks/useProjects';
import { getErrorMessage } from '../../lib/errors';

// Who is on the project. Admins can invite people and remove anyone except the owner.
export default function TeamPanel({ project, isAdmin, currentUserId, onInvite }) {
  const removeMember = useRemoveMember(project.id);

  const remove = (member) => removeMember.mutate(member.id, {
    onSuccess: () => toast.success(`${member.user.full_name} was removed`),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not remove that member')),
  });

  return (
    <section className="rounded-card border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-semibold text-ink">Team</h2>
        {isAdmin && (
          <Button size="sm" variant="secondary" onClick={onInvite}>
            <UserPlus size={16} aria-hidden="true" />Invite
          </Button>
        )}
      </div>
      <ul>
        {project.members.map((member) => {
          const isOwner = member.user_id === project.created_by;
          const canRemove = isAdmin && !isOwner && member.user_id !== currentUserId;
          return (
            <li key={member.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-deep font-display text-ink">
                {member.user.first_name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{member.user.full_name}</span>
                <span className="block truncate text-xs text-ink-faint">{member.user.email}</span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{isOwner ? 'Owner' : member.role}</span>
              {canRemove && (
                <ConfirmDialog
                  trigger={<Button size="sm" variant="ghost" aria-label={`Remove ${member.user.full_name}`}>Remove</Button>}
                  title={`Remove ${member.user.first_name}?`}
                  description="They lose access to this project. Their tasks stay, assigned to them until someone reassigns them."
                  confirmLabel="Remove"
                  onConfirm={() => remove(member)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
