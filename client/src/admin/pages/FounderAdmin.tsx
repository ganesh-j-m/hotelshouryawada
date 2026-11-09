import { useEffect, useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import type { Founder } from '../../lib/types';
import { api, ApiError } from '../../lib/api';
import { AField, ImageUpload, LoadingRows, PageHeader, Toggle, errorText, useToast } from '../ui';
import { ErrorState } from '../../components/ui';

type Form = Omit<Founder, 'id' | 'updatedAt'>;
const EMPTY: Form = { name: '', nameLocal: '', designation: 'Founder', photoUrl: null, heading: 'A Message from Our Founder', message: '', signatureUrl: null, isPublished: true, isApproved: false };

export default function FounderAdmin() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch<Founder | null>('/api/admin/founder');
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      const { id: _id, updatedAt: _u, ...rest } = data;
      setForm({ ...rest, nameLocal: rest.nameLocal ?? '' });
    }
  }, [data]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      await api.put('/api/admin/founder', form);
      toast('success', 'Founder’s message saved.');
      reload();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <LoadingRows />;

  return (
    <>
      <PageHeader
        title="Founder’s Message"
        text="A personal message that builds trust with your guests."
        actions={<a href="/founder" target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><ExternalLink className="h-4 w-4" /> Preview</a>}
      />

      {!form.isApproved && (
        <p className="mb-6 flex items-start gap-3 rounded-2xl border border-saffron-300 bg-saffron-50 p-4 text-sm text-saffron-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          The current message is a draft. Please have the founder read and approve it, then turn on “Approved by founder” so the draft note disappears from the website.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="card space-y-6 p-6">
          <ImageUpload kind="founder" label="Founder photo" aspect="aspect-[4/5]" value={form.photoUrl} onChange={(v) => set('photoUrl', v)} />
          <ImageUpload kind="founder" label="Signature image (optional)" aspect="aspect-[3/1]" value={form.signatureUrl} onChange={(v) => set('signatureUrl', v)} />
          <p className="text-xs text-charcoal-300">Only use a real photograph of the founder, with their permission.</p>
        </div>
        <div className="card grid gap-5 p-6 sm:grid-cols-2">
          <AField label="Founder name *" error={errors.name}><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></AField>
          <AField label="Name in Marathi (optional)" error={errors.nameLocal}><input className="input font-marathi" value={form.nameLocal ?? ''} onChange={(e) => set('nameLocal', e.target.value)} /></AField>
          <AField label="Designation *" className="sm:col-span-2" error={errors.designation}><input className="input" value={form.designation} onChange={(e) => set('designation', e.target.value)} /></AField>
          <AField label="Heading *" className="sm:col-span-2" error={errors.heading}><input className="input" value={form.heading} onChange={(e) => set('heading', e.target.value)} /></AField>
          <AField label="Message *" className="sm:col-span-2" hint="Leave an empty line between paragraphs." error={errors.message}>
            <textarea rows={16} className="input font-display leading-relaxed" value={form.message} onChange={(e) => set('message', e.target.value)} />
          </AField>
          <div className="grid gap-4 rounded-xl bg-cream-100 p-4 sm:col-span-2 sm:grid-cols-2">
            <Toggle checked={form.isPublished} onChange={(v) => set('isPublished', v)} label="Show on website" hint="Hides the section and page when off" />
            <Toggle checked={form.isApproved} onChange={(v) => set('isApproved', v)} label="Approved by founder" hint="Removes the “draft” note" />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-ink" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save message'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
