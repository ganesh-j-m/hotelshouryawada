import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, Flame, HeartHandshake, Users } from 'lucide-react';
import { useSite } from '../lib/site';
import { paragraphs } from '../lib/format';
import { Seo } from '../components/Seo';
import { PageHero, PageLoader, Photo, Reveal, SectionHeading } from '../components/ui';
import { Divider } from '../components/Ornaments';

const ICONS = [ChefHat, Flame, Users, HeartHandshake];

export default function About() {
  const { site, loading } = useSite();
  if (loading && !site) return <PageLoader />;
  const s = site?.settings;
  const branches = site?.branches ?? [];

  return (
    <>
      <Seo title="About Us" description={paragraphs(s?.aboutText)[0]?.slice(0, 160)} />
      <PageHero eyebrow="About Us" title={s?.aboutHeading || 'More Than a Meal — A Memorable Experience'}>
        {s?.tagline && <p className="mt-5 text-xl font-medium text-white">{s.tagline}</p>}
      </PageHero>

      <section className="section pattern-cream">
        <div className="container-x grid items-start gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Reveal className="mx-auto w-full max-w-md lg:sticky lg:top-28 lg:max-w-none">
            <Photo src={s?.aboutImageUrl} alt="Hotel Shauryawada" label="Our Wada" rounded="arch-mask" className="aspect-[4/5] w-full shadow-lift" />
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow">Our Philosophy</p>
              <h2 className="h-section mt-4">Hospitality at the heart of every visit</h2>
              <Divider className="mt-5" />
            </Reveal>
            {paragraphs(s?.aboutText).map((p, i) => (
              <Reveal key={i} delay={i * 80}>
                <p className="lead mt-6">{p}</p>
              </Reveal>
            ))}

            {s?.aboutHighlights && s.aboutHighlights.length > 0 && (
              <Reveal className="mt-10">
                <ul className="divide-y divide-ink-900/10 border-y border-ink-900/10">
                  {s.aboutHighlights.map((h) => (
                    <li key={h} className="flex items-center gap-4 py-4 font-display text-lg text-ink-700">
                      <span className="h-2.5 w-2.5 rotate-45 bg-saffron-400" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {branches.length > 0 && (
              <Reveal className="mt-10 rounded-2xl bg-ink-600 p-7 text-cream">
                <p className="font-display text-2xl">
                  Today, guests visit us at <span className="text-saffron-300">{branches.length} branches</span> across Maharashtra.
                </p>
                <Link to="/branches" className="btn-saffron btn-sm mt-5">
                  Find a Branch <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {s?.experienceItems && s.experienceItems.length > 0 && (
        <section className="section bg-cream-200">
          <div className="container-x">
            <SectionHeading eyebrow="What We Stand For" title={s.experienceHeading || 'Our Commitment to You'} />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {s.experienceItems.map((e, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <Reveal key={e.title} delay={i * 80} className="card p-7 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-600 text-saffron-300">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 font-display text-xl">{e.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal-400">{e.text}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
