import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ChefHat, Flame, HeartHandshake, Instagram, MapPin, Phone, Users } from 'lucide-react';
import { useSite } from '../lib/site';
import { useFetch } from '../hooks/useFetch';
import type { GalleryImage, MenuCategory } from '../lib/types';
import { mediaUrl } from '../lib/api';
import { paragraphs, telHref } from '../lib/format';
import { onSmoothScroll } from '../lib/smooth';
import { Seo, SITE_URL } from '../components/Seo';
import { Divider, WadaGate } from '../components/Ornaments';
import { PageLoader, Photo, Reveal, SectionHeading } from '../components/ui';
import { BranchCard } from '../components/BranchCard';
import { DishCard } from '../components/MenuItemCard';
import { GalleryGrid } from '../components/GalleryGrid';
import { SocialIcons } from '../components/Social';

const EXPERIENCE_ICONS = [ChefHat, Flame, Users, HeartHandshake];

/** Counts up from 0 when it scrolls into view. */
function CountUp({ to, duration = 1600 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{n}</span>;
}

/** Gentle parallax for decorative hero elements. */
function useParallax(factor: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return onSmoothScroll((y) => {
      if (ref.current && y < window.innerHeight * 1.2) ref.current.style.transform = `translate3d(0, ${y * factor}px, 0)`;
    });
  }, [factor]);
  return ref;
}

