import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const urlOrPath = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => /^(https?:\/\/|\/)/i.test(v), 'Must be a URL starting with http(s):// or /');
const optUrl = urlOrPath.optional().nullable().or(z.literal('')).transform((v) => (v ? v : null));

// Indian mobile/landline, allowing +91, spaces and dashes
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => /^(\+?91)?[0-9]{10,11}$/.test(v), 'Enter a valid 10-digit phone number');

// ── Public forms ────────────────────────────────────────────

export const reservationSchema = z.object({
  name: trimmed(80).min(2, 'Please enter your name'),
  phone: phoneSchema,
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email').max(120)]).optional(),
  branchId: z.string().trim().uuid('Please select a branch'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a date')
    .refine((d) => {
      const day = new Date(`${d}T00:00:00Z`);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const max = new Date(today);
      max.setUTCDate(max.getUTCDate() + 120);
      return day >= today && day <= max;
    }, 'Choose a date between today and the next 4 months'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please choose a time'),
  guests: z.coerce.number().int().min(1, 'At least 1 guest').max(200, 'For groups above 200 please call us'),
  specialRequest: optText(600),
  // honeypot — real users never fill this hidden field
  website: z.string().max(0).optional(),
});

export const contactSchema = z
  .object({
    name: trimmed(80).min(2, 'Please enter your name'),
    phone: z.union([z.literal(''), phoneSchema]).optional(),
    email: z.union([z.literal(''), z.string().trim().email('Enter a valid email').max(120)]).optional(),
    subject: trimmed(120).min(2, 'Please add a subject'),
    message: trimmed(2000).min(5, 'Please write a short message'),
    branchId: z.union([z.literal(''), z.string().uuid()]).optional().nullable(),
    website: z.string().max(0).optional(),
  })
  .refine((v) => Boolean(v.phone) || Boolean(v.email), {
    message: 'Please give a phone number or an email so we can reply',
    path: ['phone'],
  });

// ── Admin ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password').max(200),
});

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(200)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use letters and numbers');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const branchSchema = z.object({
  name: trimmed(120).min(2),
  slug: trimmed(80).regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers and dashes only').optional(),
  area: trimmed(120).min(2),
  city: trimmed(120).min(2),
  address: optText(400),
  pincode: optText(10),
  phone: optText(30),
  whatsapp: optText(30),
  email: z.union([z.literal(''), z.string().trim().email()]).optional().nullable().transform((v) => v || null),
  openingHours: optText(300),
  mapUrl: optUrl,
  mapEmbedUrl: optUrl.refine(
    (v) => !v || /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v),
    'Use the "Embed a map" link from Google Maps (https://www.google.com/maps/embed?...)',
  ),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  imageUrl: optUrl,
  intro: optText(2000),
  menuNote: optText(400),
  services: z.array(trimmed(60).min(1)).max(12).default([]),
  isMain: z.boolean().default(false),
  isVegOnly: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const categorySchema = z.object({
  name: trimmed(80).min(2),
  description: optText(300),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export const menuItemSchema = z.object({
  name: trimmed(120).min(2),
  description: optText(500),
  price: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  priceNote: optText(60),
  imageUrl: optUrl,
  dietType: z.enum(['VEG', 'NON_VEG', 'EGG']).default('VEG'),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isSpecial: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  categoryId: z.string().uuid('Choose a category'),
});

export const galleryImageSchema = z.object({
  imageUrl: urlOrPath,
  caption: optText(200),
  altText: optText(200),
  category: z.enum(['INTERIOR', 'FOOD', 'AMBIENCE', 'EVENTS', 'BRANCHES']).default('FOOD'),
  branchId: z.union([z.literal(''), z.string().uuid()]).optional().nullable().transform((v) => v || null),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const founderSchema = z.object({
  name: trimmed(120).min(2),
  nameLocal: optText(120),
  designation: trimmed(120).min(2),
  photoUrl: optUrl,
  heading: trimmed(160).min(2),
  message: trimmed(6000).min(20),
  signatureUrl: optUrl,
  isPublished: z.boolean(),
  isApproved: z.boolean(),
});

export const enquiryUpdateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONFIRMED', 'CLOSED', 'CANCELLED']).optional(),
  internalNotes: optText(2000),
});

export const adminUserCreateSchema = z.object({
  name: trimmed(80).min(2),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['OWNER', 'ADMIN', 'EDITOR']),
  password: passwordSchema,
});

export const adminUserUpdateSchema = z.object({
  name: trimmed(80).min(2).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'EDITOR']).optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
});
