import { Router } from 'express';
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  branches,
  contactEnquiries,
  founderMessage,
  galleryImages,
  reservationEnquiries,
  type GalleryCategory,
} from '../db/schema.js';
import { asyncHandler, HttpError, notFound } from '../lib/errors.js';
import { getSettings } from '../lib/settings.js';
import { contactSchema, reservationSchema } from '../lib/validators.js';
import { enquiryLimiter } from '../middleware/rateLimit.js';
import { hashIp } from '../lib/util.js';

export const publicRouter = Router();

// Short public caching — admin edits appear within a minute
publicRouter.use((req, res, next) => {
  if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  next();
});

const branchSummary = {
  id: branches.id,
  slug: branches.slug,
  name: branches.name,
  area: branches.area,
  city: branches.city,
  address: branches.address,
  pincode: branches.pincode,
  phone: branches.phone,
  whatsapp: branches.whatsapp,
  openingHours: branches.openingHours,
  mapUrl: branches.mapUrl,
  imageUrl: branches.imageUrl,
  services: branches.services,
  isMain: branches.isMain,
  isVegOnly: branches.isVegOnly,
  isVerified: branches.isVerified,
  latitude: branches.latitude,
  longitude: branches.longitude,
};
const branchOrder = [desc(branches.isMain), asc(branches.sortOrder), asc(branches.name)];

/** Everything the layout needs in one request: settings, founder, branch list. */
publicRouter.get(
  '/site',
  asyncHandler(async (_req, res) => {
    const [settings, founderRows, branchList] = await Promise.all([
      getSettings(),
      db.select().from(founderMessage).where(and(eq(founderMessage.id, 1), eq(founderMessage.isPublished, true))),
      db.select(branchSummary).from(branches).where(eq(branches.isPublished, true)).orderBy(...branchOrder),
    ]);
    res.json({ settings, founder: founderRows[0] ?? null, branches: branchList });
  }),
);

publicRouter.get(
  '/branches',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim().slice(0, 60);
    const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
    const rows = await db
      .select(branchSummary)
      .from(branches)
      .where(
        and(
          eq(branches.isPublished, true),
          q
            ? or(ilike(branches.name, pattern), ilike(branches.area, pattern), ilike(branches.city, pattern), ilike(branches.address, pattern))
            : undefined,
        ),
      )
      .orderBy(...branchOrder);
    res.json(rows);
  }),
);

publicRouter.get(
  '/branches/:slug',
  asyncHandler(async (req, res) => {
    const branch = await db.query.branches.findFirst({
      where: and(eq(branches.slug, req.params.slug), eq(branches.isPublished, true)),
      with: {
        galleryImages: {
          where: eq(galleryImages.isPublished, true),
          orderBy: [asc(galleryImages.sortOrder), desc(galleryImages.createdAt)],
          limit: 24,
        },
      },
    });
    if (!branch) throw notFound('Branch');
    res.json(branch);
  }),
);

publicRouter.get(
  '/menu',
  asyncHandler(async (_req, res) => {
    const categories = await db.query.menuCategories.findMany({
      where: (c, { eq }) => eq(c.isActive, true),
      orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
      with: {
        items: {
          where: (i, { eq }) => eq(i.isAvailable, true),
          orderBy: (i, { asc }) => [asc(i.sortOrder), asc(i.name)],
        },
      },
    });
    res.json(categories.filter((c) => c.items.length > 0));
  }),
);

const GALLERY_CATEGORIES: GalleryCategory[] = ['INTERIOR', 'FOOD', 'AMBIENCE', 'EVENTS', 'BRANCHES'];

publicRouter.get(
  '/gallery',
  asyncHandler(async (req, res) => {
    const category = String(req.query.category ?? '').toUpperCase() as GalleryCategory;
    const images = await db.query.galleryImages.findMany({
      where: and(
        eq(galleryImages.isPublished, true),
        GALLERY_CATEGORIES.includes(category) ? eq(galleryImages.category, category) : undefined,
      ),
      orderBy: [asc(galleryImages.sortOrder), desc(galleryImages.createdAt)],
      with: { branch: { columns: { name: true, slug: true } } },
      limit: 200,
    });
    res.json(images);
  }),
);

publicRouter.post(
  '/enquiries/reservation',
  enquiryLimiter,
  asyncHandler(async (req, res) => {
    const settings = await getSettings();
    if (!settings.reservationEnquiriesEnabled) {
      throw new HttpError(403, 'Online table enquiries are paused. Please call the branch.');
    }
    const data = reservationSchema.parse(req.body);
    if (data.website) return res.status(201).json({ ok: true }); // silent honeypot

    const [branch] = await db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where(and(eq(branches.id, data.branchId), eq(branches.isPublished, true)));
    if (!branch) throw new HttpError(400, 'Please select a valid branch.');

    const [enquiry] = await db
      .insert(reservationEnquiries)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        branchId: branch.id,
        date: data.date,
        time: data.time,
        guests: data.guests,
        specialRequest: data.specialRequest,
        ipHash: hashIp(req),
      })
      .returning({ id: reservationEnquiries.id });

    // This is an enquiry only — a table is confirmed by staff, never automatically.
    res.status(201).json({ ok: true, reference: enquiry.id.slice(0, 8).toUpperCase(), branch: branch.name });
  }),
);

publicRouter.post(
  '/enquiries/contact',
  enquiryLimiter,
  asyncHandler(async (req, res) => {
    const data = contactSchema.parse(req.body);
    if (data.website) return res.status(201).json({ ok: true });

    let branchId: string | null = null;
    if (data.branchId) {
      const [b] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, data.branchId), eq(branches.isPublished, true)));
      branchId = b?.id ?? null;
    }

    await db.insert(contactEnquiries).values({
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      subject: data.subject,
      message: data.message,
      branchId,
      ipHash: hashIp(req),
    });
    res.status(201).json({ ok: true });
  }),
);
