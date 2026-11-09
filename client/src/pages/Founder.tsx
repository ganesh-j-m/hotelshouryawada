import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSite } from '../lib/site';
import { mediaUrl } from '../lib/api';
import { paragraphs } from '../lib/format';
import { Seo } from '../components/Seo';
import { PageLoader, Photo, Reveal } from '../components/ui';
import { Divider } from '../components/Ornaments';
import NotFound from './NotFound';

export default function Founder() {
  const { site, loading } = useSite();
  if (loading && !site) return <div className="pt-40"><PageLoader /></div>;
  const f = site?.founder;
  if (!f) return <NotFound />;

  return (
    <>
      <Seo title="A Message from Our Founder" description={`A personal message from ${f.name}, ${f.designation}.`} image={f.photoUrl} />

      <section className="pattern-saffron relative overflow-hidden pb-24 pt-36 text-white sm:pt-44">
        <div className="container-x relative grid items-start gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal className="mx-auto w-full max-w-sm lg:sticky lg:top-32">
            <div className="relative">
              <div className="absolute -inset-3 rounded-[999px_999px_1.75rem_1.75rem] border border-white/50" aria-hidden="true" />
              <Photo src={f.photoUrl} alt={`${f.name}, ${f.designation}`} label={f.nameLocal || f.name} rounded="arch-mask" className="relative aspect-[4/5] w-full shadow-2xl" eager />
            </div>
            <div className="mt-8 text-center">
              <p className="text-2xl font-semibold text-white">{f.name}</p>
              {f.nameLocal && <p className="mt-1 text-lg font-medium text-white/90">{f.nameLocal}</p>}
              <p className="mt-1 text-sm text-white/75">{f.designation}</p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="eyebrow text-white before:bg-white/80">Founder’s Message</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">{f.heading}</h1>
            <Divider className="mt-6 text-white" light />

            <div className="relative mt-10 rounded-3xl border border-saffron-400/25 bg-cream px-7 py-10 text-charcoal shadow-2xl sm:px-12 sm:py-14">
              <span className="absolute -top-7 left-8 font-display text-[6rem] leading-none text-saffron-400" aria-hidden="true">“</span>
              <div className="space-y-5 font-display text-[1.08rem] leading-[1.85] text-charcoal-600 sm:text-[1.15rem]">
                {paragraphs(f.message).map((p, i) => (
                  <p key={i} className={i === 0 ? 'text-xl text-ink-700' : ''}>
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-10 border-t border-saffron-400/30 pt-8">
                {f.signatureUrl ? (
                  <img src={mediaUrl(f.signatureUrl)} alt={`Signature of ${f.name}`} className="h-16 w-auto" />
                ) : (
                  <p className="text-3xl font-semibold italic text-saffron-700">{f.name}</p>
                )}
                <p className="mt-2 text-sm font-medium tracking-wide text-charcoal-400">{f.designation}</p>
              </div>
              {!f.isApproved && (
                <p className="mt-6 rounded-xl bg-cream-200 px-4 py-3 text-xs text-charcoal-400">
                  This message is a draft prepared for the founder’s review and will be updated once approved.
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/branches" className="btn-light">
                Visit Us <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/about" className="btn-outline-light">
                Our Story
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
