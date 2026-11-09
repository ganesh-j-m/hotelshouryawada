import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Phone, X } from 'lucide-react';
import { useSite } from '../lib/site';
import { mediaUrl } from '../lib/api';
import { telHref } from '../lib/format';
import { lockScroll } from '../lib/smooth';

export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/branches', label: 'Our Branches' },
  { to: '/menu', label: 'Menu' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/founder', label: 'Founder’s Message' },
  { to: '/contact', label: 'Contact' },
];

/** Brand logo (uploaded logo from settings, otherwise the official round logo) + name. */
export function Logo({ light = false, size = 'h-12 w-12', showText = true }: { light?: boolean; size?: string; showText?: boolean }) {
  const { site } = useSite();
  const s = site?.settings;
  const src = mediaUrl(s?.logoUrl) || '/logo.png';
  return (
    <span className="group flex items-center gap-3">
      <img
        src={src}
        alt={`${s?.brandName || 'Hotel Shauryawada'} logo`}
        width={96}
        height={96}
        className={`${size} shrink-0 rounded-full object-contain shadow-[0_6px_18px_-6px_rgba(53,24,12,0.55)] ring-2 transition duration-700 ease-out group-hover:rotate-[8deg] group-hover:scale-105 ${light ? 'ring-white/40' : 'ring-saffron-200'}`}
      />
      {showText && (
        <span className="leading-none">
          <span className={`block text-[1.05rem] font-semibold tracking-tight ${light ? 'text-white' : 'text-ink-700'}`}>
            {s?.brandName || 'Hotel Shauryawada'}
          </span>
          {s?.tagline && (
            <span className={`mt-1 block text-[0.75rem] font-medium ${light ? 'text-white/80' : 'text-saffron-700'}`}>{s.tagline}</span>
          )}
        </span>
      )}
    </span>
  );
}

export function Header() {
  const { site } = useSite();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const s = site?.settings;

  // Solid after a little scroll; slides away when scrolling down, returns when scrolling up
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrolled(y > 30);
        setHidden(y > 300 && y > lastY.current + 4);
        if (y < lastY.current - 4 || y < 300) setHidden(false);
        lastY.current = y;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    lockScroll(open);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const solid = scrolled || open;
  const reservationsOn = s?.reservationEnquiriesEnabled !== false;
  const cta = reservationsOn ? { to: '/reserve', label: s?.bookCtaText || 'Book a Table' } : { to: '/contact', label: 'Call to Reserve' };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-out ${
        solid ? 'bg-white/90 shadow-[0_10px_40px_-18px_rgba(53,24,12,0.35)] backdrop-blur-xl' : 'bg-transparent'
      } ${hidden && !open ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-saffron-500 focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div className={`container-x flex items-center justify-between transition-all duration-700 ease-out ${solid ? 'h-[74px]' : 'h-[92px]'}`}>
        <Link to="/" aria-label="Hotel Shauryawada — home">
          <Logo light={!solid} size={solid ? 'h-11 w-11' : 'h-14 w-14'} />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) =>
                    `group relative rounded-full px-3.5 py-2 text-[0.84rem] font-medium transition-colors duration-300 ${
                      solid
                        ? isActive ? 'text-saffron-700' : 'text-ink-700 hover:text-saffron-600'
                        : isActive ? 'text-white' : 'text-white/85 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {n.label}
                      <span
                        className={`absolute inset-x-3.5 -bottom-0.5 h-[2px] origin-left rounded-full transition-transform duration-500 ease-out ${
                          solid ? 'bg-saffron-500' : 'bg-white'
                        } ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {s?.phone && (
            <a
              href={telHref(s.phone)}
              className={`hidden h-10 w-10 items-center justify-center rounded-full transition duration-300 lg:flex ${solid ? 'text-ink-700 hover:bg-saffron-50 hover:text-saffron-600' : 'text-white hover:bg-white/15'}`}
              aria-label={`Call ${s.phone}`}
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
          <Link to={cta.to} className={`${solid ? 'btn-saffron' : 'btn-light'} btn-sm hidden sm:inline-flex`}>
            {cta.label}
          </Link>
          <button
            className={`flex h-11 w-11 items-center justify-center rounded-full transition xl:hidden ${solid ? 'text-ink-700 hover:bg-saffron-50' : 'text-white hover:bg-white/15'}`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className="relative h-6 w-6">
              <Menu className={`absolute inset-0 h-6 w-6 transition duration-300 ${open ? 'rotate-90 scale-50 opacity-0' : ''}`} />
              <X className={`absolute inset-0 h-6 w-6 transition duration-300 ${open ? '' : '-rotate-90 scale-50 opacity-0'}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        data-lenis-prevent
        className={`overflow-hidden transition-[max-height,opacity] duration-700 ease-out xl:hidden ${open ? 'max-h-[100dvh] opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!open}
      >
        <nav aria-label="Mobile" className="container-x max-h-[calc(100dvh-74px)] overflow-y-auto border-t border-saffron-100 pb-8 pt-4">
          <ul className="space-y-1">
            {NAV.map((n, i) => (
              <li
                key={n.to}
                style={{ transitionDelay: open ? `${80 + i * 45}ms` : '0ms' }}
                className={`transition-all duration-500 ease-out ${open ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
              >
                <NavLink
                  to={n.to}
                  end={n.to === '/'}
                  tabIndex={open ? 0 : -1}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium transition ${isActive ? 'bg-saffron-50 text-saffron-700' : 'text-ink-700 hover:bg-cream-200'}`
                  }
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to={cta.to} tabIndex={open ? 0 : -1} className="btn-saffron w-full">
              {cta.label}
            </Link>
            {s?.phone && (
              <a href={telHref(s.phone)} tabIndex={open ? 0 : -1} className="btn-outline w-full">
                <Phone className="h-4 w-4" /> Call {s.phone}
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
