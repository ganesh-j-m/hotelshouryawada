import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Clock, Mail, MapPin, MessageCircle, Navigation, Phone, UtensilsCrossed } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import type { Branch } from '../lib/types';
import { mediaUrl } from '../lib/api';
import { mapsSearchHref, paragraphs, shortBranchName, telHref, waHref } from '../lib/format';
import { useSite } from '../lib/site';
import { Seo, SITE_URL } from '../components/Seo';
import { BranchBadges } from '../components/BranchCard';
import { GalleryGrid } from '../components/GalleryGrid';
import { ErrorState, PageLoader, Photo, Reveal } from '../components/ui';
import { Divider } from '../components/Ornaments';
import NotFound from './NotFound';

export default function BranchDetail() {
  const { slug } = useParams();
  const { site } = useSite();
  const { data: b, loading, error, reload } = useFetch<Branch>(`/api/public/branches/${encodeURIComponent(slug ?? '')}`);

  if (loading && !b) return <div className="pt-40"><PageLoader /></div>;
  if (error === 'Branch not found') return <NotFound />;
  if (error || !b) return <div className="container-x pb-20 pt-40"><ErrorState message={error ?? 'Could not load branch.'} onRetry={reload} /></div>;

  const area = shortBranchName(b.name);
  const directions = b.mapUrl || mapsSearchHref(`Hotel Shauryawada ${b.area}`);
  const reservationsOn = site?.settings.reservationEnquiriesEnabled !== false;
  const heroImg = mediaUrl(b.imageUrl);

  // Structured data uses only details the owner has marked as verified
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: b.name,
    url: `${SITE_URL}/branches/${b.slug}`,
    servesCuisine: b.isVegOnly ? ['Maharashtrian', 'Vegetarian'] : ['Maharashtrian', 'Indian'],
    ...(b.isVerified && b.address && {
      address: { '@type': 'PostalAddress', streetAddress: b.address, addressLocality: b.city, postalCode: b.pincode ?? undefined, addressRegion: 'Maharashtra', addressCountry: 'IN' },
    }),
    ...(b.isVerified && b.phone && { telephone: b.phone }),
    ...(b.isVerified && b.latitude && b.longitude && { geo: { '@type': 'GeoCoordinates', latitude: b.latitude, longitude: b.longitude } }),
    ...(b.imageUrl && { image: heroImg }),
  };

  return (
    <>
      <Seo
        title={`${area} Branch`}
        description={b.intro?.slice(0, 160) || `Visit Hotel Shauryawada at ${b.area}, ${b.city}. Get directions, contact details and timings.`}
        image={b.imageUrl}
        jsonLd={ld}
      />

      <section className="relative flex min-h-[62vh] items-end overflow-hidden text-cream">
        {heroImg ? (
          <>
            <img src={heroImg} alt={`${b.name}`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-saffron-800/95 via-saffron-700/55 to-ink-900/30" />
          </>
        ) : (
          <div className="pattern-saffron absolute inset-0" />
        )}
        <div className="container-x relative pb-14 pt-36">
          <Link to="/branches" className="inline-flex items-center gap-2 text-sm text-cream/75 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All branches
          </Link>
          <div className="mt-6 animate-fade-up">
            <BranchBadges b={b} light />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.25em] text-white/80">{b.city}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-cream sm:text-6xl">{area}</h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-light">
                <Navigation className="h-4 w-4" /> Get Directions
              </a>
              {b.phone && (
                <a href={telHref(b.phone)} className="btn-outline-light">
                  <Phone className="h-4 w-4" /> Call Branch
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section pattern-cream">
        <div className="container-x grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Reveal>
              <p className="eyebrow">Welcome</p>
              <h2 className="h-section mt-4">Hotel Shauryawada, {area}</h2>
              <Divider className="mt-5" />
              {paragraphs(b.intro).length > 0 ? (
                paragraphs(b.intro).map((p, i) => <p key={i} className="lead mt-5">{p}</p>)
              ) : (
                <p className="lead mt-5">
                  Experience the warmth of Hotel Shauryawada at our {area} branch — the same signature flavours and heartfelt hospitality our guests love.
                </p>
              )}
            </Reveal>

            {b.services.length > 0 && (
              <Reveal className="mt-10">
                <h3 className="font-display text-xl">Services</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {b.services.map((s) => (
                    <li key={s} className="chip border-saffron-400/40 bg-white px-4 py-2 text-sm text-ink-600">{s}</li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal className="card mt-10 flex flex-col gap-5 p-7 sm:flex-row sm:items-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-600 text-saffron-300">
                <UtensilsCrossed className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <h3 className="font-display text-xl">Menu at this branch</h3>
                <p className="mt-1 text-sm text-charcoal-400">
                  {b.menuNote || (b.isVegOnly ? 'This is a pure vegetarian branch. Please ask staff for today’s vegetarian menu.' : 'Our signature dishes are served across branches. Availability may vary — please check with the branch.')}
                </p>
              </div>
              <Link to="/menu" className="btn-outline btn-sm shrink-0">View Menu</Link>
            </Reveal>

            {b.mapEmbedUrl && (
              <Reveal className="mt-10 overflow-hidden rounded-2xl shadow-card">
                <iframe
                  title={`Map showing ${b.name}`}
                  src={b.mapEmbedUrl}
                  className="h-80 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </Reveal>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Reveal className="card overflow-hidden">
              <div className="pattern-saffron relative px-7 py-6 text-white">
                <h2 className="relative text-2xl text-white">Visit Us</h2>
              </div>
              <ul className="space-y-5 p-7 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-saffron-500" />
                  <div>
                    <p className="font-medium text-charcoal">Address</p>
                    <p className="mt-0.5 text-charcoal-400">
                      {b.address ? `${b.address}${b.pincode ? ` – ${b.pincode}` : ''}` : 'Full address coming soon — use Get Directions to find us on Google Maps.'}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-saffron-500" />
                  <div>
                    <p className="font-medium text-charcoal">Opening hours</p>
                    <p className="mt-0.5 whitespace-pre-line text-charcoal-400">{b.openingHours || 'Please call the branch to confirm timings.'}</p>
                  </div>
                </li>
                {b.phone && (
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-saffron-500" />
                    <div>
                      <p className="font-medium text-charcoal">Phone</p>
                      <a href={telHref(b.phone)} className="mt-0.5 block text-ink-600 hover:underline">{b.phone}</a>
                    </div>
                  </li>
                )}
                {b.email && (
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-saffron-500" />
                    <div>
                      <p className="font-medium text-charcoal">Email</p>
                      <a href={`mailto:${b.email}`} className="mt-0.5 block break-all text-ink-600 hover:underline">{b.email}</a>
                    </div>
                  </li>
                )}
              </ul>
              <div className="grid gap-2 border-t border-ink-900/10 p-7">
                <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-ink w-full">
                  <Navigation className="h-4 w-4" /> Get Directions
                </a>
                {b.whatsapp && (
                  <a href={waHref(b.whatsapp, `Namaskar! I have an enquiry for Hotel Shauryawada ${area}.`)} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                {reservationsOn ? (
                  <Link to={`/reserve?branch=${b.slug}`} className="btn-saffron w-full">
                    <CalendarCheck className="h-4 w-4" /> Reserve a Table
                  </Link>
                ) : (
                  b.phone && (
                    <a href={telHref(b.phone)} className="btn-saffron w-full">
                      <Phone className="h-4 w-4" /> Call to Reserve
                    </a>
                  )
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <section className="section bg-cream-200 pt-16">
        <div className="container-x">
          <h2 className="h-section">Gallery</h2>
          <Divider className="mt-4" />
          {b.galleryImages && b.galleryImages.length > 0 ? (
            <div className="mt-10">
              <GalleryGrid images={b.galleryImages} columns="columns-2 md:columns-3" />
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Photo key={i} alt={`${area} photo placeholder`} className="aspect-[4/3] w-full" />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
