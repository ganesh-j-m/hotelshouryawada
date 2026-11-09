import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Info, Phone } from 'lucide-react';
import { useSite } from '../lib/site';
import { api, ApiError } from '../lib/api';
import { formatDate, formatTime12, shortBranchName, telHref } from '../lib/format';
import { Seo } from '../components/Seo';
import { Field, PageHero, PageLoader, Reveal, Spinner } from '../components/ui';

const TIMES = Array.from({ length: 25 }, (_, i) => {
  const mins = 11 * 60 + i * 30; // 11:00 → 23:00
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
});

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function validate(v: Record<string, string>) {
  const e: Record<string, string> = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name';
  if (!/^(\+?91)?[0-9]{10,11}$/.test(v.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid 10-digit phone number';
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Enter a valid email';
  if (!v.branchId) e.branchId = 'Please select a branch';
  if (!v.date) e.date = 'Please choose a date';
  if (!v.time) e.time = 'Please choose a time';
  const g = Number(v.guests);
  if (!Number.isInteger(g) || g < 1) e.guests = 'At least 1 guest';
  else if (g > 200) e.guests = 'For groups above 200 please call us';
  return e;
}

export default function Reserve() {
  const { site, loading } = useSite();
  const [params] = useSearchParams();
  const branches = site?.branches ?? [];
  const s = site?.settings;
  const preselect = branches.find((b) => b.slug === params.get('branch'))?.id ?? '';

  const today = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 120);
    return d;
  }, []);

  const [values, setValues] = useState({ name: '', phone: '', email: '', branchId: '', date: '', time: '', guests: '2', specialRequest: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<{ reference: string; branch: string } | null>(null);

  const branchId = values.branchId || preselect;
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: '' }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const payload = { ...values, branchId };
    const errs = validate(payload);
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setStatus('sending');
    try {
      const res = await api.post<{ reference: string; branch: string }>('/api/public/enquiries/reservation', { ...payload, guests: Number(payload.guests) });
      setResult(res);
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus('idle');
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setServerError(err.message);
      } else setServerError('Something went wrong. Please try again.');
    }
  }

  if (loading && !site) return <div className="pt-40"><PageLoader /></div>;
  const selectedBranch = branches.find((b) => b.id === branchId);
  const callNumber = selectedBranch?.phone || s?.phone;

  return (
    <>
      <Seo title="Reserve a Table" description="Send a table enquiry to Hotel Shauryawada. Our team will call you to confirm your visit." />
      <PageHero eyebrow="Reservation / Enquiry" title="Plan Your Visit" text="Tell us when you’d like to come, and our branch team will call you to confirm." />

      <section className="section pattern-cream pt-12">
        <div className="container-x grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {s?.reservationEnquiriesEnabled === false ? (
            <div className="card p-8 sm:p-10">
              <h2 className="font-display text-3xl">Call to Reserve</h2>
              <p className="mt-3 text-charcoal-400">Online table enquiries are currently paused. Please call your nearest branch directly.</p>
              <ul className="mt-8 divide-y divide-ink-900/10">
                {branches.filter((b) => b.phone).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 py-4">
                    <span className="font-display text-lg text-ink-700">{shortBranchName(b.name)}</span>
                    <a href={telHref(b.phone)} className="btn-outline btn-sm"><Phone className="h-3.5 w-3.5" /> {b.phone}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : status === 'done' && result ? (
            <div className="card p-8 text-center sm:p-12" role="status" aria-live="polite">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
              <h2 className="mt-5 font-display text-3xl">Enquiry Received</h2>
              <p className="mx-auto mt-3 max-w-md text-charcoal-400">
                Thank you, {values.name.split(' ')[0]}! Your table enquiry for <strong className="text-ink-700">{shortBranchName(result.branch)}</strong> on{' '}
                <strong className="text-ink-700">{formatDate(values.date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong> at{' '}
                <strong className="text-ink-700">{formatTime12(values.time)}</strong> has been sent.
              </p>
              <p className="mx-auto mt-6 inline-block rounded-xl bg-cream-200 px-5 py-3 text-sm">
                Reference: <span className="font-mono font-semibold tracking-wider text-ink-700">{result.reference}</span>
              </p>
              <p className="mx-auto mt-6 flex max-w-md items-start gap-2 text-left text-sm text-charcoal-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-saffron-600" />
                Your table is <strong>not confirmed yet</strong>. Our team will call you on {values.phone} to confirm availability.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/" className="btn-ink">Back to Home</Link>
                <button
                  className="btn-outline"
                  onClick={() => {
                    setStatus('idle');
                    setResult(null);
                    setValues((v) => ({ ...v, date: '', time: '', specialRequest: '' }));
                  }}
                >
                  Send another enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="card p-6 sm:p-10" aria-describedby="reserve-note">
              <h2 className="font-display text-3xl">Table Enquiry</h2>
              {s?.reservationNote && (
                <p id="reserve-note" className="mt-3 flex items-start gap-2 rounded-xl bg-saffron-50 px-4 py-3 text-sm text-saffron-700">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" /> {s.reservationNote}
                </p>
              )}

              {serverError && (
                <p className="mt-5 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600" role="alert">
                  {serverError}
                </p>
              )}

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field label="Your name" htmlFor="name" error={errors.name} required>
                  <input id="name" className={`input ${errors.name ? 'input-error' : ''}`} value={values.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
                </Field>
                <Field label="Phone number" htmlFor="phone" error={errors.phone} required>
                  <input id="phone" type="tel" inputMode="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={values.phone} onChange={set('phone')} autoComplete="tel" placeholder="98XXXXXXXX" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} />
                </Field>
                <Field label="Email (optional)" htmlFor="email" error={errors.email} className="sm:col-span-2">
                  <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={values.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
                </Field>
                <Field label="Branch" htmlFor="branchId" error={errors.branchId} required className="sm:col-span-2">
                  <select id="branchId" className={`input ${errors.branchId ? 'input-error' : ''}`} value={branchId} onChange={set('branchId')} aria-invalid={!!errors.branchId}>
                    <option value="">Select a branch…</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {shortBranchName(b.name)} — {b.city}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Date" htmlFor="date" error={errors.date} required>
                  <input id="date" type="date" className={`input ${errors.date ? 'input-error' : ''}`} min={isoDate(today)} max={isoDate(maxDate)} value={values.date} onChange={set('date')} aria-invalid={!!errors.date} />
                </Field>
                <Field label="Time" htmlFor="time" error={errors.time} required hint="Please confirm timings with the branch">
                  <select id="time" className={`input ${errors.time ? 'input-error' : ''}`} value={values.time} onChange={set('time')} aria-invalid={!!errors.time}>
                    <option value="">Select time…</option>
                    {TIMES.map((t) => (
                      <option key={t} value={t}>{formatTime12(t)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Number of guests" htmlFor="guests" error={errors.guests} required>
                  <input id="guests" type="number" min={1} max={200} inputMode="numeric" className={`input ${errors.guests ? 'input-error' : ''}`} value={values.guests} onChange={set('guests')} aria-invalid={!!errors.guests} />
                </Field>
                <Field label="Special request (optional)" htmlFor="specialRequest" className="sm:col-span-2" hint="Birthday, family section, large group, dietary needs…">
                  <textarea id="specialRequest" rows={3} maxLength={600} className="input resize-y" value={values.specialRequest} onChange={set('specialRequest')} />
                </Field>
                {/* Honeypot for bots — hidden from people and screen readers */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
                </div>
              </div>

              <button type="submit" className="btn-saffron mt-8 w-full sm:w-auto" disabled={status === 'sending'}>
                {status === 'sending' ? <Spinner className="h-4 w-4 text-ink-700" /> : <CalendarCheck className="h-4 w-4" />}
                {status === 'sending' ? 'Sending…' : 'Send Table Enquiry'}
              </button>
              <p className="mt-4 text-xs text-charcoal-300">
                By sending this enquiry you agree to be contacted about your visit. See our <Link to="/privacy" className="underline">Privacy Policy</Link>.
              </p>
            </form>
          )}

          <aside className="space-y-6">
            <Reveal className="pattern-saffron relative overflow-hidden rounded-2xl p-8 text-white">
              <h2 className="relative text-2xl text-white">Prefer to call?</h2>
              <p className="relative mt-2 text-sm text-white/85">
                {selectedBranch ? `Speak to our ${shortBranchName(selectedBranch.name)} team.` : 'Our team will be happy to help.'}
              </p>
              {callNumber ? (
                <a href={telHref(callNumber)} className="btn-light relative mt-6 w-full">
                  <Phone className="h-4 w-4" /> {callNumber}
                </a>
              ) : (
                <Link to="/contact" className="btn-light relative mt-6 w-full">Contact Our Team</Link>
              )}
            </Reveal>
            <Reveal className="card p-8">
              <h3 className="font-display text-xl">How it works</h3>
              <ol className="mt-4 space-y-4 text-sm text-charcoal-600">
                {['Send your enquiry with date, time and guests.', 'The branch team reviews availability.', 'We call you to confirm your table.'].map((t, i) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-xs font-semibold text-saffron-700">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
