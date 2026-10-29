import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useChangePassword, useMe, useUpdateProfile } from '../hooks/useSettings';
import { getErrorMessage } from '../lib/errors';

export default function Settings() {
  const navigate = useNavigate();
  const me = useMe();

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <button type="button" onClick={() => navigate('/dashboard')} className="text-blue-600 font-medium">
          Back to dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        {me.isPending && <p className="text-gray-600">Loading your settings...</p>}
        {me.isError && <p className="text-red-600">{getErrorMessage(me.error)}</p>}
        {me.isSuccess && <ProfileForm user={me.data} />}
        <PasswordForm />
      </div>
    </div>
  );
}

function ProfileForm({ user }) {
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email_notifications: user.email_notifications,
  });
  const update = useUpdateProfile();

  const submit = (e) => {
    e.preventDefault();
    update.mutate(form, {
      onSuccess: () => toast.success('Profile saved'),
      onError: (error) => toast.error(getErrorMessage(error, 'Could not save your profile')),
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-4" aria-labelledby="profile-title">
      <h2 id="profile-title" className="text-xl font-bold text-gray-900">Profile</h2>
      <p className="text-sm text-gray-600">Signed in as {user.email}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
          <input id="first_name" required maxLength={50} className="input" value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
          <input id="last_name" required maxLength={50} className="input" value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm text-gray-700">
        <input type="checkbox" checked={form.email_notifications}
          onChange={(e) => setForm({ ...form, email_notifications: e.target.checked })} />
        Email me about invites and tasks due soon
      </label>
      <button type="submit" disabled={update.isPending} className="btn-primary disabled:opacity-50">
        {update.isPending ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}

const EMPTY_PASSWORDS = { current: '', next: '', again: '' };

function PasswordForm() {
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [problem, setProblem] = useState(null);
  const change = useChangePassword();

  const submit = (e) => {
    e.preventDefault();
    if (form.next !== form.again) {
      setProblem('The new passwords do not match');
      return;
    }
    setProblem(null);
    change.mutate({ currentPassword: form.current, newPassword: form.next }, {
      onSuccess: () => {
        setForm(EMPTY_PASSWORDS);
        toast.success('Password changed');
      },
      onError: (error) => setProblem(getErrorMessage(error, 'Could not change your password')),
    });
  };

  const field = (id, label, key, autoComplete) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input id={id} type="password" required autoComplete={autoComplete} className="input" value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <form onSubmit={submit} className="card space-y-4" aria-labelledby="password-title">
      <h2 id="password-title" className="text-xl font-bold text-gray-900">Password</h2>
      {field('current-password', 'Current password', 'current', 'current-password')}
      {field('new-password', 'New password', 'next', 'new-password')}
      {field('new-password-again', 'Type the new password again', 'again', 'new-password')}
      <p className="text-xs text-gray-500">At least 8 characters with an uppercase letter and a number.</p>
      {problem && <p role="alert" className="text-sm text-red-700">{problem}</p>}
      <button type="submit" disabled={change.isPending} className="btn-primary disabled:opacity-50">
        {change.isPending ? 'Changing...' : 'Change password'}
      </button>
    </form>
  );
}
