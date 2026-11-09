import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { websiteSettings } from '../db/schema.js';

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^(https?:\/\/|\/)/i.test(v), 'Must be a URL starting with http(s):// or /')
  .optional()
  .default('');

const text = (max: number) => z.string().trim().max(max).optional().default('');

/** Everything on the public site that the owner can edit from the dashboard. */
export const settingsSchema = z.object({
  brandName: z.string().trim().min(1).max(80).default('Hotel Shauryawada'),
  brandNameLocal: text(80),
  tagline: text(120),
  logoUrl: optionalUrl,

  heroEyebrow: text(120),
  heroHeadline: z.string().trim().min(1).max(140).default('Experience the Taste of Hospitality'),
  heroSubtext: text(400),
  heroImageUrl: optionalUrl,
  primaryCtaText: text(40),
  secondaryCtaText: text(40),
  bookCtaText: text(40),

  aboutHeading: text(140),
  aboutText: text(3000),
  aboutImageUrl: optionalUrl,
  aboutHighlights: z.array(z.string().trim().min(1).max(160)).max(8).default([]),

  experienceHeading: text(140),
  experienceItems: z
    .array(z.object({ title: z.string().trim().min(1).max(60), text: z.string().trim().max(240) }))
    .max(6)
    .default([]),

  phone: text(30),
  email: z.union([z.literal(''), z.string().trim().email().max(120)]).default(''),
  whatsapp: text(30),
  generalHours: text(200),

  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  youtubeUrl: optionalUrl,

  footerText: text(400),
  reservationEnquiriesEnabled: z.boolean().default(true),
  reservationNote: text(300),

  seoTitle: text(70),
  seoDescription: text(170),
  ogImageUrl: optionalUrl,
});

export type WebsiteSettingsData = z.infer<typeof settingsSchema>;

export async function getSettings(): Promise<WebsiteSettingsData> {
  const [row] = await db.select().from(websiteSettings).where(eq(websiteSettings.id, 1));
  // safeParse fills defaults for keys added later; a corrupt row never takes the site down
  const parsed = settingsSchema.safeParse(row?.data ?? {});
  return parsed.success ? parsed.data : settingsSchema.parse({});
}

export async function saveSettings(data: WebsiteSettingsData) {
  await db
    .insert(websiteSettings)
    .values({ id: 1, data })
    .onConflictDoUpdate({ target: websiteSettings.id, set: { data, updatedAt: new Date() } });
}
