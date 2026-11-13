import { useState } from 'react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { useCancelInvite, useCreateInvite, useProjectInvites } from '../../hooks/useInvites';
import { getErrorMessage } from '../../lib/errors';

const ROLES = [
  { value: 'member', label: 'Member', help: 'Can view and update tasks' },
  { value: 'admin', label: 'Admin', help: 'Can manage the project, tasks and members' },
  { value: 'viewer', label: 'Viewer', help: 'Can only view the project' },
];

export default function InviteMemberModal({ projectId, open, onOpenChange }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Invite a teammate" description="They get an email with a link to join.">
      {open && <InviteForm projectId={projectId} />}
    </Modal>
  );
}

function InviteForm({ projectId }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const invites = useProjectInvites(projectId, true);
  const createInvite = useCreateInvite(projectId);
  const cancelInvite = useCancelInvite(projectId);

  const submit = (e) => {
    e.preventDefault();
    const address = email.trim();
    createInvite.mutate({ email: address, role }, {
      onSuccess: () => {
        toast.success(`Invite sent to ${address}`);
        setEmail('');
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not send the invite')),
    });
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field label="Email" type="email" required value={email} placeholder="classmate@school.edu"
            onChange={(e) => setEmail(e.target.value)} />
          <Select label="Role" value={role} onChange={setRole} options={ROLES} />
        </div>
        <p className="text-xs text-ink-faint">{ROLES.find((r) => r.value === role).help}</p>
        <div className="flex justify-end">
          <Button type="submit" disabled={createInvite.isPending}>
            {createInvite.isPending ? 'Sending...' : 'Send invite'}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Waiting to join</h3>
        {invites.isPending && <p className="mt-2 text-ink-soft">Loading...</p>}
        {invites.isSuccess && invites.data.length === 0 && <p className="mt-2 text-ink-soft">No pending invites.</p>}
        {invites.isSuccess && invites.data.length > 0 && (
          <ul className="mt-2">
            {invites.data.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between border-b border-line py-2 last:border-b-0">
                <span className="text-ink">{invite.email} <span className="text-ink-faint">({invite.role})</span></span>
                <button
                  type="button"
                  onClick={() => cancelInvite.mutate(invite.id, {
                    onError: (error) => toast.error(getErrorMessage(error, 'Could not cancel the invite')),
                  })}
                  aria-label={`Cancel invite for ${invite.email}`}
                  className="font-semibold text-ink-soft hover:text-accent"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
