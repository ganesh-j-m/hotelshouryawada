import Lenis from 'lenis';

/** Single Lenis instance for buttery inertia scrolling on the public site. */
let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (lenis || typeof window === 'undefined') return lenis;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    autoRaf: true,
  });
  return lenis;
}

export function destroySmoothScroll() {
  lenis?.destroy();
  lenis = null;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function scrollToEl(el: HTMLElement) {
  if (lenis) lenis.scrollTo(el, { offset: -90 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/** Pause page scrolling while a menu / lightbox is open. */
export function lockScroll(locked: boolean) {
  if (lenis) (locked ? lenis.stop() : lenis.start());
  document.body.style.overflow = locked ? 'hidden' : '';
}

export function onSmoothScroll(cb: (y: number) => void) {
  const handler = () => cb(window.scrollY);
  window.addEventListener('scroll', handler, { passive: true });
  handler();
  return () => window.removeEventListener('scroll', handler);
}
