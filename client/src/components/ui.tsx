import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, ImageIcon, Loader2 } from 'lucide-react';
import { mediaUrl } from '../lib/api';
import { Divider } from './Ornaments';

/** Fades children in when they scroll into view. */
export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  variant = 'up',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
  variant?: 'up' | 'left' | 'right' | 'zoom';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`reveal reveal-${variant} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = 'center',
  light = false,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: 'center' | 'left';
  light?: boolean;
}) {
  const center = align === 'center';
  return (
    <Reveal className={`${center ? 'mx-auto text-center' : ''} max-w-2xl`}>
      {eyebrow && <p className={`eyebrow ${light ? 'text-saffron-200 before:bg-saffron-300' : ''}`}>{eyebrow}</p>}
      <h2 className={`h-section mt-4 ${light ? 'text-white' : ''}`}>{title}</h2>
      <Divider className={`mt-5 ${center ? 'justify-center' : ''} ${light ? 'text-saffron-300' : 'text-saffron-400'}`} light={light} />
      {text && <p className={`mt-5 ${light ? 'text-cream/75' : 'lead'}`}>{text}</p>}
    </Reveal>
  );
}

/**
 * Shows an uploaded photo, or an elegant branded placeholder until the owner uploads one.
 * Placeholders are intentional — no stock photos are passed off as the hotel's own.
 */
export function Photo({
  src,
  alt,
  className = '',
  label,
  rounded = 'rounded-2xl',
  eager = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  label?: string;
  rounded?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={`object-cover ${rounded} ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`pattern-ink group/ph relative flex flex-col items-center justify-center overflow-hidden ${rounded} ${className}`}
    >
      <img src="/logo.png" alt="" aria-hidden="true" className="h-[34%] max-h-28 min-h-[56px] w-auto rounded-full opacity-95 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] transition duration-1000 ease-out group-hover/ph:rotate-6 group-hover/ph:scale-110" />
      {label && <span className="mt-4 px-4 text-center text-base font-semibold text-white">{label}</span>}
      <span className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.25em] text-saffron-300/80">Photo coming soon</span>
    </div>
  );
}

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-saffron-500 ${className}`} aria-hidden="true" />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <Spinner className="h-8 w-8" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center" role="alert">
      <AlertCircle className="h-8 w-8 text-ink-400" />
      <p className="text-charcoal-600">{message}</p>
      {onRetry && (
        <button className="btn-outline btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-saffron-400/50 bg-cream-100 p-10 text-center">
      <ImageIcon className="h-8 w-8 text-saffron-500" aria-hidden="true" />
      <p className="mt-4 font-display text-xl text-ink-700">{title}</p>
      {text && <p className="mt-2 text-sm text-charcoal-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="pattern-saffron relative overflow-hidden pb-16 pt-36 text-white sm:pb-24 sm:pt-44">
      <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 top-1/2 hidden h-[26rem] w-[26rem] -translate-y-1/2 animate-spin-slow rounded-full opacity-[0.12] mix-blend-luminosity md:block" />
      <div className="container-x relative">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow animate-fade-up text-white before:bg-white/80">{eyebrow}</p>}
          <h1 className="mt-4 animate-fade-up text-4xl font-semibold leading-[1.1] tracking-tight text-white [animation-delay:120ms] sm:text-5xl lg:text-[3.4rem]">{title}</h1>
          {text && <p className="mt-5 animate-fade-up text-base leading-relaxed text-white/85 [animation-delay:240ms] sm:text-lg">{text}</p>}
          <div className="animate-fade-up [animation-delay:340ms]">{children}</div>
        </div>
      </div>
      <svg className="absolute inset-x-0 -bottom-px h-10 w-full text-cream sm:h-14" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 60 V30 C240 0 480 0 720 26 C960 52 1200 52 1440 22 V60 Z" fill="currentColor" />
      </svg>
    </section>
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-ink-400" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-ink-500" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-charcoal-300">{hint}</p>
      ) : null}
    </div>
  );
}
