/**
 * Seeds the database with information gathered from public sources (Nov 2026).
 * Safe to run repeatedly — it never overwrites content already edited in the dashboard.
 *
 * SOURCES
 *  - Official Instagram bio @hotel_shauryawada (via qoruz.com profile mirror):
 *    branch list, founder name “विकास नाना हांडे” (Vikas Nana Hande)
 *  - Official YouTube @Hotel_Shauryawada_Official: “Famous for its Mutton and Chicken Raan”
 *  - yappe.in listing: Handewadi address + phone (third-party listing → branch marked unverified)
 *  - LBB Pune review: chul cooking, fresh bhakri, wada-style ambience, thalis, family section, parking
 *
 * NOT FOUND publicly → left empty for the owner to complete in the dashboard:
 *  menu prices, addresses/phones for 10 branches, opening hours, email, Facebook, WhatsApp, photographs.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq, count } from 'drizzle-orm';
import { db, pool } from './index.js';
import { adminUsers, branches, founderMessage, menuCategories, menuItems, websiteSettings } from './schema.js';

const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

type NewBranch = typeof branches.$inferInsert;
type NewItem = Omit<typeof menuItems.$inferInsert, 'categoryId'>;

const BRANCHES: NewBranch[] = [
  {
    slug: 'handewadi',
    name: 'Hotel Shauryawada — Handewadi',
    area: 'Handewadi',
    city: 'Pune',
    address: 'NH65, Katraj Bypass Road, opposite Hande Lawns, Handewadi, Pune',
    pincode: '412308',
    phone: '+91 95527 57171',
    mapUrl: mapsSearch('Hotel Shauryawada, Katraj Bypass Rd, opposite Hande Lawns, Handewadi, Pune 412308'),
    isMain: true,
    intro:
      'Our main branch at Handewadi — a spacious, wada-style setting where traditional Maharashtrian food is slow-cooked on the chul and bhakri is made fresh by hand.',
    services: ['Dine-in', 'Family section', 'Parking'],
    sortOrder: 0,
  },
  { slug: 'wagholi', name: 'Hotel Shauryawada — Wagholi', area: 'Wagholi', city: 'Pune', sortOrder: 1 },
  { slug: 'bhosari', name: 'Hotel Shauryawada — Bhosari', area: 'Bhosari', city: 'Pimpri-Chinchwad', sortOrder: 2 },
  { slug: 'uruli-kanchan', name: 'Hotel Shauryawada — Uruli Kanchan', area: 'Uruli Kanchan', city: 'Pune District', sortOrder: 3 },
  {
    slug: 'loni-kalbhor-veg',
    name: 'Hotel Shauryawada — Loni Kalbhor (Veg)',
    area: 'Loni Kalbhor',
    city: 'Pune District',
    isVegOnly: true,
    sortOrder: 4,
  },
  { slug: 'khed-shivapur', name: 'Hotel Shauryawada — Khed Shivapur', area: 'Khed Shivapur', city: 'Pune District', sortOrder: 5 },
  { slug: 'rajgurunagar', name: 'Hotel Shauryawada — Rajgurunagar', area: 'Rajgurunagar', city: 'Pune District', sortOrder: 6 },
  { slug: 'lonavala', name: 'Hotel Shauryawada — Lonavala', area: 'Lonavala', city: 'Pune District', sortOrder: 7 },
  { slug: 'ahilyanagar', name: 'Hotel Shauryawada — Ahilyanagar', area: 'Ahilyanagar', city: 'Ahilyanagar', sortOrder: 8 },
  { slug: 'nashik', name: 'Hotel Shauryawada — Nashik', area: 'Nashik', city: 'Nashik', sortOrder: 9 },
  { slug: 'umarga', name: 'Hotel Shauryawada — Umarga', area: 'Umarga', city: 'Dharashiv', sortOrder: 10 },
];

/** Only dishes publicly associated with the brand. Prices were not published → null + “Ask at branch”. */
const MENU: { name: string; slug: string; description: string; sortOrder: number; items: NewItem[] }[] = [
  {
    name: 'Signature Raan',
    slug: 'signature-raan',
    description: 'The dishes Hotel Shauryawada is famous for.',
    sortOrder: 0,
    items: [
      {
        name: 'Mutton Raan',
        description: 'Leg of mutton marinated in spices and slow-cooked until it falls off the bone. Our signature dish.',
        dietType: 'NON_VEG',
        isSpecial: true,
        isFeatured: true,
      },
      {
        name: 'Chicken Raan',
        description: 'Spice-marinated chicken leg, slow-cooked the Shauryawada way.',
        dietType: 'NON_VEG',
        isSpecial: true,
        isFeatured: true,
      },
    ],
  },
  {
    name: 'Thali',
    slug: 'thali',
    description: 'Complete traditional meals.',
    sortOrder: 1,
    items: [
      { name: 'Mutton Thali', description: 'A complete traditional Maharashtrian mutton meal.', dietType: 'NON_VEG', isFeatured: true },
      { name: 'Chicken Thali', description: 'A complete traditional Maharashtrian chicken meal.', dietType: 'NON_VEG' },
      { name: 'Veg Thali', description: 'A wholesome vegetarian meal.', dietType: 'VEG' },
    ],
  },
  {
    name: 'From the Chul',
    slug: 'from-the-chul',
    description: 'Made fresh on the traditional wood-fired chul.',
    sortOrder: 2,
    items: [{ name: 'Chulivarchi Bhakri', description: 'Hand-made bhakri cooked fresh on the chul.', dietType: 'VEG' }],
  },
];

