import crypto from 'node:crypto';
import type { Request } from 'express';
import { db } from '../db/index.js';
import { activityLog } from '../db/schema.js';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** One-way hash of the client IP — lets staff spot spam without storing raw IPs. */
export function hashIp(req: Request): string {
  const ip = req.ip ?? 'unknown';
  return crypto.createHash('sha256').update(`sw:${ip}`).digest('hex').slice(0, 24);
}

export async function logActivity(
  req: Request,
  action: string,
  entity: string,
  summary: string,
  entityId?: string,
) {
  try {
    await db.insert(activityLog).values({ adminId: req.admin?.id ?? null, action, entity, entityId, summary });
  } catch (e) {
    console.warn('[activity] failed to log', e);
  }
}

/** Escapes a value for CSV output and neutralises spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
