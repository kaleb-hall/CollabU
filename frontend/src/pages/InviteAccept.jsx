import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useAcceptInvite, useInvite } from '../hooks/useInvites';
import { getErrorMessage } from '../lib/errors';
import { clearPendingInvite, savePendingInvite } from '../lib/pendingInvite';

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const inviteQuery = useInvite(token);
  const accept = useAcceptInvite(token);
  const invite = inviteQuery.data;

  const join = () => {
    accept.mutate(undefined, {
      onSuccess: ({ project_id }) => {
        clearPendingInvite();
        toast.success(`You joined ${invite.project_title}`);
        navigate(`/projects/${project_id}`);
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not accept the invite')),
    });
  };

  const remember = () => savePendingInvite({ token, email: invite.email });

  let body;
  if (inviteQuery.isPending) {
    body = <p className="text-gray-600">Loading invite...</p>;
  } else if (inviteQuery.isError) {
    body = <p className="text-gray-900">{getErrorMessage(inviteQuery.error)}</p>;
  } else if (invite.status === 'expired') {
    body = <p className="text-gray-900">This invite has expired. Ask {invite.inviter_name} to send a new one.</p>;
  } else if (!user) {
    body = (
      <>
        <InviteSummary invite={invite} />
        <p className="text-sm text-gray-600">
          {invite.has_account
            ? `Log in as ${invite.email} to join.`
            : `Create a free account with ${invite.email} to join.`}
        </p>
        <div className="flex flex-col gap-2">
          <Link to={invite.has_account ? '/login' : '/register'} onClick={remember} className="btn-primary text-center">
            {invite.has_account ? 'Log in to accept' : 'Create an account'}
          </Link>
          <Link to={invite.has_account ? '/register' : '/login'} onClick={remember} className="text-sm text-blue-600 text-center">
            {invite.has_account ? 'Create an account instead' : 'I already have an account'}
          </Link>
        </div>
      </>
    );
  } else if (user.email.toLowerCase() !== invite.email) {
    body = (
      <>
        <InviteSummary invite={invite} />
        <p className="text-gray-900">
          This invite was sent to {invite.email}, but you are logged in as {user.email}.
        </p>
        <button type="button" onClick={() => { remember(); logout(); navigate('/login'); }} className="btn-secondary">
          Log out and switch account
        </button>
      </>
    );
  } else {
    body = (
      <>
        <InviteSummary invite={invite} />
        <button type="button" onClick={join} disabled={accept.isPending} className="btn-primary">
          {accept.isPending ? 'Joining...' : `Join ${invite.project_title}`}
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">CollabU invite</h1>
        {body}
      </div>
    </div>
  );
}

function InviteSummary({ invite }) {
  return (
    <p className="text-gray-900">
      {invite.inviter_name} invited you to <strong>{invite.project_title}</strong> as a {invite.role}.
    </p>
  );
}
