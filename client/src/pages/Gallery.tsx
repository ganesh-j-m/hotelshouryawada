import { useMemo, useState } from 'react';
import { Instagram } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { GALLERY_LABELS, type GalleryCategory, type GalleryImage } from '../lib/types';
import { useSite } from '../lib/site';
import { Seo } from '../components/Seo';
import { GalleryGrid } from '../components/GalleryGrid';
import { EmptyState, ErrorState, PageHero, PageLoader } from '../components/ui';

export default function Gallery() {
  const { site } = useSite();
  const { data, loading, error, reload } = useFetch<GalleryImage[]>('/api/public/gallery');
  const [cat, setCat] = useState<'ALL' | GalleryCategory>('ALL');
  const images = data ?? [];

  const available = useMemo(() => (Object.keys(GALLERY_LABELS) as GalleryCategory[]).filter((c) => images.some((i) => i.category === c)), [images]);
  const shown = cat === 'ALL' ? images : images.filter((i) => i.category === cat);
  const insta = site?.settings.instagramUrl;

  return (
    <>
      <Seo title="Gallery" description="Photos of Hotel Shauryawada — our food, ambience and branches." />
      <PageHero eyebrow="Gallery" title="Moments from Shauryawada" text="Our food, our wada and the guests who make it special." />

      <section className="section pt-12">
        <div className="container-x">
          {available.length > 1 && (
            <div className="no-scrollbar mb-10 flex gap-2 overflow-x-auto" role="group" aria-label="Filter gallery">
              {(['ALL', ...available] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                    cat === c ? 'border-ink-600 bg-ink-600 text-cream' : 'border-ink-900/15 text-charcoal-600 hover:border-saffron-400'
                  }`}
                >
                  {c === 'ALL' ? 'All' : GALLERY_LABELS[c]}
                </button>
              ))}
            </div>
          )}

          {loading && !data ? (
            <PageLoader />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : shown.length === 0 ? (
            <EmptyState
              title="Our gallery is coming soon"
              text="We’re adding photos of our dishes and branches. Meanwhile, see our latest posts on Instagram."
              action={
                insta && (
                  <a href={insta} target="_blank" rel="noopener noreferrer" className="btn-ink btn-sm">
                    <Instagram className="h-4 w-4" /> Visit our Instagram
                  </a>
                )
              }
            />
          ) : (
            <GalleryGrid key={cat} images={shown} />
          )}
        </div>
      </section>
    </>
  );
}
