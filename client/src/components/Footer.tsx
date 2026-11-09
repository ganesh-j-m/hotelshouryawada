import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSite } from '../lib/site';
import { shortBranchName, telHref } from '../lib/format';
import { Logo, NAV } from './Header';
import { SocialIcons } from './Social';
import { Divider } from './Ornaments';

export function Footer() {
  const { site } = useSite();
  const s = site?.settings;
  const branches = site?.branches ?? [];
  const year = new Date().getFullYear();

  return (
    <footer className="pattern-ink relative text-cream/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-saffron-400/70 to-transparent" />
      <div className="container-x grid gap-12 py-16 sm:py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1.2fr]">
        <div>
          <Logo light />
          {s?.footerText && <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/70">{s.footerText}</p>}
          {s?.tagline && <p className="mt-4 text-lg font-medium text-saffron-300">{s.tagline}</p>}
          <div className="mt-6">
            <SocialIcons settings={s} light />
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-display text-lg text-cream">Explore</h2>
          <Divider className="mt-3 text-saffron-400" light />
          <ul className="mt-5 space-y-2.5 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="transition hover:text-saffron-300">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/reserve" className="transition hover:text-saffron-300">
                Reservation / Enquiry
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-lg text-cream">Our Branches</h2>
          <Divider className="mt-3 text-saffron-400" light />
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {branches.map((b) => (
              <li key={b.id}>
                <Link to={`/branches/${b.slug}`} className="transition hover:text-saffron-300">
                  {shortBranchName(b.name)}
                  {b.isMain && <span className="ml-1.5 text-[0.65rem] uppercase tracking-wider text-saffron-400">Main</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg text-cream">Get in Touch</h2>
          <Divider className="mt-3 text-saffron-400" light />
          <ul className="mt-5 space-y-4 text-sm">
            {s?.phone && (
              <li>
                <a href={telHref(s.phone)} className="flex items-start gap-3 transition hover:text-saffron-300">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" /> {s.phone}
                </a>
              </li>
            )}
            {s?.email && (
              <li>
                <a href={`mailto:${s.email}`} className="flex items-start gap-3 break-all transition hover:text-saffron-300">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" /> {s.email}
                </a>
              </li>
            )}
            <li>
              <Link to="/branches" className="flex items-start gap-3 transition hover:text-saffron-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
                {branches.length} branches across Maharashtra
              </Link>
            </li>
          </ul>
          <Link to="/contact" className="btn-outline-light btn-sm mt-6">
            Contact Our Team
          </Link>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream/55 sm:flex-row">
          <p>© {year} {s?.brandName || 'Hotel Shauryawada'}. All Rights Reserved.</p>
          <ul className="flex gap-5">
            <li>
              <Link to="/privacy" className="hover:text-saffron-300">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-saffron-300">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
