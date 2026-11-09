import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { asc, count, desc, eq, gte } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  activityLog,
  adminUsers,
  branches,
  contactEnquiries,
  galleryImages,
  menuItems,
  reservationEnquiries,
} from '../../db/schema.js';
import { asyncHandler, HttpError, notFound } from '../../lib/errors.js';
import { adminUserCreateSchema, adminUserUpdateSchema } from '../../lib/validators.js';
import { logActivity } from '../../lib/util.js';
import { requireAuth, requireRole, verifyOrigin } from '../../middleware/auth.js';
import { saveImage, uploadSingle, type UploadKind } from '../../middleware/upload.js';
import { contentRouter } from './content.js';
import { enquiriesRouter } from './enquiries.js';

export const adminRouter = Router();

adminRouter.use(verifyOrigin, requireAuth);
adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ── Dashboard overview (real counts from the database) ──────

adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
    const [
      totalBranches,
      publishedBranches,
      unverifiedBranches,
      totalMenuItems,
      totalGalleryImages,
      newReservations,
      newContacts,
      reservationsThisWeek,
      recentActivity,
      latestReservations,
    ] = await Promise.all([
      n(db.select({ n: count() }).from(branches)),
      n(db.select({ n: count() }).from(branches).where(eq(branches.isPublished, true))),
      n(db.select({ n: count() }).from(branches).where(eq(branches.isVerified, false))),
      n(db.select({ n: count() }).from(menuItems)),
      n(db.select({ n: count() }).from(galleryImages)),
      n(db.select({ n: count() }).from(reservationEnquiries).where(eq(reservationEnquiries.status, 'NEW'))),
      n(db.select({ n: count() }).from(contactEnquiries).where(eq(contactEnquiries.status, 'NEW'))),
      n(db.select({ n: count() }).from(reservationEnquiries).where(gte(reservationEnquiries.createdAt, weekAgo))),
      db.query.activityLog.findMany({
        orderBy: desc(activityLog.createdAt),
        limit: 12,
        with: { admin: { columns: { name: true } } },
      }),
      db.query.reservationEnquiries.findMany({
        orderBy: desc(reservationEnquiries.createdAt),
        limit: 5,
        with: { branch: { columns: { name: true } } },
      }),
    ]);
    res.json({
      branches: totalBranches,
      publishedBranches,
      unverifiedBranches,
      menuItems: totalMenuItems,
      galleryImages: totalGalleryImages,
      newReservations,
      newContacts,
      reservationsThisWeek,
      recentActivity,
      latestReservations,
    });
  }),
);

// ── Image upload ────────────────────────────────────────────

const KINDS: UploadKind[] = ['branch', 'menu', 'gallery', 'founder', 'site'];

adminRouter.post(
  '/upload',
  uploadSingle,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Please choose an image to upload.');
    const kind = String(req.query.kind ?? 'site') as UploadKind;
    if (!KINDS.includes(kind)) throw new HttpError(400, 'Invalid upload type.');
    res.status(201).json(await saveImage(req.file, kind));
  }),
);

// ── Content & enquiries ─────────────────────────────────────

adminRouter.use(contentRouter);
adminRouter.use('/enquiries', enquiriesRouter);

adminRouter.get(
  '/activity',
  asyncHandler(async (_req, res) => {
    res.json(
      await db.query.activityLog.findMany({
        orderBy: desc(activityLog.createdAt),
        limit: 100,
        with: { admin: { columns: { name: true } } },
      }),
    );
  }),
);

// ── Staff accounts (owner only) ─────────────────────────────

const ownerOnly = requireRole('OWNER');
const publicUser = {
  id: adminUsers.id,
  name: adminUsers.name,
  email: adminUsers.email,
  role: adminUsers.role,
  isActive: adminUsers.isActive,
  lastLoginAt: adminUsers.lastLoginAt,
  createdAt: adminUsers.createdAt,
};

adminRouter.get(
  '/users',
  ownerOnly,
  asyncHandler(async (_req, res) => {
    res.json(await db.select(publicUser).from(adminUsers).orderBy(asc(adminUsers.createdAt)));
  }),
);

adminRouter.post(
  '/users',
  ownerOnly,
  asyncHandler(async (req, res) => {
    const data = adminUserCreateSchema.parse(req.body);
    const [user] = await db
      .insert(adminUsers)
      .values({ name: data.name, email: data.email, role: data.role, passwordHash: await bcrypt.hash(data.password, 12) })
      .returning(publicUser);
    await logActivity(req, 'create', 'user', `Added staff account for ${user.name} (${user.role})`, user.id);
    res.status(201).json(user);
  }),
);

adminRouter.patch(
  '/users/:id',
  ownerOnly,
  asyncHandler(async (req, res) => {
    const data = adminUserUpdateSchema.parse(req.body);
    if (req.params.id === req.admin!.id && (data.isActive === false || (data.role && data.role !== 'OWNER'))) {
      throw new HttpError(400, 'You cannot deactivate or demote your own owner account.');
    }
    const [user] = await db
      .update(adminUsers)
      .set({
        name: data.name,
        role: data.role,
        isActive: data.isActive,
        ...(data.password && { passwordHash: await bcrypt.hash(data.password, 12) }),
      })
      .where(eq(adminUsers.id, req.params.id))
      .returning(publicUser);
    if (!user) throw notFound('User');
    await logActivity(req, 'update', 'user', `Updated staff account ${user.name}`, user.id);
    res.json(user);
  }),
);
