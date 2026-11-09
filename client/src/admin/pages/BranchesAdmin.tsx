import { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Pencil, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import type { Branch } from '../../lib/types';
import { api, ApiError, mediaUrl } from '../../lib/api';
import { shortBranchName } from '../../lib/format';
import { useAuth } from '../auth';
import { AField, ConfirmDialog, Empty, ImageUpload, LoadingRows, Modal, PageHeader, Toggle, errorText, useToast } from '../ui';
import { ErrorState } from '../../components/ui';
import { ArchEmblem } from '../../components/Ornaments';

type Form = {
  name: string; slug: string; area: string; city: string; address: string; pincode: string; phone: string; whatsapp: string; email: string;
  openingHours: string; mapUrl: string; mapEmbedUrl: string; latitude: string; longitude: string; imageUrl: string | null; intro: string;
  menuNote: string; services: string; isMain: boolean; isVegOnly: boolean; isVerified: boolean; isPublished: boolean; sortOrder: string;
};

const EMPTY: Form = {
  name: 'Hotel Shauryawada — ', slug: '', area: '', city: '', address: '', pincode: '', phone: '', whatsapp: '', email: '', openingHours: '', mapUrl: '',
  mapEmbedUrl: '', latitude: '', longitude: '', imageUrl: null, intro: '', menuNote: '', services: '', isMain: false, isVegOnly: false,
  isVerified: false, isPublished: true, sortOrder: '0',
};

const toForm = (b: Branch): Form => ({
  name: b.name, slug: b.slug, area: b.area, city: b.city, address: b.address ?? '', pincode: b.pincode ?? '', phone: b.phone ?? '',
  whatsapp: b.whatsapp ?? '', email: b.email ?? '', openingHours: b.openingHours ?? '', mapUrl: b.mapUrl ?? '', mapEmbedUrl: b.mapEmbedUrl ?? '',
  latitude: b.latitude?.toString() ?? '', longitude: b.longitude?.toString() ?? '', imageUrl: b.imageUrl, intro: b.intro ?? '',
  menuNote: b.menuNote ?? '', services: b.services.join(', '), isMain: b.isMain, isVegOnly: b.isVegOnly, isVerified: b.isVerified,
  isPublished: b.isPublished, sortOrder: String(b.sortOrder),
});

export default function BranchesAdmin() {
  const toast = useToast();
  const { user } = useAuth();
  const canDelete = user?.role !== 'EDITOR';
  const { data, loading, error, reload } = useFetch<Branch[]>('/api/admin/branches');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Branch | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const list = useMemo(
    () => (data ?? []).filter((b) => !q || `${b.name} ${b.city}`.toLowerCase().includes(q.toLowerCase())),
    [data, q],
  );

  const open = (b: Branch | 'new') => {
    setEditing(b);
    setForm(b === 'new' ? EMPTY : toForm(b));
    setFieldErrors({});
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (k: keyof Form) => ({ value: form[k] as string, onChange: (e: { target: { value: string } }) => set(k, e.target.value as never) });

  async function save() {
    setSaving(true);
    setFieldErrors({});
    const payload = {
      ...form,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      sortOrder: Number(form.sortOrder) || 0,
      services: form.services.split(',').map((s) => s.trim()).filter(Boolean),
      slug: form.slug.trim() || undefined,
    };
    try {
      if (editing === 'new') await api.post('/api/admin/branches', payload);
      else if (editing) await api.put(`/api/admin/branches/${editing.id}`, payload);
      toast('success', 'Branch saved.');
      setEditing(null);
      reload();
    } catch (e) {
      if (e instanceof ApiError) setFieldErrors(e.fields);
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await api.del(`/api/admin/branches/${deleting.id}`);
      toast('success', 'Branch deleted.');
      setDeleting(null);
      reload();
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Branches"
        text="Manage branch details shown on the website. Only publish addresses and numbers you have confirmed."
        actions={<button className="btn-ink btn-sm" onClick={() => open('new')}><Plus className="h-4 w-4" /> Add branch</button>}
      />

      <div className="card overflow-hidden">
        <div className="border-b border-ink-900/10 p-4">
          <label className="relative block max-w-sm">
            <span className="sr-only">Search branches</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
            <input className="input py-2.5 pl-10 text-sm" placeholder="Search branches…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        {error ? (
          <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>
        ) : loading && !data ? (
          <LoadingRows />
        ) : list.length === 0 ? (
          <Empty text="No branches found." />
        ) : (
          <ul className="divide-y divide-ink-900/[0.07]">
            {list.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-600">
                  {b.imageUrl ? (
                    <img src={mediaUrl(b.imageUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-saffron-300"><ArchEmblem className="h-7 w-7" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-charcoal">
                    {shortBranchName(b.name)} <span className="text-sm font-normal text-charcoal-300">· {b.city}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {b.isMain && <span className="chip border-saffron-300 bg-saffron-50 text-saffron-700">Main</span>}
                    {b.isVegOnly && <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700">Veg</span>}
                    {b.isPublished ? <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700">Published</span> : <span className="chip border-charcoal-300/40 text-charcoal-400">Hidden</span>}
                    {b.isVerified ? (
                      <span className="chip border-sky-200 bg-sky-50 text-sky-700"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                    ) : (
                      <span className="chip border-saffron-300 bg-saffron-50 text-saffron-700"><ShieldAlert className="h-3 w-3" /> Needs verification</span>
                    )}
                    {!b.address && <span className="chip border-ink-200 bg-ink-50 text-ink-500">No address</span>}
                    {!b.phone && <span className="chip border-ink-200 bg-ink-50 text-ink-500">No phone</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <a href={`/branches/${b.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2.5 text-charcoal-400 hover:bg-cream-200 hover:text-ink-600" aria-label={`View ${b.name} on website`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button onClick={() => open(b)} className="rounded-lg p-2.5 text-charcoal-400 hover:bg-cream-200 hover:text-ink-600" aria-label={`Edit ${b.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button onClick={() => setDeleting(b)} className="rounded-lg p-2.5 text-charcoal-400 hover:bg-ink-50 hover:text-ink-500" aria-label={`Delete ${b.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add branch' : 'Edit branch'}
        size="max-w-3xl"
        footer={
          <>
            <button className="btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-ink btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save branch'}</button>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <AField label="Branch name *" className="sm:col-span-2" error={fieldErrors.name}><input className="input" {...text('name')} /></AField>
          <AField label="Area / locality *" error={fieldErrors.area}><input className="input" {...text('area')} placeholder="e.g. Wagholi" /></AField>
          <AField label="City / district *" error={fieldErrors.city}><input className="input" {...text('city')} placeholder="e.g. Pune" /></AField>
          <AField label="Full address" className="sm:col-span-2" error={fieldErrors.address}><textarea rows={2} className="input" {...text('address')} /></AField>
          <AField label="Pincode" error={fieldErrors.pincode}><input className="input" {...text('pincode')} inputMode="numeric" /></AField>
          <AField label="Phone" error={fieldErrors.phone}><input className="input" {...text('phone')} placeholder="+91 …" /></AField>
          <AField label="WhatsApp (optional)" error={fieldErrors.whatsapp}><input className="input" {...text('whatsapp')} /></AField>
          <AField label="Email (optional)" error={fieldErrors.email}><input className="input" type="email" {...text('email')} /></AField>
          <AField label="Opening hours" className="sm:col-span-2" hint="e.g. Mon–Sun, 11:00 AM – 11:00 PM" error={fieldErrors.openingHours}><input className="input" {...text('openingHours')} /></AField>
          <AField label="Google Maps link" className="sm:col-span-2" hint="Open the branch in Google Maps → Share → Copy link" error={fieldErrors.mapUrl}><input className="input" {...text('mapUrl')} /></AField>
          <AField label="Google Maps embed URL (optional)" className="sm:col-span-2" hint="Share → Embed a map → copy only the src=“…” URL" error={fieldErrors.mapEmbedUrl}><input className="input" {...text('mapEmbedUrl')} /></AField>
          <AField label="Latitude (optional)" error={fieldErrors.latitude}><input className="input" {...text('latitude')} inputMode="decimal" /></AField>
          <AField label="Longitude (optional)" error={fieldErrors.longitude}><input className="input" {...text('longitude')} inputMode="decimal" /></AField>
          <div className="sm:col-span-2"><ImageUpload kind="branch" label="Branch photo" value={form.imageUrl} onChange={(v) => set('imageUrl', v)} /></div>
          <AField label="Introduction" className="sm:col-span-2" error={fieldErrors.intro}><textarea rows={3} className="input" {...text('intro')} /></AField>
          <AField label="Menu note" className="sm:col-span-2" hint="Shown on the branch page, e.g. “Full non-veg menu available”" error={fieldErrors.menuNote}><input className="input" {...text('menuNote')} /></AField>
          <AField label="Services" className="sm:col-span-2" hint="Comma separated, only confirmed services — e.g. Dine-in, Family section, Parking"><input className="input" {...text('services')} /></AField>
          <AField label="URL slug" hint="Leave blank to generate automatically" error={fieldErrors.slug}><input className="input" {...text('slug')} /></AField>
          <AField label="Sort order" hint="Lower numbers appear first"><input className="input" type="number" {...text('sortOrder')} /></AField>
          <div className="grid gap-4 rounded-xl bg-cream-100 p-4 sm:col-span-2 sm:grid-cols-2">
            <Toggle checked={form.isPublished} onChange={(v) => set('isPublished', v)} label="Published" hint="Show this branch on the website" />
            <Toggle checked={form.isVerified} onChange={(v) => set('isVerified', v)} label="Details verified" hint="Address, phone & hours confirmed by the hotel" />
            <Toggle checked={form.isMain} onChange={(v) => set('isMain', v)} label="Main branch" />
            <Toggle checked={form.isVegOnly} onChange={(v) => set('isVegOnly', v)} label="Pure vegetarian branch" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete branch?"
        text={`“${deleting?.name}” will be removed from the website. Enquiries linked to it are kept but will no longer show a branch. This cannot be undone — consider hiding it instead.`}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        busy={busyDelete}
      />
    </>
  );
}
