import { useState } from 'react';
import { Expand } from 'lucide-react';
import type { GalleryImage } from '../lib/types';
import { mediaUrl } from '../lib/api';
import { Lightbox } from './Lightbox';

export function GalleryGrid({ images, columns = 'columns-2 md:columns-3 lg:columns-4' }: { images: GalleryImage[]; columns?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul className={`${columns} gap-4 [&>li]:mb-4`}>
        {images.map((img, i) => (
          <li key={img.id} className="break-inside-avoid">
            <button
              onClick={() => setOpen(i)}
              className="group relative block w-full overflow-hidden rounded-2xl bg-cream-200 shadow-card"
              aria-label={`Open image${img.caption ? `: ${img.caption}` : ''}`}
            >
              <img
                src={mediaUrl(img.imageUrl)}
                alt={img.altText || img.caption || 'Hotel Shauryawada'}
                loading="lazy"
                decoding="async"
                className="w-full transition duration-700 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink-900/75 via-ink-900/0 to-transparent p-4 opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="flex w-full items-end justify-between gap-3 text-left text-sm text-cream">
                  <span>{img.caption}</span>
                  <Expand className="h-4 w-4 shrink-0 text-saffron-300" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox images={images} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
