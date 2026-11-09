import 'dotenv/config';
import path from 'node:path';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (isProd && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

export const config = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  siteUrl: (process.env.SITE_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  // Secure cookies need HTTPS. Set COOKIE_SECURE=false only for plain-http testing (e.g. http://<server-ip>)
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
  cookieName: 'sw_admin',
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? 'uploads'),
  publicUploadBase: (process.env.PUBLIC_UPLOAD_BASE ?? '/uploads').replace(/\/$/, ''),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 5) * 1024 * 1024,
  serveClient: process.env.SERVE_CLIENT === 'true',
  clientDist: path.resolve(process.env.CLIENT_DIST ?? '../client/dist'),
} as const;
