import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import type { AdminRole, AdminUser } from '../../lib/types';
import { api, ApiError } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import { useAuth } from '../auth';
import { AField, LoadingRows, Modal, PageHeader, Toggle, errorText, useToast } from '../ui';
import { ErrorState } from '../../components/ui';

const ROLE_HELP: Record<AdminRole, string> = {
  OWNER: 'Full access, including staff accounts',
  ADMIN: 'All content and enquiries, can delete',
  EDITOR: 'Edit content and handle enquiries, cannot delete',
};

export default function UsersAdmin() {
  const toast = useToast();
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useFetch<AdminUser[]>('/api/admin/users');
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'EDITOR' as AdminRole, password: '', isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const open = (u: AdminUser | 'new') => {
    setErrors({});
    setEditing(u);
    setForm(u === 'new' ? { name: '', email: '', role: 'EDITOR', password: '', isActive: true } : { name: u.name, email: u.email, role: u.role, password: '', isActive: u.isActive ?? true });
  };

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      if (editing === 'new') await api.post('/api/admin/users', form);
      else if (editing) await api.patch(`/api/admin/users/${editing.id}`, { name: form.name, role: form.role, isActive: form.isActive, ...(form.password && { password: form.password }) });
      toast('success', 'Staff account saved.');
      setEditing(null);
      reload();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Staff Accounts" text="Give branch managers or staff their own login. Never share your owner password." actions={<button className="btn-ink btn-sm" onClick={() => open('new')}><Plus className="h-4 w-4" /> Add staff</button>} />
      <div className="card overflow-hidden">
        {loading && !data ? (
          <LoadingRows />
        ) : (
          <ul className="divide-y divide-ink-900/[0.07]">
            {(data ?? []).map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-600 font-display text-cream">{u.name.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{u.name} {u.id === me?.id && <span className="text-xs text-charcoal-300">(you)</span>}</p>
                  <p className="text-xs text-charcoal-400">{u.email} · last sign-in {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'}</p>
                </div>
                <span className="chip border-saffron-300 bg-saffron-50 text-saffron-700">{u.role.toLowerCase()}</span>
                {!u.isActive && <span className="chip border-ink-200 bg-ink-50 text-ink-500">disabled</span>}
                <button onClick={() => open(u)} className="rounded-lg p-2.5 text-charcoal-400 hover:bg-cream-200 hover:text-ink-600" aria-label={`Edit ${u.name}`}><Pencil className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add staff account' : 'Edit staff account'}
        size="max-w-lg"
        footer={<><button className="btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button><button className="btn-ink btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}
      >
        <div className="grid gap-5">
          <AField label="Name" error={errors.name}><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></AField>
          <AField label="Email" error={errors.email}><input className="input" type="email" value={form.email} disabled={editing !== 'new'} onChange={(e) => setForm({ ...form, email: e.target.value })} /></AField>
          <AField label="Role" hint={ROLE_HELP[form.role]}>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
          </AField>
          <AField label={editing === 'new' ? 'Password' : 'New password (leave empty to keep)'} hint="At least 10 characters with letters and numbers" error={errors.password}>
            <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </AField>
          {editing !== 'new' && <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Account active" />}
        </div>
      </Modal>
    </>
  );
}