export default function Home() {
  const { site, loading } = useSite();
  const menu = useFetch<MenuCategory[]>('/api/public/menu');
  const gallery = useFetch<GalleryImage[]>('/api/public/gallery');
  const logoLayer = useParallax(0.18);
  const gateLayer = useParallax(0.08);

  if (loading && !site) return <div className="pattern-saffron relative min-h-screen pt-40"><PageLoader /></div>;
  const s = site?.settings;
  const branches = site?.branches ?? [];
  const founder = site?.founder;
  const featured = (menu.data ?? []).flatMap((c) => c.items ?? []).filter((i) => i.isFeatured).slice(0, 3);
  const images = (gallery.data ?? []).slice(0, 8);
  const founderQuote = (() => {
    const p = paragraphs(founder?.message).find((x) => x.length > 60 && !/^dear/i.test(x)) ?? '';
    const first = p.split(/(?<=[.!?])\s/)[0] ?? p;
    return first.length > 180 ? `${first.slice(0, 177)}…` : first;
  })();
  const reservationsOn = s?.reservationEnquiriesEnabled !== false;
  const heroImg = mediaUrl(s?.heroImageUrl);

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: s?.brandName,
    alternateName: s?.brandNameLocal || undefined,
    url: SITE_URL || undefined,
    logo: SITE_URL ? `${SITE_URL}/logo.png` : undefined,
    servesCuisine: ['Maharashtrian', 'Indian'],
    sameAs: [s?.instagramUrl, s?.facebookUrl, s?.youtubeUrl].filter(Boolean),
    ...(founder?.name && { founder: { '@type': 'Person', name: founder.name } }),
  };

  return (
    <>
      <Seo jsonLd={orgLd} />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="pattern-saffron relative flex min-h-[100svh] items-center overflow-hidden text-white">
        {heroImg && (
          <>
            <img src={heroImg} alt="" className="absolute inset-0 h-full w-full scale-105 animate-[fade-in_1.2s_ease_both] object-cover" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-r from-saffron-800/95 via-saffron-700/75 to-saffron-600/30" />
          </>
        )}
        <div ref={gateLayer} className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block" aria-hidden="true">
          <WadaGate className="absolute bottom-0 right-[4%] h-[92%] text-white/20" />
        </div>

        <div className="container-x relative grid items-center gap-12 pb-24 pt-32 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-2xl">
            {s?.heroEyebrow && (
              <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur [animation-delay:100ms]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> {s.heroEyebrow}
              </p>
            )}
            <h1 className="mt-6 animate-fade-up text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white [animation-delay:220ms] sm:text-6xl lg:text-[3.9rem] xl:text-[4.2rem]">
              {s?.heroHeadline}
            </h1>
            <Divider className="mt-7 animate-fade-up text-white [animation-delay:320ms]" light />
            {s?.heroSubtext && (
              <p className="mt-7 max-w-xl animate-fade-up text-base leading-relaxed text-white/90 [animation-delay:420ms] sm:text-lg">{s.heroSubtext}</p>
            )}
            <div className="mt-10 flex animate-fade-up flex-wrap gap-3 [animation-delay:540ms]">
              <Link to="/menu" className="btn-light group">
                {s?.primaryCtaText || 'Explore Our Menu'} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link to="/branches" className="btn-outline-light">
                <MapPin className="h-4 w-4" /> {s?.secondaryCtaText || 'Find Our Branches'}
              </Link>
            </div>

            {branches.length > 0 && (
              <dl className="mt-14 grid max-w-xl animate-fade-up grid-cols-3 gap-3 [animation-delay:680ms]">
                {[
                  { k: 'Branches', v: <CountUp to={branches.length} /> },
                  { k: 'Cooked on', v: 'The Chul' },
                  { k: 'Famous for', v: 'Raan' },
                ].map((x) => (
                  <div key={x.k} className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-md transition sm:px-4 sm:py-4 duration-500 hover:-translate-y-1 hover:bg-white/15">
                    <dt className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-white/70 sm:text-[0.65rem]">{x.k}</dt>
                    <dd className="mt-1 text-base font-semibold leading-tight text-white sm:text-2xl">{x.v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Logo centrepiece */}
          <div ref={logoLayer} className="relative mx-auto hidden aspect-square w-full max-w-[25rem] lg:block">
            <div className="absolute inset-0 animate-[fade-in_1.4s_ease_both] rounded-full border border-dashed border-white/40 [animation-delay:300ms]">
              <div className="absolute inset-0 animate-spin-slow rounded-full">
                <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_20px_4px_rgba(255,255,255,0.7)]" />
              </div>
            </div>
            <div className="absolute inset-[9%] rounded-full bg-white/10 backdrop-blur-sm" />
            <img
              src={mediaUrl(s?.logoUrl) || '/logo.png'}
              alt={`${s?.brandName ?? 'Hotel Shauryawada'} logo`}
              className="absolute inset-[13%] h-[74%] w-[74%] animate-float rounded-full object-contain shadow-[0_40px_80px_-20px_rgba(53,24,12,0.75)] ring-4 ring-white/60"
            />
          </div>
        </div>

        <a href="#about" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/80 sm:flex" aria-label="Scroll to content">
          Scroll
          <span className="flex h-9 w-5 justify-center rounded-full border border-white/50 pt-1.5">
            <span className="h-2 w-1 animate-bounce rounded-full bg-white" />
          </span>
        </a>
      </section>

      {/* ── Branch marquee ────────────────────────────── */}
      {branches.length > 0 && (
        <div className="relative overflow-hidden bg-ink-800 py-4 text-white" aria-label="Our branches">
          <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
            {[0, 1].map((dup) => (
              <ul key={dup} className="flex shrink-0 items-center gap-10" aria-hidden={dup === 1}>
                {branches.map((b) => (
                  <li key={b.id} className="flex items-center gap-10 whitespace-nowrap text-sm font-medium tracking-wide">
                    <Link to={`/branches/${b.slug}`} tabIndex={dup ? -1 : 0} className="transition hover:text-saffron-300">
                      {b.area}
                      {b.isVegOnly && <span className="ml-1.5 text-xs text-emerald-300">Veg</span>}
                    </Link>
                    <span className="h-1.5 w-1.5 rotate-45 bg-saffron-400" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      {/* ── About preview ─────────────────────────────── */}
      <section id="about" className="section pattern-cream overflow-hidden">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal variant="left" className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-saffron-200/60 blur-2xl" aria-hidden="true" />
            <Photo src={s?.aboutImageUrl} alt="Inside Hotel Shauryawada" label="Our Wada" rounded="arch-mask" className="relative aspect-[4/5] w-full shadow-lift" />
            <div className="absolute -bottom-6 -right-2 hidden animate-float rounded-2xl border border-saffron-200 bg-white px-6 py-5 shadow-lift sm:block">
              <p className="text-2xl font-semibold text-saffron-600">{s?.tagline || 'बेत गावाकडचा'}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-ink-400">The village way</p>
            </div>
          </Reveal>
          <div>
            <SectionHeading align="left" eyebrow="About Us" title={s?.aboutHeading || 'More Than a Meal'} />
            <Reveal delay={100} variant="right">
              {paragraphs(s?.aboutText).slice(0, 2).map((p, i) => (
                <p key={i} className="lead mt-5">{p}</p>
              ))}
              {s?.aboutHighlights && s.aboutHighlights.length > 0 && (
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {s.aboutHighlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm text-charcoal-600 shadow-card transition duration-500 hover:-translate-y-0.5">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-saffron-500" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/about" className="btn-outline group mt-9">
                Our Story <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Signature dishes ──────────────────────────── */}
      {featured.length > 0 && (
        <section className="section bg-gradient-to-b from-saffron-50 to-cream">
          <div className="container-x">
            <SectionHeading eyebrow="Signature Dishes" title="The Taste Guests Travel For" text="Slow-cooked the traditional way, on the chul — our most loved dishes." />
            <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item, i) => (
                <Reveal key={item.id} delay={i * 120} variant="zoom">
                  <DishCard item={item} />
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-12 text-center">
              <Link to="/menu" className="btn-saffron group">
                View Full Menu <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}
      {menu.loading && !menu.data && <PageLoader />}

      {/* ── Experience ────────────────────────────────── */}
      {s?.experienceItems && s.experienceItems.length > 0 && (
        <section className="section pattern-ink text-cream">
          <div className="container-x">
            <SectionHeading light eyebrow="The Shauryawada Experience" title={s.experienceHeading || 'Hospitality That Makes Every Visit Special'} />
            <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {s.experienceItems.map((e, i) => {
                const Icon = EXPERIENCE_ICONS[i % EXPERIENCE_ICONS.length];
                return (
                  <Reveal
                    as="li"
                    key={e.title}
                    delay={i * 110}
                    className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur transition duration-700 ease-out hover:-translate-y-2 hover:border-saffron-400/60 hover:bg-white/[0.08]"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-300 text-white shadow-glow transition duration-700 group-hover:rotate-[-8deg] group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-6 text-xl text-white">{e.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-white/70">{e.text}</p>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ── Branches ──────────────────────────────────── */}
      {branches.length > 0 && (
        <section className="section">
          <div className="container-x">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading align="left" eyebrow="Our Branches" title={`${branches.length} Branches, One Family`} text="Find the Hotel Shauryawada nearest to you." />
              <Reveal>
                <Link to="/branches" className="btn-outline group">
                  All Branches <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Reveal>
            </div>
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {branches.slice(0, 3).map((b, i) => (
                <Reveal key={b.id} delay={i * 120}>
                  <BranchCard b={b} />
                </Reveal>
              ))}
            </div>
            {branches.length > 3 && (
              <Reveal className="mt-10">
                <ul className="flex flex-wrap justify-center gap-2.5">
                  {branches.slice(3).map((b) => (
                    <li key={b.id}>
                      <Link
                        to={`/branches/${b.slug}`}
                        className="chip border-saffron-200 bg-white px-4 py-2 text-sm text-ink-700 transition duration-300 hover:-translate-y-0.5 hover:border-saffron-500 hover:bg-saffron-500 hover:text-white"
                      >
                        <MapPin className="h-3.5 w-3.5" /> {b.area}
                        {b.isVegOnly && <span className="opacity-80">· Veg</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ── Founder preview ───────────────────────────── */}
      {founder && (
        <section className="section overflow-hidden bg-gradient-to-br from-saffron-50 via-cream to-saffron-100/60">
          <div className="container-x grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal variant="left" className="mx-auto w-full max-w-xs lg:max-w-sm">
              <Photo src={founder.photoUrl} alt={founder.name} label={founder.nameLocal || founder.name} rounded="arch-mask" className="aspect-[4/5] w-full shadow-lift" />
            </Reveal>
            <Reveal delay={120} variant="right">
              <p className="eyebrow">Founder’s Message</p>
              <blockquote className="relative mt-6 text-2xl font-medium italic leading-snug text-ink-700 sm:text-3xl">
                <span className="absolute -left-2 -top-8 text-7xl font-semibold not-italic leading-none text-saffron-300" aria-hidden="true">“</span>
                {founderQuote}
              </blockquote>
              <Divider className="mt-7 text-saffron-500" />
              <p className="mt-6 text-2xl font-semibold text-saffron-700">{founder.name}</p>
              {founder.nameLocal && <p className="text-base text-ink-500">{founder.nameLocal}</p>}
              <p className="mt-1 text-sm text-charcoal-400">{founder.designation}</p>
              {!founder.isApproved && <p className="mt-3 text-xs italic text-charcoal-300">Draft message — awaiting the founder’s approval.</p>}
              <Link to="/founder" className="btn-saffron group mt-8">
                Read the Full Message <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Gallery / social ──────────────────────────── */}
      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Gallery" title="A Glimpse of Shauryawada" text={images.length ? undefined : 'Follow us for the latest from our kitchens and branches.'} />
          {images.length > 0 ? (
            <div className="mt-12">
              <GalleryGrid images={images} />
              <Reveal className="mt-8 text-center">
                <Link to="/gallery" className="btn-outline">View Gallery <ArrowRight className="h-4 w-4" /></Link>
              </Reveal>
            </div>
          ) : (
            <Reveal className="mt-10 flex flex-col items-center gap-6">
              {s?.instagramUrl && (
                <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn-saffron">
                  <Instagram className="h-4 w-4" /> Follow on Instagram
                </a>
              )}
              <SocialIcons settings={s} />
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Visit CTA ─────────────────────────────────── */}
      <section className="pattern-saffron relative overflow-hidden py-20 text-white sm:py-28">
        <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 animate-spin-slow rounded-full opacity-[0.1]" />
        <div className="container-x relative flex flex-col items-center text-center">
          <Reveal variant="zoom">
            <p className="text-xl font-medium text-white/90">या, जेवायला!</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl">Plan Your Visit</h2>
            <p className="mx-auto mt-5 max-w-xl text-white/85">
              {reservationsOn ? 'Send us a table enquiry and our branch team will call you to confirm.' : 'Call your nearest branch to reserve a table.'}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {reservationsOn && (
                <Link to="/reserve" className="btn-light">
                  <CalendarCheck className="h-4 w-4" /> Reserve Your Table
                </Link>
              )}
              {s?.phone && (
                <a href={telHref(s.phone)} className="btn-outline-light">
                  <Phone className="h-4 w-4" /> {s.phone}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
