import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSite } from '../lib/site';
import { Seo } from '../components/Seo';
import { BranchCard } from '../components/BranchCard';
import { EmptyState, ErrorState, PageHero, PageLoader, Reveal } from '../components/ui';

export default function Branches() {
  const { site, loading, error, reload } = useSite();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('All');
  const branches = site?.branches ?? [];

  const cities = useMemo(() => ['All', ...Array.from(new Set(branches.map((b) => b.city)))], [branches]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return branches.filter(
      (b) =>
        (city === 'All' || b.city === city) &&
        (!term || [b.name, b.area, b.city, b.address ?? '', b.pincode ?? ''].some((v) => v.toLowerCase().includes(term))),
    );
  }, [branches, q, city]);

  return (
    <>
      <Seo title="Our Branches" description={`Find Hotel Shauryawada near you — ${branches.length} branches across Maharashtra including ${branches.slice(0, 4).map((b) => b.area).join(', ')}.`} />
      <PageHero
        eyebrow="Our Branches"
        title="Find a Shauryawada Near You"
        text={branches.length ? `${branches.length} branches across Maharashtra, all serving the same warm hospitality.` : undefined}
      />

      <section className="section pt-12 sm:pt-14">
        <div className="container-x">
          <div className="card flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search by city or area</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by city, area or pincode…"
                className="input pl-11"
              />
            </label>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Filter by city">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  aria-pressed={city === c}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                    city === c ? 'border-ink-600 bg-ink-600 text-cream' : 'border-ink-900/15 text-charcoal-600 hover:border-saffron-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm text-charcoal-400" aria-live="polite">
            Showing {filtered.length} of {branches.length} branches
          </p>

          {loading && !site ? (
            <PageLoader />
          ) : error ? (
            <div className="mt-10"><ErrorState message={error} onRetry={reload} /></div>
          ) : filtered.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title="No branch found"
                text="Try a different city or area name."
                action={
                  <button className="btn-outline btn-sm" onClick={() => { setQ(''); setCity('All'); }}>
                    <X className="h-4 w-4" /> Clear filters
                  </button>
                }
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b, i) => (
                <Reveal key={b.id} delay={(i % 3) * 80}>
                  <BranchCard b={b} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
