import { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryImage } from '../lib/types';
import { mediaUrl } from '../lib/api';
import { lockScroll } from '../lib/smooth';

export function Lightbox({
  images,
  index,
  onClose,
  onChange,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const image = images[index];
  const prev = useCallback(() => onChange((index - 1 + images.length) % images.length), [index, images.length, onChange]);
  const next = useCallback(() => onChange((index + 1) % images.length), [index, images.length, onChange]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [onClose, prev, next]);

  // Basic swipe support
  const touchX = useRef<number | null>(null);

  if (!image) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-ink-900/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between p-4 text-cream/80">
        <span className="text-sm">
          {index + 1} / {images.length}
        </span>
        <button ref={closeRef} onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream/10" aria-label="Close image viewer">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16" onClick={(e) => e.stopPropagation()}>
        <img key={image.id} src={mediaUrl(image.imageUrl)} alt={image.altText || image.caption || 'Gallery image'} className="max-h-[78vh] max-w-full animate-fade-in rounded-lg object-contain shadow-2xl" />
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20 sm:left-4" aria-label="Previous image">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20 sm:right-4" aria-label="Next image">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      {(image.caption || image.branch) && (
        <p className="px-6 pb-8 text-center text-sm text-cream/80" onClick={(e) => e.stopPropagation()}>
          {image.caption}
          {image.branch && <span className="text-saffron-300"> · {image.branch.name}</span>}
        </p>
      )}
    </div>
  );
}
