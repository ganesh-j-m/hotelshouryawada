import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../auth';
import { AField, PageHeader, errorText, useToast } from '../ui';

export default function AccountAdmin() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setErrors({ confirm: 'Passwords do not match' });
    setSaving(true);
    setErrors({});
    try {
      await api.post('/api/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast('success', 'Password changed.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      toast('error', errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="My Account" text={`${user?.name} · ${user?.email}`} />
      <form onSubmit={submit} className="card grid max-w-lg gap-5 p-6 sm:p-8">
        <h2 className="font-display text-xl">Change password</h2>
        <AField label="Current password" error={errors.currentPassword}>
          <input className="input" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
        </AField>
        <AField label="New password" hint="At least 10 characters with letters and numbers" error={errors.newPassword}>
          <input className="input" type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
        </AField>
        <AField label="Confirm new password" error={errors.confirm}>
          <input className="input" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </AField>
        <div><button className="btn-ink" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button></div>
      </form>
    </>
  );
}
