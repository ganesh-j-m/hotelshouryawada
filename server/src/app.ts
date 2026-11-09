import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config.js';
import { eq, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { branches } from './db/schema.js';
import { asyncHandler, errorHandler } from './lib/errors.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin/index.js';

export function createApp() {
  const app = express();

  // Behind Render/Railway/Nginx etc. — needed for correct client IPs in rate limiting
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploaded images may be shown on another origin
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:'],
          frameSrc: ['https://www.google.com', 'https://maps.google.com'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          // Only force https sub-requests when the site is actually served over https
          upgradeInsecureRequests: config.cookieSecure ? [] : null,
        },
      },
    }),
  );
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  if (!config.isProd) app.use(morgan('dev'));

  // ── Uploaded images ──
  fs.mkdirSync(config.uploadDir, { recursive: true });
  app.use(
    config.publicUploadBase,
    express.static(config.uploadDir, {
      maxAge: '30d',
      immutable: true,
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  // ── API ──
  app.get('/api/health', asyncHandler(async (_req, res) => {
    await db.execute(sql`select 1`);
    res.json({ ok: true });
  }));
  app.use('/api', apiLimiter);
  app.use('/api/public', publicRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // ── SEO files (generated from live data) ──
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
      ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', `Sitemap: ${config.siteUrl}/sitemap.xml`, ''].join('\n'),
    );
  });

  app.get('/sitemap.xml', asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ slug: branches.slug, updatedAt: branches.updatedAt })
      .from(branches)
      .where(eq(branches.isPublished, true));
    const staticPaths = ['', '/about', '/branches', '/menu', '/gallery', '/founder', '/contact', '/reserve', '/privacy', '/terms'];
    const urls = [
      ...staticPaths.map((p) => `<url><loc>${config.siteUrl}${p}</loc></url>`),
      ...rows.map(
        (b) => `<url><loc>${config.siteUrl}/branches/${b.slug}</loc><lastmod>${b.updatedAt.toISOString().slice(0, 10)}</lastmod></url>`,
      ),
    ];
    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=3600')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
  }));

  // ── Optional: serve the built React app from this same server ──
  if (config.serveClient && fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
    app.use('/assets', express.static(path.join(config.clientDist, 'assets'), { maxAge: '1y', immutable: true }));
    app.get('*', (_req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
