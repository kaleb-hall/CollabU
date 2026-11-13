import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../lib/errors';
import { getPendingInvite } from '../lib/pendingInvite';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: getPendingInvite()?.email ?? '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      const pending = getPendingInvite();
      navigate(pending ? `/invite/${pending.token}` : '/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your account'));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Plan group projects around everyone's real schedule."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-ink underline underline-offset-4">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required maxLength={50} autoComplete="given-name" value={form.first_name} onChange={set('first_name')} />
          <Field label="Last name" required maxLength={50} autoComplete="family-name" value={form.last_name} onChange={set('last_name')} />
        </div>
        <Field label="Email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        <Field label="Password" type="password" required minLength={8} autoComplete="new-password" value={form.password}
          onChange={set('password')} hint="At least 8 characters, with an uppercase letter and a number." />
        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
