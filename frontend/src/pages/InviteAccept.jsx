import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { toast } from 'sonner';
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

  const primary = 'inline-flex h-10 w-full items-center justify-center rounded-card bg-ink px-4 font-semibold text-paper hover:bg-ink-soft disabled:opacity-50';
  const secondary = 'inline-flex h-10 w-full items-center justify-center rounded-card border border-line bg-card px-4 font-semibold text-ink hover:bg-paper-deep';

  let title = 'You are invited';
  let body;
  if (inviteQuery.isPending) {
    body = <p className="text-ink-soft">Loading invite...</p>;
  } else if (inviteQuery.isError) {
    title = 'Invite not found';
    body = <p className="text-ink-soft">{getErrorMessage(inviteQuery.error)}</p>;
  } else if (invite.status === 'expired') {
    title = 'Invite expired';
    body = <p className="text-ink-soft">This invite has expired. Ask {invite.inviter_name} to send a new one.</p>;
  } else if (!user) {
    body = (
      <div className="space-y-4">
        <InviteSummary invite={invite} />
        <p className="text-ink-soft">
          {invite.has_account ? `Log in as ${invite.email} to join.` : `Create a free account with ${invite.email} to join.`}
        </p>
        <Link to={invite.has_account ? '/login' : '/register'} onClick={remember} className={primary}>
          {invite.has_account ? 'Log in to accept' : 'Create an account'}
        </Link>
        <Link to={invite.has_account ? '/register' : '/login'} onClick={remember} className="block text-center font-semibold text-ink-soft hover:text-ink">
          {invite.has_account ? 'Create an account instead' : 'I already have an account'}
        </Link>
      </div>
    );
  } else if (user.email.toLowerCase() !== invite.email) {
    body = (
      <div className="space-y-4">
        <InviteSummary invite={invite} />
        <p className="text-ink">This invite was sent to {invite.email}, but you are logged in as {user.email}.</p>
        <button type="button" onClick={() => { remember(); logout(); navigate('/login'); }} className={secondary}>
          Log out and switch account
        </button>
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        <InviteSummary invite={invite} />
        <button type="button" onClick={join} disabled={accept.isPending} className={primary}>
          {accept.isPending ? 'Joining...' : `Join ${invite.project_title}`}
        </button>
      </div>
    );
  }

  return <AuthLayout title={title}>{body}</AuthLayout>;
}

function InviteSummary({ invite }) {
  return (
    <p className="text-ink">
      {invite.inviter_name} invited you to <strong className="font-semibold">{invite.project_title}</strong> as a {invite.role}.
    </p>
  );
}
