import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSite } from '../lib/site';
import { mediaUrl } from '../lib/api';

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

export function Seo({
  title,
  description,
  image,
  noindex,
  jsonLd,
}: {
  title?: string;
  description?: string;
  image?: string | null;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}) {
  const { site } = useSite();
  const { pathname } = useLocation();
  const s = site?.settings;
  const brand = s?.brandName || 'Hotel Shauryawada';
  const fullTitle = title ? `${title} | ${brand}` : s?.seoTitle || brand;
  const desc = description || s?.seoDescription || '';
  const img = mediaUrl(image || s?.ogImageUrl) || `${SITE_URL}/og-image.png`;
  const absImg = img.startsWith('http') ? img : `${SITE_URL}${img}`;
  const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={absImg} />
      <meta name="twitter:title" content={fullTitle} />
      {desc && <meta name="twitter:description" content={desc} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

export { SITE_URL };
