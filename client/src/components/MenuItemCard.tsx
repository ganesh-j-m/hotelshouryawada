import type { MenuItem } from '../lib/types';
import { formatPrice } from '../lib/format';
import { VegMark } from './Ornaments';
import { Photo } from './ui';

/** Printed-menu style row; shows a thumbnail when a photo has been uploaded. */
export function MenuItemRow({ item }: { item: MenuItem }) {
  return (
    <article className="group flex gap-4 py-5">
      {item.imageUrl && (
        <Photo src={item.imageUrl} alt={item.name} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" rounded="rounded-xl" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline">
          <VegMark type={item.dietType} className="mr-2.5 translate-y-[2px]" />
          <h3 className="font-display text-lg font-semibold text-ink-700 sm:text-xl">{item.name}</h3>
          <span className="leader" aria-hidden="true" />
          <span className={`shrink-0 font-display text-lg ${item.price === null ? 'text-sm italic text-charcoal-300' : 'font-semibold text-ink-600'}`}>
            {formatPrice(item.price, item.priceNote)}
          </span>
        </div>
        {item.description && <p className="mt-1.5 pl-[26px] text-sm leading-relaxed text-charcoal-400">{item.description}</p>}
        {item.isSpecial && (
          <p className="mt-2 pl-[26px]">
            <span className="chip border-saffron-400/50 bg-saffron-50 text-saffron-700">★ House Special</span>
          </p>
        )}
      </div>
    </article>
  );
}

/** Featured-dish card for the homepage. */
export function DishCard({ item }: { item: MenuItem }) {
  return (
    <article className="card card-hover group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Photo src={item.imageUrl} alt={item.name} label={item.name} rounded="rounded-none" className="h-full w-full transition duration-700 group-hover:scale-105" />
        {item.isSpecial && (
          <span className="chip absolute left-4 top-4 border-white/40 bg-saffron-600/90 text-white backdrop-blur">★ Signature</span>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <VegMark type={item.dietType} />
          <h3 className="font-display text-xl font-semibold">{item.name}</h3>
        </div>
        {item.description && <p className="mt-2 text-sm leading-relaxed text-charcoal-400">{item.description}</p>}
        <p className={`mt-4 font-display ${item.price === null ? 'text-sm italic text-charcoal-300' : 'text-lg font-semibold text-ink-600'}`}>
          {formatPrice(item.price, item.priceNote)}
        </p>
      </div>
    </article>
  );
}
