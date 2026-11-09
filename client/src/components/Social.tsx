import { Facebook, Instagram, MessageCircle, Youtube } from 'lucide-react';
import type { Settings } from '../lib/types';
import { waHref } from '../lib/format';

export function socialLinks(s?: Settings | null) {
  if (!s) return [];
  return [
    s.instagramUrl && { href: s.instagramUrl, label: 'Instagram', Icon: Instagram },
    s.facebookUrl && { href: s.facebookUrl, label: 'Facebook', Icon: Facebook },
    s.youtubeUrl && { href: s.youtubeUrl, label: 'YouTube', Icon: Youtube },
    s.whatsapp && { href: waHref(s.whatsapp)!, label: 'WhatsApp', Icon: MessageCircle },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Instagram }[];
}

export function SocialIcons({ settings, light = false }: { settings?: Settings | null; light?: boolean }) {
  const links = socialLinks(settings);
  if (!links.length) return null;
  return (
    <ul className="flex flex-wrap gap-3">
      {links.map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition duration-300 ${
              light
                ? 'border-cream/20 text-cream/80 hover:border-saffron-300 hover:bg-saffron-400 hover:text-ink-800'
                : 'border-ink-600/20 text-ink-600 hover:border-ink-600 hover:bg-ink-600 hover:text-cream'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
