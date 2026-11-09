import { useMemo, useState } from 'react';
import { EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { GALLERY_LABELS, type Branch, type GalleryCategory, type GalleryImage } from '../../lib/types';
import { api, ApiError, mediaUrl } from '../../lib/api';
import { shortBranchName } from '../../lib/format';
import { useAuth } from '../auth';
import { AField, ConfirmDialog, Empty, ImageUpload, LoadingRows, Modal, PageHeader, Toggle, errorText, useToast } from '../ui';
import { ErrorState } from '../../components/ui';

type Form = { imageUrl: string | null; caption: string; altText: string; category: GalleryCategory; branchId: string; isPublished: boolean; sortOrder: string };
const EMPTY: Form = { imageUrl: null, caption: '', altText: '', category: 'FOOD', branchId: '', isPublished: true, sortOrder: '0' };

export default function GalleryAdmin() {
  const toast = useToast();
  const { user } = useAuth();
  const canDelete = user?.role !== 'EDITOR';
  const { data, loading, error, reload } = useFetch<GalleryImage[]>('/api/admin/gallery');
  const branches = useFetch<Branch[]>('/api/admin/branches');
  const [filter, setFilter] = useState<'ALL' | GalleryCategory>('ALL');
  const [editing, setEditing] = useState<GalleryImage | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<GalleryImage | null>(null);
  const [busyDel, setBusyDel] = useState(false);

  const list = useMemo(() => (data ?? []).filter((i) => filter === 'ALL' || i.category === filter), [data, filter]);

  const open = (img: GalleryImage | 'new') => {
    setErrors({});
    setEditing(img);
    setForm(
      img === 'new'
        ? { ...EMPTY, category: filter === 'ALL' ? 'FOOD' : filter }
        : { imageUrl: img.imageUrl, caption: img.caption ?? '', altText: img.altText ?? '', category: img.category, branchId: img.branchId ?? '', isPublished: img.isPublished, sortOrder: String(img.sortOrder) },
    );
  };

  async function save() {
    if (!form.imageUrl) {
      setErrors({ imageUrl: 'Please upload an image' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) || 0, altText: form.altText || form.caption };
      if (editing === 'new') await api.post('/api/admin/gallery', payload);
      else if (editing) await api.put(`/api/admin/gallery/${editing.id}`, payload);
      toast('success', 'Gallery updated.');
      setEditing(null);
      reload();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!del) return;
    setBusyDel(true);
    try {
      await api.del(`/api/admin/gallery/${del.id}`);
      toast('success', 'Image deleted.');
      setDel(null);
      reload();
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusyDel(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Gallery"
        text="Upload genuine photos of your food, interiors and branches. Images are automatically resized and optimised."
        actions={<button className="btn-ink btn-sm" onClick={() => open('new')}><Plus className="h-4 w-4" /> Upload image</button>}
      />

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {(['ALL', ...Object.keys(GALLERY_LABELS)] as ('ALL' | GalleryCategory)[]).map((c) => (
          <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${filter === c ? 'border-ink-600 bg-ink-600 text-cream' : 'border-ink-900/15 bg-white hover:border-saffron-400'}`}>
            {c === 'ALL' ? 'All' : GALLERY_LABELS[c]}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="card"><LoadingRows /></div>
      ) : list.length === 0 ? (
        <div className="card">
          <Empty text="No images yet. Upload real photos of your restaurant and dishes." action={<button className="btn-ink btn-sm" onClick={() => open('new')}><Plus className="h-4 w-4" /> Upload image</button>} />
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {list.map((img) => (
            <li key={img.id} className="card group overflow-hidden">
              <div className="relative aspect-square bg-cream-200">
                <img src={mediaUrl(img.imageUrl)} alt={img.altText ?? ''} className="h-full w-full object-cover" loading="lazy" />
                {!img.isPublished && <span className="chip absolute left-2 top-2 border-white/0 bg-black/60 text-white"><EyeOff className="h-3 w-3" /> Hidden</span>}
                <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button onClick={() => open(img)} className="rounded-lg bg-white/90 p-2 text-charcoal hover:bg-white" aria-label="Edit image"><Pencil className="h-4 w-4" /></button>
                  {canDelete && <button onClick={() => setDel(img)} className="rounded-lg bg-white/90 p-2 text-ink-500 hover:bg-white" aria-label="Delete image"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm text-charcoal">{img.caption || <span className="text-charcoal-300">No caption</span>}</p>
                <p className="truncate text-xs text-charcoal-300">{GALLERY_LABELS[img.category]}{img.branch ? ` · ${shortBranchName(img.branch.name)}` : ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Upload image' : 'Edit image'}
        footer={<><button className="btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button><button className="btn-ink btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUpload kind="gallery" label="Image *" aspect="aspect-[4/3]" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} />
            {errors.imageUrl && <p className="mt-1 text-xs text-ink-500">{errors.imageUrl}</p>}
          </div>
          <AField label="Caption" className="sm:col-span-2" error={errors.caption}><input className="input" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></AField>
          <AField label="Alt text (for accessibility)" className="sm:col-span-2" hint="Describe the photo, e.g. “Mutton Raan served with bhakri”. Uses the caption if empty."><input className="input" value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} /></AField>
          <AField label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as GalleryCategory })}>
              {(Object.keys(GALLERY_LABELS) as GalleryCategory[]).map((c) => <option key={c} value={c}>{GALLERY_LABELS[c]}</option>)}
            </select>
          </AField>
          <AField label="Branch (optional)" hint="Also shows on that branch’s page">
            <select className="input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">— None —</option>
              {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{shortBranchName(b.name)}</option>)}
            </select>
          </AField>
          <AField label="Sort order"><input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></AField>
          <div className="flex items-end pb-2"><Toggle checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label="Published" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} title="Delete image?" text="This image will be permanently removed from the website and storage." onClose={() => setDel(null)} onConfirm={remove} busy={busyDel} />
    </>
  );
}
