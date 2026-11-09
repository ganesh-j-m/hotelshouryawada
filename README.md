# Hotel Shauryawada — Official Website & Admin Dashboard

A premium, mobile-first website for **Hotel Shauryawada (हॉटेल शौर्य वाडा)** with a secure admin dashboard so the owner and staff can manage branches, menu, gallery, the founder's message, website text and customer enquiries — without a developer.

| Part | Stack |
|---|---|
| Public site + admin UI | React 18 · TypeScript · Tailwind CSS · React Router · Lucide icons · Poppins (self-hosted) · Lenis smooth scroll |
| API | Node.js · Express · Zod validation · JWT (httpOnly cookie) · bcrypt |
| Database | PostgreSQL · Drizzle ORM (SQL migrations in `server/drizzle/`) |
| Images | Uploads re-encoded to WebP with `sharp`, stored on disk; only URLs go in the DB |

## Design

- **Bhagwa / saffron theme** (`saffron-*` in `tailwind.config.js`, primary `#E0640A` → `#FF931F`) with deep wood-brown `ink-*` from the logo for text and dark sections.
- **Official logo** at `client/public/logo.png` (header, hero, footer, favicon, admin). Upload a higher-resolution logo anytime in **Website Content → Homepage → Logo**.
- **Poppins** for all text, including Marathi (Devanagari).
- **Motion:** Lenis inertia scrolling, page transitions, scroll-reveal (up / left / right / zoom), header that hides on scroll-down, reading-progress bar, floating logo with orbit ring, branch marquee, count-up stats, button shine, card lift. Everything is disabled automatically for users with “reduce motion” enabled.

---

## 1. Verified information (research, Nov 2026)

Everything in the seed data comes from public sources. Nothing was invented.

| Item | Value | Source | Status |
|---|---|---|---|
| Brand | Hotel Shauryawada / हॉटेल शौर्य वाडा | Official Instagram & YouTube | ✅ |
| Founder | Vikas Nana Hande (विकास नाना हांडे) | Official Instagram bio | ✅ |
| Speciality | Famous for Mutton & Chicken Raan | Official YouTube description | ✅ |
| Branches (11) | Handewadi (Main), Wagholi, Bhosari, Uruli Kanchan, Loni Kalbhor (Veg), Khed Shivapur, Rajgurunagar, Lonavala, Ahilyanagar, Nashik, Umarga | Official Instagram bio | ✅ names only |
| Handewadi address | NH65, Katraj Bypass Rd, opp. Hande Lawns, Handewadi, Pune 412308 | yappe.in listing | ⚠️ confirm |
| Main phone | +91 95527 57171 | yappe.in listing | ⚠️ confirm |
| Cooking & ambience | Chul cooking, fresh bhakri, wada-style setting, thalis, family section, parking | LBB Pune review | ⚠️ confirm |
| Instagram | instagram.com/hotel_shauryawada | Profile mirror | ✅ |
| YouTube | youtube.com/@Hotel_Shauryawada_Official | Profile mirror | ✅ |

**Not found publicly → left empty for the owner:** menu prices (shown as "Ask at branch"), addresses/phones/hours for 10 branches, email, Facebook, WhatsApp, real photographs, founder photo.

**Placeholders are honest:** no stock photos are passed off as the hotel's own. Until real photos are uploaded, the site shows a branded "Photo coming soon" design. The founder's message is a **draft** and shows a small "awaiting approval" note until the owner turns on *Approved by founder*.

> ⚠️ An unofficial site `hotelshauryawada.pages.dev` exists with **fake** details (Baner address, +91 99999 99999, invented review). Do not reuse anything from it.

---

## 2. Run locally

Requirements: **Node 20+** and **PostgreSQL 14+**.

```bash
# 1) Database
createdb shauryawada            # or create it in pgAdmin

# 2) API
cd server
cp .env.example .env            # set DATABASE_URL, JWT_SECRET, SEED_ADMIN_*
npm install
npm run db:migrate              # creates tables
npm run db:seed                 # verified data + owner account from SEED_ADMIN_*
npm run dev                     # http://localhost:4000

# 3) Website (new terminal)
cd client
npm install
npm run dev                     # http://localhost:5173  (proxies /api to :4000)
```

Admin dashboard: **http://localhost:5173/admin** — sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 3. Database & migrations

| Task | Command (in `server/`) |
|---|---|
| Apply migrations | `npm run db:migrate` (prod: `npm run db:migrate:prod`) |
| After editing `src/db/schema.ts` | `npm run db:generate` → commit the new SQL file in `drizzle/` → `npm run db:migrate` |
| Seed (safe to re-run, never overwrites edits) | `npm run db:seed` |
| Create / reset an owner login | `SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… npm run admin:create` |
| Browse data | `npm run db:studio` |

