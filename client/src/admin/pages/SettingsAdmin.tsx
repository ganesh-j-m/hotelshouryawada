import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import type { Settings } from '../../lib/types';
import { api, ApiError } from '../../lib/api';
import { useSite } from '../../lib/site';
import { AField, ImageUpload, LoadingRows, PageHeader, Toggle, errorText, useToast } from '../ui';
import { ErrorState } from '../../components/ui';

const TABS = ['Homepage', 'About', 'Contact & Social', 'Reservations', 'Footer & SEO'] as const;
type Tab = (typeof TABS)[number];

export default function SettingsAdmin() {
  const toast = useToast();
  const { reload: reloadSite } = useSite();
  const { data, loading, error, reload } = useFetch<Settings>('/api/admin/settings');
  const [s, setS] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Tab>('Homepage');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setS(data);
  }, [data]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if ((loading && !data) || !s) return <LoadingRows />;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => (x ? { ...x, [k]: v } : x));
  const t = (k: keyof Settings) => ({ value: (s[k] as string) ?? '', onChange: (e: { target: { value: string } }) => set(k, e.target.value as never) });

  async function save() {
    if (!s) return;
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...s,
        aboutHighlights: s.aboutHighlights.map((h) => h.trim()).filter(Boolean),
        experienceItems: s.experienceItems.filter((x) => x.title.trim() || x.text.trim()),
      };
      const saved = await api.put<Settings>('/api/admin/settings', payload);
      setS(saved);
      reloadSite();
      toast('success', 'Website content saved.');
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fields);
        const firstKey = Object.keys(e.fields)[0]?.split('.')[0];
        const tabFor: Record<string, Tab> = {
          aboutHeading: 'About', aboutText: 'About', aboutHighlights: 'About', experienceItems: 'About', experienceHeading: 'About',
          phone: 'Contact & Social', email: 'Contact & Social', whatsapp: 'Contact & Social', instagramUrl: 'Contact & Social', facebookUrl: 'Contact & Social', youtubeUrl: 'Contact & Social',
          reservationNote: 'Reservations', footerText: 'Footer & SEO', seoTitle: 'Footer & SEO', seoDescription: 'Footer & SEO',
        };
        if (firstKey && tabFor[firstKey]) setTab(tabFor[firstKey]);
      }
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Website Content"
        text="Edit the text, images, contact details and links shown across the website."
        actions={<button className="btn-ink btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>}
      />

      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card" role="tablist">
        {TABS.map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)} className={`shrink-0 rounded-lg px-4 py-2 text-sm ${tab === x ? 'bg-ink-600 text-cream' : 'text-charcoal-600 hover:bg-cream-200'}`}>
            {x}
          </button>
        ))}
      </div>

      <div className="card p-6 sm:p-8" role="tabpanel">
        {tab === 'Homepage' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <AField label="Brand name" error={errors.brandName}><input className="input" {...t('brandName')} /></AField>
            <AField label="Brand name in Marathi"><input className="input font-marathi" {...t('brandNameLocal')} /></AField>
            <AField label="Tagline" hint="e.g. बेत गावाकडचा"><input className="input font-marathi" {...t('tagline')} /></AField>
            <div className="sm:row-span-2"><ImageUpload kind="site" label="Logo (optional)" aspect="aspect-[3/1]" value={s.logoUrl || null} onChange={(v) => set('logoUrl', v ?? '')} /></div>
            <AField label="Hero small heading"><input className="input font-marathi" {...t('heroEyebrow')} /></AField>
            <AField label="Hero headline *" className="sm:col-span-2" error={errors.heroHeadline}><input className="input" {...t('heroHeadline')} /></AField>
            <AField label="Hero text" className="sm:col-span-2" error={errors.heroSubtext}><textarea rows={3} className="input" {...t('heroSubtext')} /></AField>
            <AField label="Primary button text"><input className="input" {...t('primaryCtaText')} /></AField>
            <AField label="Secondary button text"><input className="input" {...t('secondaryCtaText')} /></AField>
            <AField label="“Book a Table” button text"><input className="input" {...t('bookCtaText')} /></AField>
            <div className="sm:col-span-2"><ImageUpload kind="site" label="Hero background photo" value={s.heroImageUrl || null} onChange={(v) => set('heroImageUrl', v ?? '')} /></div>
            <p className="text-xs text-charcoal-300 sm:col-span-2">Without a hero photo, the website shows an elegant illustrated wada gateway. Use a wide, high-quality photo of your restaurant or signature dish.</p>
          </div>
        )}

        {tab === 'About' && (
          <div className="grid gap-5">
            <AField label="About heading" error={errors.aboutHeading}><input className="input" {...t('aboutHeading')} /></AField>
            <AField label="About text" hint="Leave an empty line between paragraphs." error={errors.aboutText}><textarea rows={8} className="input" {...t('aboutText')} /></AField>
            <ImageUpload kind="site" label="About image" aspect="aspect-[4/3] max-w-md" value={s.aboutImageUrl || null} onChange={(v) => set('aboutImageUrl', v ?? '')} />
            <ListEditor
              label="Highlights (short points)"
              items={s.aboutHighlights}
              onChange={(v) => set('aboutHighlights', v)}
              max={8}
            />
            <AField label="Experience section heading"><input className="input" {...t('experienceHeading')} /></AField>
            <div>
              <span className="label">Experience points</span>
              <div className="space-y-3">
                {s.experienceItems.map((it, i) => (
                  <div key={i} className="grid gap-2 rounded-xl border border-ink-900/10 p-3 sm:grid-cols-[1fr_2fr_auto]">
                    <input className="input" placeholder="Title" value={it.title} onChange={(e) => set('experienceItems', s.experienceItems.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                    <input className="input" placeholder="Short text" value={it.text} onChange={(e) => set('experienceItems', s.experienceItems.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                    <button className="rounded-lg p-2.5 text-charcoal-400 hover:bg-ink-50 hover:text-ink-500" onClick={() => set('experienceItems', s.experienceItems.filter((_, j) => j !== i))} aria-label="Remove point"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                {s.experienceItems.length < 6 && (
                  <button className="btn-outline btn-sm" onClick={() => set('experienceItems', [...s.experienceItems, { title: '', text: '' }])}><Plus className="h-4 w-4" /> Add point</button>
                )}
              </div>
              {errors['experienceItems.0.title'] && <p className="mt-1 text-xs text-ink-500">Each point needs a title.</p>}
            </div>
          </div>
        )}

        {tab === 'Contact & Social' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <AField label="Main phone number" error={errors.phone}><input className="input" {...t('phone')} /></AField>
            <AField label="Email address" error={errors.email}><input className="input" type="email" {...t('email')} /></AField>
            <AField label="WhatsApp number" hint="Only if officially used for enquiries — adds a WhatsApp button" error={errors.whatsapp}><input className="input" {...t('whatsapp')} /></AField>
            <AField label="General hours (optional)" error={errors.generalHours}><input className="input" {...t('generalHours')} /></AField>
            <AField label="Instagram URL" error={errors.instagramUrl}><input className="input" {...t('instagramUrl')} /></AField>
            <AField label="Facebook URL" error={errors.facebookUrl}><input className="input" {...t('facebookUrl')} /></AField>
            <AField label="YouTube URL" error={errors.youtubeUrl}><input className="input" {...t('youtubeUrl')} /></AField>
          </div>
        )}

        {tab === 'Reservations' && (
          <div className="grid gap-5">
            <Toggle
              checked={s.reservationEnquiriesEnabled}
              onChange={(v) => set('reservationEnquiriesEnabled', v)}
              label="Accept online table enquiries"
              hint="When off, the website shows “Call to Reserve” with branch phone numbers instead of the form."
            />
            <AField label="Note shown above the enquiry form" error={errors.reservationNote}><textarea rows={3} className="input" {...t('reservationNote')} /></AField>
          </div>
        )}

        {tab === 'Footer & SEO' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <AField label="Footer text" className="sm:col-span-2" error={errors.footerText}><textarea rows={3} className="input" {...t('footerText')} /></AField>
            <AField label={`Search title (${s.seoTitle.length}/70)`} className="sm:col-span-2" error={errors.seoTitle}><input className="input" maxLength={70} {...t('seoTitle')} /></AField>
            <AField label={`Search description (${s.seoDescription.length}/170)`} className="sm:col-span-2" error={errors.seoDescription}><textarea rows={3} maxLength={170} className="input" {...t('seoDescription')} /></AField>
            <div className="sm:col-span-2"><ImageUpload kind="site" label="Social sharing image (1200×630 recommended)" value={s.ogImageUrl || null} onChange={(v) => set('ogImageUrl', v ?? '')} /></div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button className="btn-ink" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </>
  );
}

function ListEditor({ label, items, onChange, max }: { label: string; items: string[]; onChange: (v: string[]) => void; max: number }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input className="input" value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button className="rounded-lg p-2.5 text-charcoal-400 hover:bg-ink-50 hover:text-ink-500" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {items.length < max && (
          <button className="btn-outline btn-sm" onClick={() => onChange([...items, ''])}><Plus className="h-4 w-4" /> Add</button>
        )}
      </div>
    </div>
  );
}
