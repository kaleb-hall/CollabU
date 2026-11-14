import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../lib/errors';
import { getPendingInvite } from '../lib/pendingInvite';

export default function Login() {
  const [email, setEmail] = useState(() => getPendingInvite()?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      const pending = getPendingInvite();
      navigate(pending ? `/invite/${pending.token}` : '/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not log in'));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Pick up where your group left off."
      footer={<>New here? <Link to="/register" className="font-semibold text-ink underline underline-offset-4">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" required autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
