import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, MapPin, Navigation, Phone, Send } from 'lucide-react';
import { useSite } from '../lib/site';
import { api, ApiError } from '../lib/api';
import { mapsSearchHref, shortBranchName, telHref } from '../lib/format';
import { Seo } from '../components/Seo';
import { SocialIcons } from '../components/Social';
import { Field, PageHero, PageLoader, Reveal, Spinner } from '../components/ui';
import { Divider } from '../components/Ornaments';

const EMPTY = { name: '', phone: '', email: '', subject: '', message: '', branchId: '', website: '' };

export default function Contact() {
  const { site, loading } = useSite();
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [serverError, setServerError] = useState('');

  if (loading && !site) return <div className="pt-40"><PageLoader /></div>;
  const s = site?.settings;
  const branches = site?.branches ?? [];

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setV((x) => ({ ...x, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: '' }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (v.name.trim().length < 2) errs.name = 'Please enter your name';
    if (!v.phone && !v.email) errs.phone = 'Please give a phone number or an email so we can reply';
    if (v.phone && !/^(\+?91)?[0-9]{10,11}$/.test(v.phone.replace(/[\s-]/g, ''))) errs.phone = 'Enter a valid 10-digit phone number';
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errs.email = 'Enter a valid email';
    if (v.subject.trim().length < 2) errs.subject = 'Please add a subject';
    if (v.message.trim().length < 5) errs.message = 'Please write a short message';
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) {
      document.getElementById(`c-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setStatus('sending');
    try {
      await api.post('/api/public/enquiries/contact', v);
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setServerError(err.message);
      } else setServerError('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <Seo title="Contact Us" description="Contact Hotel Shauryawada — phone, branch addresses, directions and enquiry form." />
      <PageHero eyebrow="Contact Us" title="We’d Love to Hear from You" text="Questions, group bookings or feedback — our team is here to help." />

      <section className="section pattern-cream pt-12">
        <div className="container-x">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s?.phone && (
              <Reveal className="card flex items-start gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-600 text-saffron-300"><Phone className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-saffron-600">Call us</p>
                  <a href={telHref(s.phone)} className="mt-1 block font-display text-xl text-ink-700 hover:text-ink-500">{s.phone}</a>
                  {s.generalHours && <p className="mt-1 text-xs text-charcoal-400">{s.generalHours}</p>}
                </div>
              </Reveal>
            )}
            {s?.email && (
              <Reveal delay={80} className="card flex items-start gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-600 text-saffron-300"><Mail className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-saffron-600">Email us</p>
                  <a href={`mailto:${s.email}`} className="mt-1 block break-all font-display text-lg text-ink-700 hover:text-ink-500">{s.email}</a>
                </div>
              </Reveal>
            )}
            <Reveal delay={160} className="card flex items-start gap-4 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-600 text-saffron-300"><MapPin className="h-5 w-5" /></span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-saffron-600">Follow us</p>
                <div className="mt-2"><SocialIcons settings={s} /></div>
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_1fr] [&>*]:min-w-0">
            {status === 'done' ? (
              <div className="card flex flex-col items-center justify-center p-10 text-center" role="status" aria-live="polite">
                <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                <h2 className="mt-5 font-display text-3xl">Message Sent</h2>
                <p className="mt-3 max-w-sm text-charcoal-400">Thank you for reaching out. Our team will get back to you soon.</p>
                <button className="btn-outline mt-8" onClick={() => { setV(EMPTY); setStatus('idle'); }}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="card p-6 sm:p-10">
                <h2 className="font-display text-3xl">Send a Message</h2>
                <Divider className="mt-4" />
                {serverError && (
                  <p className="mt-5 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600" role="alert">{serverError}</p>
                )}
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="c-name" error={errors.name} required className="sm:col-span-2">
                    <input id="c-name" className={`input ${errors.name ? 'input-error' : ''}`} value={v.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
                  </Field>
                  <Field label="Phone" htmlFor="c-phone" error={errors.phone} hint="Phone or email required">
                    <input id="c-phone" type="tel" inputMode="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={v.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!errors.phone} />
                  </Field>
                  <Field label="Email" htmlFor="c-email" error={errors.email}>
                    <input id="c-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={v.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
                  </Field>
                  <Field label="Subject" htmlFor="c-subject" error={errors.subject} required>
                    <input id="c-subject" className={`input ${errors.subject ? 'input-error' : ''}`} value={v.subject} onChange={set('subject')} aria-invalid={!!errors.subject} />
                  </Field>
                  <Field label="Branch (optional)" htmlFor="c-branchId">
                    <select id="c-branchId" className="input" value={v.branchId} onChange={set('branchId')}>
                      <option value="">General enquiry</option>
                      {branches.map((b) => <option key={b.id} value={b.id}>{shortBranchName(b.name)}</option>)}
                    </select>
                  </Field>
                  <Field label="Message" htmlFor="c-message" error={errors.message} required className="sm:col-span-2">
                    <textarea id="c-message" rows={5} maxLength={2000} className={`input resize-y ${errors.message ? 'input-error' : ''}`} value={v.message} onChange={set('message')} aria-invalid={!!errors.message} />
                  </Field>
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} />
                  </div>
                </div>
                <button type="submit" className="btn-ink mt-8" disabled={status === 'sending'}>
                  {status === 'sending' ? <Spinner className="h-4 w-4 text-cream" /> : <Send className="h-4 w-4" />}
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
                <p className="mt-4 text-xs text-charcoal-300">We use your details only to reply. See our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
              </form>
            )}

            <div>
              <h2 className="font-display text-3xl">Branch Directory</h2>
              <Divider className="mt-4" />
              <ul className="mt-6 divide-y divide-ink-900/10 rounded-2xl border border-ink-900/10 bg-white">
                {branches.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <Link to={`/branches/${b.slug}`} className="font-display text-lg text-ink-700 hover:text-ink-500">
                        {shortBranchName(b.name)}
                      </Link>
                      <p className="truncate text-xs text-charcoal-400">{b.address || b.city}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {b.phone && (
                        <a href={telHref(b.phone)} className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-600/20 text-ink-600 hover:bg-ink-600 hover:text-cream" aria-label={`Call ${shortBranchName(b.name)}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      <a href={b.mapUrl || mapsSearchHref(`Hotel Shauryawada ${b.area}`)} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-600/20 text-ink-600 hover:bg-ink-600 hover:text-cream" aria-label={`Directions to ${shortBranchName(b.name)}`}>
                        <Navigation className="h-4 w-4" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
