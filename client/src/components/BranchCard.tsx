import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Navigation, Phone } from 'lucide-react';
import type { BranchSummary } from '../lib/types';
import { mapsSearchHref, shortBranchName, telHref } from '../lib/format';
import { Photo } from './ui';

export function BranchBadges({ b, light = false }: { b: BranchSummary; light?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {b.isMain && (
        <span className={`chip ${light ? 'border-saffron-300/50 bg-saffron-400/15 text-saffron-200' : 'border-saffron-400/50 bg-saffron-50 text-saffron-700'}`}>
          Main Branch
        </span>
      )}
      {b.isVegOnly && <span className="chip border-emerald-700/25 bg-emerald-50 text-emerald-800">Pure Veg</span>}
    </div>
  );
}

export function BranchCard({ b }: { b: BranchSummary }) {
  const area = shortBranchName(b.name);
  const directions = b.mapUrl || mapsSearchHref(`Hotel Shauryawada ${b.area}`);
  return (
    <article className="card card-hover group flex h-full flex-col overflow-hidden">
      <Link to={`/branches/${b.slug}`} className="relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden="true">
        <Photo
          src={b.imageUrl}
          alt={`${b.name} exterior`}
          label={area}
          rounded="rounded-none"
          className="h-full w-full transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute left-4 top-4">
          <BranchBadges b={b} light />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron-700">{b.city}</p>
        <h3 className="mt-1.5 font-display text-2xl font-semibold">
          <Link to={`/branches/${b.slug}`} className="hover:text-ink-500">
            {area}
          </Link>
        </h3>

        <ul className="mt-4 space-y-2.5 text-sm text-charcoal-600">
          <li className="flex gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" aria-hidden="true" />
            {b.address ? (
              <span>
                {b.address}
                {b.pincode ? ` – ${b.pincode}` : ''}
              </span>
            ) : (
              <span className="text-charcoal-300">Full address coming soon</span>
            )}
          </li>
          <li className="flex gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" aria-hidden="true" />
            <span className={b.openingHours ? '' : 'text-charcoal-300'}>{b.openingHours || 'Please call to confirm timings'}</span>
          </li>
          {b.phone && (
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" aria-hidden="true" />
              <a href={telHref(b.phone)} className="hover:text-ink-500">
                {b.phone}
              </a>
            </li>
          )}
        </ul>

        {b.services.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Services">
            {b.services.map((s) => (
              <li key={s} className="rounded-full bg-cream-200 px-2.5 py-1 text-[0.7rem] text-charcoal-600">
                {s}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-saffron btn-sm" aria-label={`Get directions to ${area} (opens Google Maps)`}>
            <Navigation className="h-3.5 w-3.5" /> Directions
          </a>
          {b.phone && (
            <a href={telHref(b.phone)} className="btn-outline btn-sm" aria-label={`Call ${area} branch`}>
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          )}
          <Link to={`/branches/${b.slug}`} className="btn btn-sm px-3 text-ink-600 hover:text-ink-400" aria-label={`View details for ${area}`}>
            Details <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
