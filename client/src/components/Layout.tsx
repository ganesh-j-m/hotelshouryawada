import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useSite } from '../lib/site';
import { waHref } from '../lib/format';
import { destroySmoothScroll, initSmoothScroll, scrollToEl, scrollToTop } from '../lib/smooth';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    initSmoothScroll();
    return () => destroySmoothScroll();
  }, []);
  useEffect(() => {
    const el = hash ? document.getElementById(hash.slice(1)) : null;
    if (el) scrollToEl(el);
    else scrollToTop();
  }, [pathname, hash]);
  return null;
}

/** Thin saffron bar at the top showing reading progress. */
function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
      <div ref={bar} className="h-full origin-left bg-gradient-to-r from-saffron-600 via-saffron-400 to-saffron-200" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
}

export function Layout() {
  const { site } = useSite();
  const { pathname } = useLocation();
  const wa = waHref(site?.settings.whatsapp);
  return (
    <>
      <ScrollManager />
      <ScrollProgress />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Keyed wrapper → every route change fades & slides in */}
        <div key={pathname} className="animate-page">
          <Outlet />
        </div>
      </main>
      <Footer />
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp (opens in a new tab)"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition duration-500 hover:-translate-y-1 hover:scale-105"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.5s]" aria-hidden="true" />
          <MessageCircle className="relative h-7 w-7" />
        </a>
      )}
    </>
  );
}
