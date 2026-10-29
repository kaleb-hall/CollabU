import { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useCancelInvite, useCreateInvite, useProjectInvites } from '../hooks/useInvites';
import { getErrorMessage } from '../lib/errors';

const ROLE_HELP = {
  admin: 'Can manage the project, tasks and members',
  member: 'Can view and update tasks',
  viewer: 'Can only view the project',
};

export default function InviteMemberModal({ projectId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const invites = useProjectInvites(projectId, true);
  const createInvite = useCreateInvite(projectId);
  const cancelInvite = useCancelInvite(projectId);

  const submit = (e) => {
    e.preventDefault();
    createInvite.mutate({ email: email.trim(), role }, {
      onSuccess: () => {
        toast.success(`Invite sent to ${email.trim()}`);
        setEmail('');
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not send the invite')),
    });
  };

  const cancel = (invite) => {
    cancelInvite.mutate(invite.id, {
      onError: (error) => toast.error(getErrorMessage(error, 'Could not cancel the invite')),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 id="invite-title" className="text-2xl font-bold text-gray-900">Invite a teammate</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="classmate@school.edu"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} className="input">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{ROLE_HELP[role]}</p>
          </div>
          <button type="submit" disabled={createInvite.isPending} className="btn-primary w-full disabled:opacity-50">
            {createInvite.isPending ? 'Sending...' : 'Send invite'}
          </button>
        </form>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Waiting to join</h3>
          {invites.isPending && <p className="text-sm text-gray-500">Loading...</p>}
          {invites.isSuccess && invites.data.length === 0 && (
            <p className="text-sm text-gray-500">No pending invites.</p>
          )}
          {invites.isSuccess && invites.data.length > 0 && (
            <ul className="divide-y border rounded-lg">
              {invites.data.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    <span className="text-gray-900">{invite.email}</span>
                    <span className="text-gray-500 capitalize"> ({invite.role})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => cancel(invite)}
                    aria-label={`Cancel invite for ${invite.email}`}
                    className="text-gray-500 hover:text-red-600"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
