/**
 * Hotel Shauryawada — database schema (PostgreSQL via Drizzle ORM).
 * Images live on disk / object storage; only their URLs are stored here.
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ── Enums ───────────────────────────────────────────────────

export const adminRole = pgEnum('admin_role', ['OWNER', 'ADMIN', 'EDITOR']);
export const dietType = pgEnum('diet_type', ['VEG', 'NON_VEG', 'EGG']);
export const galleryCategory = pgEnum('gallery_category', ['INTERIOR', 'FOOD', 'AMBIENCE', 'EVENTS', 'BRANCHES']);
export const enquiryStatus = pgEnum('enquiry_status', ['NEW', 'CONTACTED', 'CONFIRMED', 'CLOSED', 'CANCELLED']);

export type AdminRole = (typeof adminRole.enumValues)[number];
export type EnquiryStatus = (typeof enquiryStatus.enumValues)[number];
export type GalleryCategory = (typeof galleryCategory.enumValues)[number];

// ── Tables ──────────────────────────────────────────────────

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: adminRole('role').notNull().default('EDITOR'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    area: text('area').notNull(),
    city: text('city').notNull(),
    address: text('address'),
    pincode: text('pincode'),
    phone: text('phone'),
    whatsapp: text('whatsapp'),
    email: text('email'),
    openingHours: text('opening_hours'),
    mapUrl: text('map_url'),
    mapEmbedUrl: text('map_embed_url'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    imageUrl: text('image_url'),
    intro: text('intro'),
    menuNote: text('menu_note'),
    services: text('services').array().notNull().default(sql`'{}'::text[]`),
    isMain: boolean('is_main').notNull().default(false),
    isVegOnly: boolean('is_veg_only').notNull().default(false),
    /** true only after the owner/staff confirms address, phone and hours */
    isVerified: boolean('is_verified').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('branches_published_idx').on(t.isPublished, t.sortOrder)],
);

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    /** Whole rupees. NULL = price not yet confirmed → shown as priceNote */
    price: integer('price'),
    priceNote: text('price_note'),
    imageUrl: text('image_url'),
    dietType: dietType('diet_type').notNull().default('VEG'),
    isAvailable: boolean('is_available').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    /** “Special” label — only set when confirmed by the hotel */
    isSpecial: boolean('is_special').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('menu_items_category_idx').on(t.categoryId, t.sortOrder)],
);

export const galleryImages = pgTable(
  'gallery_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    imageUrl: text('image_url').notNull(),
    caption: text('caption'),
    altText: text('alt_text'),
    category: galleryCategory('category').notNull().default('FOOD'),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    isPublished: boolean('is_published').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('gallery_published_idx').on(t.isPublished, t.category)],
);

/** Singleton row (id = 1) */
export const founderMessage = pgTable('founder_message', {
  id: integer('id').primaryKey().default(1),
  name: text('name').notNull(),
  nameLocal: text('name_local'),
  designation: text('designation').notNull().default('Founder'),
  photoUrl: text('photo_url'),
  heading: text('heading').notNull().default('A Message from Our Founder'),
  message: text('message').notNull(),
  signatureUrl: text('signature_url'),
  isPublished: boolean('is_published').notNull().default(true),
  /** false = draft text not yet approved by the founder → shown with a “draft” note */
  isApproved: boolean('is_approved').notNull().default(false),
  updatedAt: updatedAt(),
});

/** Singleton row (id = 1). JSON validated by settingsSchema in src/lib/settings.ts */
export const websiteSettings = pgTable('website_settings', {
  id: integer('id').primaryKey().default(1),
  data: jsonb('data').notNull(),
  updatedAt: updatedAt(),
});

export const reservationEnquiries = pgTable(
  'reservation_enquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    date: date('date', { mode: 'string' }).notNull(),
    time: text('time').notNull(),
    guests: integer('guests').notNull(),
    specialRequest: text('special_request'),
    status: enquiryStatus('status').notNull().default('NEW'),
    internalNotes: text('internal_notes'),
    ipHash: text('ip_hash'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('reservations_status_idx').on(t.status, t.createdAt), index('reservations_branch_idx').on(t.branchId)],
);

export const contactEnquiries = pgTable(
  'contact_enquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    status: enquiryStatus('status').notNull().default('NEW'),
    internalNotes: text('internal_notes'),
    ipHash: text('ip_hash'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('contacts_status_idx').on(t.status, t.createdAt)],
);

export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminId: uuid('admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    summary: text('summary').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('activity_created_idx').on(t.createdAt)],
);

// ── Relations (for the relational query API) ────────────────

export const branchesRelations = relations(branches, ({ many }) => ({
  galleryImages: many(galleryImages),
  reservations: many(reservationEnquiries),
  contacts: many(contactEnquiries),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, { fields: [menuItems.categoryId], references: [menuCategories.id] }),
}));

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  branch: one(branches, { fields: [galleryImages.branchId], references: [branches.id] }),
}));

export const reservationEnquiriesRelations = relations(reservationEnquiries, ({ one }) => ({
  branch: one(branches, { fields: [reservationEnquiries.branchId], references: [branches.id] }),
}));

export const contactEnquiriesRelations = relations(contactEnquiries, ({ one }) => ({
  branch: one(branches, { fields: [contactEnquiries.branchId], references: [branches.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  admin: one(adminUsers, { fields: [activityLog.adminId], references: [adminUsers.id] }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  activities: many(activityLog),
}));