const DRAFT_FOUNDER_MESSAGE = `Dear Guests,

At Hotel Shauryawada, our journey has always been guided by one simple belief — every guest deserves to feel welcomed, valued, and cared for.

Food is more than just a meal. It is a way of bringing people together, creating memories, and celebrating life's special moments. This belief inspires us to serve every guest with warmth, dedication, and a commitment to quality.

As we continue to grow, our promise remains the same: to offer a welcoming atmosphere, memorable food experiences, and heartfelt hospitality at every visit.

Your trust and support are the most valuable part of our journey. We are grateful to have you as a part of the Hotel Shauryawada family.

We look forward to welcoming you again.

With gratitude and warm regards,`;

const SETTINGS = {
  brandName: 'Hotel Shauryawada',
  brandNameLocal: 'हॉटेल शौर्य वाडा',
  tagline: 'बेत गावाकडचा',
  logoUrl: '',
  heroEyebrow: 'हॉटेल शौर्य वाडा · बेत गावाकडचा',
  heroHeadline: 'Experience the Taste of Hospitality',
  heroSubtext:
    'Home of the famous Mutton & Chicken Raan. Discover the warmth, flavour and hospitality of Hotel Shauryawada — where memorable meals and a welcoming wada come together.',
  heroImageUrl: '',
  primaryCtaText: 'Explore Our Menu',
  secondaryCtaText: 'Find Our Branches',
  bookCtaText: 'Plan Your Visit',
  aboutHeading: 'More Than a Meal — A Memorable Experience',
  aboutText:
    'At Hotel Shauryawada, hospitality is at the heart of every experience. We believe that great food, a welcoming atmosphere and thoughtful service bring people together.\n\nOur kitchens follow the village way — dishes slow-cooked on the chul and bhakri made fresh by hand — served in a setting inspired by the traditional Maharashtrian wada. Our commitment is to create memorable moments for every guest who walks through our doors.',
  aboutImageUrl: '',
  aboutHighlights: ['Slow-cooked on the traditional chul', 'Fresh hand-made bhakri', 'Wada-inspired family dining'],
  experienceHeading: 'Hospitality That Makes Every Visit Special',
  experienceItems: [
    { title: 'Signature Raan', text: 'Mutton and Chicken Raan — the dishes our guests travel for.' },
    { title: 'Cooked on the Chul', text: 'Traditional wood-fired cooking for authentic village flavour.' },
    { title: 'Family Dining', text: 'Spacious seating with a separate family section.' },
    { title: 'Warm Hospitality', text: 'Courteous service that makes every guest feel at home.' },
  ],
  phone: '+91 95527 57171',
  email: '',
  whatsapp: '',
  generalHours: '',
  instagramUrl: 'https://www.instagram.com/hotel_shauryawada/',
  facebookUrl: '',
  youtubeUrl: 'https://www.youtube.com/@Hotel_Shauryawada_Official',
  footerText: 'Authentic Maharashtrian flavours, slow-cooked on the chul and served with heartfelt hospitality across Maharashtra.',
  reservationEnquiriesEnabled: true,
  reservationNote: 'This is a table enquiry, not an instant booking. Our branch team will call you to confirm availability.',
  seoTitle: 'Hotel Shauryawada | Famous Mutton & Chicken Raan',
  seoDescription:
    'Hotel Shauryawada — authentic Maharashtrian dining, famous for Mutton & Chicken Raan slow-cooked on the chul. Find a branch near you.',
  ogImageUrl: '',
};

async function main() {
  // Owner account — credentials come from env only, never hardcoded
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const inserted = await db
      .insert(adminUsers)
      .values({
        email,
        name: process.env.SEED_ADMIN_NAME?.trim() || 'Owner',
        role: 'OWNER',
        passwordHash: await bcrypt.hash(password, 12),
      })
      .onConflictDoNothing({ target: adminUsers.email })
      .returning({ id: adminUsers.id });
    if (inserted.length) console.log(`✓ Created owner account ${email}`);
  } else {
    console.log('ℹ SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping owner account');
  }

  for (const b of BRANCHES) {
    await db
      .insert(branches)
      .values({ ...b, mapUrl: b.mapUrl ?? mapsSearch(`Hotel Shauryawada ${b.area}`), isVerified: false })
      .onConflictDoNothing({ target: branches.slug });
  }
  console.log(`✓ Branches (${BRANCHES.length})`);

  for (const c of MENU) {
    await db
      .insert(menuCategories)
      .values({ name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder })
      .onConflictDoNothing({ target: menuCategories.slug });
    const [category] = await db.select().from(menuCategories).where(eq(menuCategories.slug, c.slug));
    const [{ n }] = await db.select({ n: count() }).from(menuItems).where(eq(menuItems.categoryId, category.id));
    if (n === 0) {
      await db.insert(menuItems).values(
        c.items.map((i, idx) => ({ ...i, categoryId: category.id, sortOrder: idx, price: null, priceNote: 'Ask at branch' })),
      );
    }
  }
  console.log('✓ Menu categories & signature dishes');

  await db
    .insert(founderMessage)
    .values({
      id: 1,
      name: 'Vikas Nana Hande',
      nameLocal: 'विकास नाना हांडे',
      designation: 'Founder, Hotel Shauryawada',
      heading: 'A Message from Our Founder',
      message: DRAFT_FOUNDER_MESSAGE,
      isPublished: true,
      isApproved: false, // draft text → public page shows “awaiting founder’s approval” until approved
    })
    .onConflictDoNothing();

  await db.insert(websiteSettings).values({ id: 1, data: SETTINGS }).onConflictDoNothing();
  console.log('✓ Founder message (draft) & website settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