Tables: `admin_users`, `branches`, `menu_categories`, `menu_items`, `gallery_images`, `founder_message`, `website_settings`, `reservation_enquiries`, `contact_enquiries`, `activity_log`.

## 4. Deploy (recommended: one service + managed Postgres)

The API can serve the built website itself (`SERVE_CLIENT=true`) — one URL, no CORS, simplest for the owner.

### Option A — Docker (Render, Railway, Fly.io, any VPS)
```bash
docker build -t shauryawada .
docker run -p 4000:4000 \
  -e DATABASE_URL=postgresql://… \
  -e JWT_SECRET=… \
  -e CLIENT_ORIGIN=https://www.shauryawada.in \
  -e SITE_URL=https://www.shauryawada.in \
  -v shauryawada_uploads:/app/server/uploads \
  shauryawada
```
Migrations run automatically on start. Then create the owner once:
`docker exec -e SEED_ADMIN_EMAIL=… -e SEED_ADMIN_PASSWORD=… <container> node dist/db/seed.js`

### Option B — Render/Railway without Docker
- **Build:** `cd client && npm ci && npm run build && cd ../server && npm ci && npm run build`
- **Start:** `cd server && npm run db:migrate:prod && npm start`
- **Env:** `NODE_ENV=production`, `SERVE_CLIENT=true`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `SITE_URL` (both = your domain). Add `DATABASE_SSL=true` if your provider requires SSL.

**Important — uploads need persistent storage.** Attach a persistent disk/volume at `server/uploads` (Render Disk, Railway Volume, Docker volume). Platforms with ephemeral file systems will otherwise lose uploaded photos on redeploy. To move to S3/Cloudinary later, only `saveImage()` / `deleteLocalImage()` in `server/src/middleware/upload.ts` need changing.

### Option C — Frontend and API on separate hosts
Build the client with `VITE_API_URL=https://api.yourdomain` and `VITE_SITE_URL=https://www.yourdomain`, set `CLIENT_ORIGIN` on the API to the frontend URL, and serve over HTTPS. Keep both on the **same parent domain** (e.g. `www.` + `api.`) — the admin cookie is `SameSite=Strict`. Add an SPA fallback (all routes → `index.html`) on the static host and proxy `/sitemap.xml` + `/robots.txt` to the API.

### After launch
- Submit `https://yourdomain/sitemap.xml` in Google Search Console.
- Add a 1200×630 social image in **Website Content → Footer & SEO**.

## 5. Owner checklist (in the dashboard)

1. **Branches** — for each branch add address, pincode, phone, hours, Google Maps link and a photo → turn on **Details verified**. (Structured data for Google only includes verified details.)
2. **Menu** — add the real menu and prices. Leave price empty if not fixed (shows "Ask at branch").
3. **Gallery** — upload genuine photos of food, interiors and each branch.
4. **Founder's Message** — upload the founder's photo, edit the draft in his words, then turn on **Approved by founder**.
5. **Website Content** — hero photo, logo, email, WhatsApp (only if officially used), Facebook.
6. **Staff Accounts** — create separate logins for managers (Editor role can't delete).

## 6. Security summary
- Passwords hashed with bcrypt (cost 12); timing-safe login; login rate-limited (8 tries / 15 min).
- Session in an `httpOnly`, `SameSite=Strict`, `Secure` (prod) cookie; user re-checked on every request; Origin check on all state-changing requests (CSRF).
- Roles: **Owner** (everything + staff accounts), **Admin** (content + deletes), **Editor** (content, no deletes).
- All input validated server-side with Zod; enquiry forms rate-limited with a honeypot; IPs stored only as hashes.
- Uploads: 5 MB limit, file type detected from magic bytes, re-encoded to WebP (strips EXIF/GPS and hidden payloads), random filenames, path-traversal guard.
- Helmet security headers + strict Content-Security-Policy; no secrets in frontend code; CSV export guards against formula injection.
- Table enquiries are never shown as "confirmed" — staff confirm by phone and update the status.

## 7. Project structure
```
server/
  src/db/            schema.ts · migrate.ts · seed.ts
  src/routes/        public.ts · auth.ts · admin/{index,content,enquiries}.ts
  src/middleware/    auth (JWT, roles, CSRF) · rateLimit · upload (sharp)
  src/lib/           validators (zod) · settings · errors · util
  drizzle/           SQL migrations
client/
  src/pages/         Home · About · Branches · BranchDetail · Menu · Gallery · Founder · Contact · Reserve · Legal
  src/admin/         AdminApp (lazy-loaded) · pages/* · ui (modal, toast, uploads)
  src/components/    Header · Footer · BranchCard · MenuItemCard · Lightbox · Seo · Ornaments
Dockerfile           one-image production build
```
