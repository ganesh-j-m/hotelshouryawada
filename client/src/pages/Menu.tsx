import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import type { DietType, MenuCategory } from '../lib/types';
import { Seo } from '../components/Seo';
import { MenuItemRow } from '../components/MenuItemCard';
import { EmptyState, ErrorState, PageHero, PageLoader, Reveal } from '../components/ui';
import { Divider, VegMark } from '../components/Ornaments';

type DietFilter = 'ALL' | DietType;

export default function MenuPage() {
  const { data, loading, error, reload } = useFetch<MenuCategory[]>('/api/public/menu');
  const [active, setActive] = useState('all');
  const [q, setQ] = useState('');
  const [diet, setDiet] = useState<DietFilter>('ALL');

  const categories = data ?? [];
  const hasUnpriced = categories.some((c) => c.items?.some((i) => i.price === null));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return categories
      .filter((c) => active === 'all' || c.slug === active)
      .map((c) => ({
        ...c,
        items: (c.items ?? []).filter(
          (i) =>
            (diet === 'ALL' || i.dietType === diet) &&
            (!term || i.name.toLowerCase().includes(term) || (i.description ?? '').toLowerCase().includes(term)),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, active, q, diet]);

  useEffect(() => {
    if (active !== 'all' && categories.length && !categories.some((c) => c.slug === active)) setActive('all');
  }, [categories, active]);

  const clear = () => {
    setQ('');
    setDiet('ALL');
    setActive('all');
  };

  return (
    <>
      <Seo title="Menu" description="Explore the Hotel Shauryawada menu — famous Mutton & Chicken Raan, traditional thalis and fresh bhakri from the chul." />
      <PageHero eyebrow="Our Menu" title="From Our Chul to Your Table" text="Traditional Maharashtrian flavours, slow-cooked and served with care." />

      <div className="sticky top-[72px] z-30 border-b border-ink-900/10 bg-cream/95 backdrop-blur-md">
        <div className="container-x flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <nav aria-label="Menu categories" className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1">
            {[{ slug: 'all', name: 'All' }, ...categories].map((c) => (
              <button
                key={c.slug}
                onClick={() => setActive(c.slug)}
                aria-pressed={active === c.slug}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  active === c.slug ? 'bg-ink-600 text-cream' : 'text-charcoal-600 hover:bg-ink-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
              <span className="sr-only">Search dishes</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes…" className="input py-2.5 pl-10 text-sm" />
            </label>
            <div className="flex h-10 shrink-0 self-start overflow-hidden rounded-xl border sm:h-auto sm:self-auto border-ink-900/15 bg-white" role="group" aria-label="Filter by diet">
              {(['ALL', 'VEG', 'NON_VEG'] as DietFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDiet(d)}
                  aria-pressed={diet === d}
                  className={`flex items-center gap-1.5 px-3 text-xs font-medium transition ${diet === d ? 'bg-ink-600 text-cream' : 'text-charcoal-600 hover:bg-cream-200'}`}
                >
                  {d !== 'ALL' && <VegMark type={d} className="bg-white" />}
                  {d === 'ALL' ? 'All' : d === 'VEG' ? 'Veg' : 'Non-veg'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="section pattern-cream pt-12">
        <div className="container-x max-w-4xl">
          {loading && !data ? (
            <PageLoader />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : categories.length === 0 ? (
            <EmptyState title="Our menu is being updated" text="Please check back soon, or call your nearest branch." />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No dishes match your search"
              action={
                <button onClick={clear} className="btn-outline btn-sm">
                  <X className="h-4 w-4" /> Clear filters
                </button>
              }
            />
          ) : (
            <div className="space-y-16">
              {filtered.map((c) => (
                <Reveal as="section" key={c.id} className="card px-6 py-8 sm:px-10 sm:py-10">
                  <header className="text-center">
                    <h2 className="font-display text-3xl font-semibold">{c.name}</h2>
                    <Divider className="mt-4 justify-center" />
                    {c.description && <p className="mt-3 text-sm text-charcoal-400">{c.description}</p>}
                  </header>
                  <div className="mt-6 divide-y divide-ink-900/[0.08]">
                    {c.items.map((item) => (
                      <MenuItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {categories.length > 0 && (
            <div className="mt-12 space-y-2 text-center text-xs text-charcoal-400">
              <p className="flex flex-wrap items-center justify-center gap-4">
                <span className="flex items-center gap-1.5"><VegMark type="VEG" /> Vegetarian</span>
                <span className="flex items-center gap-1.5"><VegMark type="NON_VEG" /> Non-vegetarian</span>
              </p>
              {hasUnpriced && <p>Prices for some dishes vary by branch — please ask our staff.</p>}
              <p>Menu availability may differ between branches. <Link to="/branches" className="text-ink-600 underline-offset-2 hover:underline">Find a branch</Link>.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
