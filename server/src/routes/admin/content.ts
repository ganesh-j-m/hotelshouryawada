import { Router } from 'express';
import { and, asc, desc, eq, getTableColumns, ilike, ne, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  branches,
  founderMessage,
  galleryImages,
  menuCategories,
  menuItems,
  reservationEnquiries,
} from '../../db/schema.js';
import { asyncHandler, notFound } from '../../lib/errors.js';
import {
  branchSchema,
  categorySchema,
  founderSchema,
  galleryImageSchema,
  menuItemSchema,
} from '../../lib/validators.js';
import { getSettings, saveSettings, settingsSchema } from '../../lib/settings.js';
import { logActivity, slugify } from '../../lib/util.js';
import { deleteLocalImage } from '../../middleware/upload.js';
import { requireRole } from '../../middleware/auth.js';

export const contentRouter = Router();
const canDelete = requireRole('OWNER', 'ADMIN');

async function uniqueSlug(base: string, table: typeof branches | typeof menuCategories, excludeId?: string) {
  const root = slugify(base) || 'item';
  let slug = root;
  for (let i = 2; ; i++) {
    const [hit] = await db
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.slug, slug), excludeId ? ne(table.id, excludeId) : undefined));
    if (!hit) return slug;
    slug = `${root}-${i}`;
  }
}

// ── Branches ────────────────────────────────────────────────

contentRouter.get(
  '/branches',
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({
        ...getTableColumns(branches),
        reservationCount: sql<number>`(select count(*)::int from ${reservationEnquiries} where ${reservationEnquiries.branchId} = ${branches.id})`,
        galleryCount: sql<number>`(select count(*)::int from ${galleryImages} where ${galleryImages.branchId} = ${branches.id})`,
      })
      .from(branches)
      .orderBy(desc(branches.isMain), asc(branches.sortOrder), asc(branches.name));
    res.json(rows);
  }),
);

contentRouter.get(
  '/branches/:id',
  asyncHandler(async (req, res) => {
    const [branch] = await db.select().from(branches).where(eq(branches.id, req.params.id));
    if (!branch) throw notFound('Branch');
    res.json(branch);
  }),
);

contentRouter.post(
  '/branches',
  asyncHandler(async (req, res) => {
    const data = branchSchema.parse(req.body);
    const slug = await uniqueSlug(data.slug || data.area || data.name, branches);
    const [branch] = await db.insert(branches).values({ ...data, slug }).returning();
    await logActivity(req, 'create', 'branch', `Added branch “${branch.name}”`, branch.id);
    res.status(201).json(branch);
  }),
);

contentRouter.put(
  '/branches/:id',
  asyncHandler(async (req, res) => {
    const data = branchSchema.parse(req.body);
    const [existing] = await db.select().from(branches).where(eq(branches.id, req.params.id));
    if (!existing) throw notFound('Branch');
    const slug = data.slug ? await uniqueSlug(data.slug, branches, existing.id) : existing.slug;
    const [branch] = await db.update(branches).set({ ...data, slug }).where(eq(branches.id, existing.id)).returning();
    if (existing.imageUrl && existing.imageUrl !== branch.imageUrl) await deleteLocalImage(existing.imageUrl);
    await logActivity(req, 'update', 'branch', `Updated branch “${branch.name}”`, branch.id);
    res.json(branch);
  }),
);

contentRouter.delete(
  '/branches/:id',
  canDelete,
  asyncHandler(async (req, res) => {
    const [branch] = await db.delete(branches).where(eq(branches.id, req.params.id)).returning();
    if (!branch) throw notFound('Branch');
    await deleteLocalImage(branch.imageUrl);
    await logActivity(req, 'delete', 'branch', `Deleted branch “${branch.name}”`, branch.id);
    res.json({ ok: true });
  }),
);

// ── Menu categories ─────────────────────────────────────────

contentRouter.get(
  '/menu/categories',
  asyncHandler(async (_req, res) => {
    res.json(
      await db
        .select({
          ...getTableColumns(menuCategories),
          itemCount: sql<number>`(select count(*)::int from ${menuItems} where ${menuItems.categoryId} = ${menuCategories.id})`,
        })
        .from(menuCategories)
        .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name)),
    );
  }),
);

contentRouter.post(
  '/menu/categories',
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse(req.body);
    const [category] = await db
      .insert(menuCategories)
      .values({ ...data, slug: await uniqueSlug(data.name, menuCategories) })
      .returning();
    await logActivity(req, 'create', 'menu-category', `Added menu category “${category.name}”`, category.id);
    res.status(201).json(category);
  }),
);

contentRouter.put(
  '/menu/categories/:id',
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse(req.body);
    const [category] = await db
      .update(menuCategories)
      .set({ ...data, slug: await uniqueSlug(data.name, menuCategories, req.params.id) })
      .where(eq(menuCategories.id, req.params.id))
      .returning();
    if (!category) throw notFound('Category');
    await logActivity(req, 'update', 'menu-category', `Updated menu category “${category.name}”`, category.id);
    res.json(category);
  }),
);

contentRouter.delete(
  '/menu/categories/:id',
  canDelete,
  asyncHandler(async (req, res) => {
    const items = await db.select({ imageUrl: menuItems.imageUrl }).from(menuItems).where(eq(menuItems.categoryId, req.params.id));
    const [category] = await db.delete(menuCategories).where(eq(menuCategories.id, req.params.id)).returning();
    if (!category) throw notFound('Category');
    await Promise.all(items.map((i) => deleteLocalImage(i.imageUrl)));
    await logActivity(req, 'delete', 'menu-category', `Deleted menu category “${category.name}” and its ${items.length} items`, category.id);
    res.json({ ok: true });
  }),
);

