import { useState } from 'react';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import Field from '../components/ui/Field';
import Skeleton from '../components/ui/Skeleton';
import { useChangePassword, useMe, useUpdateProfile } from '../hooks/useSettings';
import { getErrorMessage } from '../lib/errors';

export default function Settings() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}

function SettingsPage() {
  const me = useMe();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl text-ink">Settings</h1>
      <div className="space-y-6">
        {me.isPending && <Skeleton className="h-64" />}
        {me.isError && <ErrorState title="Could not load your settings" error={me.error} onRetry={me.refetch} />}
        {me.isSuccess && <ProfileForm user={me.data} />}
        <PasswordForm />
      </div>
    </div>
  );
}

function Section({ title, description, children, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="rounded-card border border-line bg-card">
      <div className="border-b border-line px-5 py-3">
        <h2 className="font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-ink-soft">{description}</p>}
      </div>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </form>
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
    <Section title="Profile" description={`Signed in as ${user.email}`} onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required maxLength={50} value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <Field label="Last name" required maxLength={50} value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      </div>
      <div className="flex items-start gap-3">
        <input id="email-notifications" type="checkbox" className="mt-0.5" aria-describedby="email-notifications-hint"
          checked={form.email_notifications} onChange={(e) => setForm({ ...form, email_notifications: e.target.checked })} />
        <div>
          <label htmlFor="email-notifications" className="block font-medium text-ink">Email me about invites and tasks due soon</label>
          <p id="email-notifications-hint" className="text-xs text-ink-faint">One digest a day at most. In-app notifications always stay on.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save profile'}</Button>
      </div>
    </Section>
  );
}

const EMPTY_PASSWORDS = { current: '', next: '', again: '' };

function PasswordForm() {
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [problem, setProblem] = useState(null);
  const change = useChangePassword();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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

  return (
    <Section title="Password" description="At least 8 characters with an uppercase letter and a number." onSubmit={submit}>
      <Field label="Current password" type="password" required autoComplete="current-password" value={form.current} onChange={set('current')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" type="password" required autoComplete="new-password" value={form.next} onChange={set('next')} />
        <Field label="Type the new password again" type="password" required autoComplete="new-password" value={form.again} onChange={set('again')} />
      </div>
      {problem && <p role="alert" className="font-medium text-accent">{problem}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={change.isPending}>{change.isPending ? 'Changing...' : 'Change password'}</Button>
      </div>
    </Section>
  );
}