// ── Menu items ──────────────────────────────────────────────

contentRouter.get(
  '/menu/items',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim().slice(0, 60);
    const categoryId = String(req.query.categoryId ?? '');
    const rows = await db
      .select({ ...getTableColumns(menuItems), category: { id: menuCategories.id, name: menuCategories.name } })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(
        and(
          categoryId ? eq(menuItems.categoryId, categoryId) : undefined,
          q ? ilike(menuItems.name, `%${q.replace(/[%_\\]/g, '\\$&')}%`) : undefined,
        ),
      )
      .orderBy(asc(menuCategories.sortOrder), asc(menuItems.sortOrder), asc(menuItems.name));
    res.json(rows);
  }),
);

contentRouter.post(
  '/menu/items',
  asyncHandler(async (req, res) => {
    const data = menuItemSchema.parse(req.body);
    const [item] = await db.insert(menuItems).values(data).returning();
    await logActivity(req, 'create', 'menu-item', `Added menu item “${item.name}”`, item.id);
    res.status(201).json(item);
  }),
);

contentRouter.put(
  '/menu/items/:id',
  asyncHandler(async (req, res) => {
    const data = menuItemSchema.parse(req.body);
    const [existing] = await db.select().from(menuItems).where(eq(menuItems.id, req.params.id));
    if (!existing) throw notFound('Menu item');
    const [item] = await db.update(menuItems).set(data).where(eq(menuItems.id, existing.id)).returning();
    if (existing.imageUrl && existing.imageUrl !== item.imageUrl) await deleteLocalImage(existing.imageUrl);
    await logActivity(req, 'update', 'menu-item', `Updated menu item “${item.name}”`, item.id);
    res.json(item);
  }),
);

contentRouter.patch(
  '/menu/items/:id/availability',
  asyncHandler(async (req, res) => {
    const isAvailable = req.body?.isAvailable === true;
    const [item] = await db.update(menuItems).set({ isAvailable }).where(eq(menuItems.id, req.params.id)).returning();
    if (!item) throw notFound('Menu item');
    await logActivity(req, 'update', 'menu-item', `Marked “${item.name}” ${isAvailable ? 'available' : 'unavailable'}`, item.id);
    res.json(item);
  }),
);

contentRouter.delete(
  '/menu/items/:id',
  canDelete,
  asyncHandler(async (req, res) => {
    const [item] = await db.delete(menuItems).where(eq(menuItems.id, req.params.id)).returning();
    if (!item) throw notFound('Menu item');
    await deleteLocalImage(item.imageUrl);
    await logActivity(req, 'delete', 'menu-item', `Deleted menu item “${item.name}”`, item.id);
    res.json({ ok: true });
  }),
);

// ── Gallery ─────────────────────────────────────────────────

contentRouter.get(
  '/gallery',
  asyncHandler(async (_req, res) => {
    res.json(
      await db.query.galleryImages.findMany({
        orderBy: [asc(galleryImages.sortOrder), desc(galleryImages.createdAt)],
        with: { branch: { columns: { id: true, name: true } } },
      }),
    );
  }),
);

contentRouter.post(
  '/gallery',
  asyncHandler(async (req, res) => {
    const data = galleryImageSchema.parse(req.body);
    const [image] = await db.insert(galleryImages).values(data).returning();
    await logActivity(req, 'create', 'gallery', `Added a gallery image${image.caption ? ` “${image.caption}”` : ''}`, image.id);
    res.status(201).json(image);
  }),
);

contentRouter.put(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    const data = galleryImageSchema.parse(req.body);
    const [existing] = await db.select().from(galleryImages).where(eq(galleryImages.id, req.params.id));
    if (!existing) throw notFound('Image');
    const [image] = await db.update(galleryImages).set(data).where(eq(galleryImages.id, existing.id)).returning();
    if (existing.imageUrl !== image.imageUrl) await deleteLocalImage(existing.imageUrl);
    await logActivity(req, 'update', 'gallery', 'Updated a gallery image', image.id);
    res.json(image);
  }),
);

contentRouter.delete(
  '/gallery/:id',
  canDelete,
  asyncHandler(async (req, res) => {
    const [image] = await db.delete(galleryImages).where(eq(galleryImages.id, req.params.id)).returning();
    if (!image) throw notFound('Image');
    await deleteLocalImage(image.imageUrl);
    await logActivity(req, 'delete', 'gallery', 'Deleted a gallery image', image.id);
    res.json({ ok: true });
  }),
);

// ── Founder message (singleton) ─────────────────────────────

contentRouter.get(
  '/founder',
  asyncHandler(async (_req, res) => {
    const [row] = await db.select().from(founderMessage).where(eq(founderMessage.id, 1));
    res.json(row ?? null);
  }),
);

contentRouter.put(
  '/founder',
  asyncHandler(async (req, res) => {
    const data = founderSchema.parse(req.body);
    const [before] = await db.select().from(founderMessage).where(eq(founderMessage.id, 1));
    const [founder] = await db
      .insert(founderMessage)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({ target: founderMessage.id, set: { ...data, updatedAt: new Date() } })
      .returning();
    if (before?.photoUrl && before.photoUrl !== founder.photoUrl) await deleteLocalImage(before.photoUrl);
    if (before?.signatureUrl && before.signatureUrl !== founder.signatureUrl) await deleteLocalImage(before.signatureUrl);
    await logActivity(req, 'update', 'founder', 'Updated the founder’s message');
    res.json(founder);
  }),
);

// ── Website settings (singleton JSON) ───────────────────────

contentRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  }),
);

contentRouter.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);
    await saveSettings(data);
    await logActivity(req, 'update', 'settings', 'Updated website content & settings');
    res.json(data);
  }),
);
