import { Router, type Request, type Response } from 'express';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { branches, contactEnquiries, reservationEnquiries, type EnquiryStatus } from '../../db/schema.js';
import { asyncHandler, notFound } from '../../lib/errors.js';
import { enquiryUpdateSchema } from '../../lib/validators.js';
import { csvCell, logActivity } from '../../lib/util.js';
import { requireRole } from '../../middleware/auth.js';

export const enquiriesRouter = Router();
const STATUSES: EnquiryStatus[] = ['NEW', 'CONTACTED', 'CONFIRMED', 'CLOSED', 'CANCELLED'];
const PAGE_SIZE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type EnquiryTable = typeof reservationEnquiries | typeof contactEnquiries;

function buildWhere(table: EnquiryTable, query: Request['query']): SQL | undefined {
  const status = String(query.status ?? '').toUpperCase() as EnquiryStatus;
  const branchId = String(query.branchId ?? '');
  const q = String(query.q ?? '').trim().slice(0, 60);
  const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
  return and(
    STATUSES.includes(status) ? eq(table.status, status) : undefined,
    UUID.test(branchId) ? eq(table.branchId, branchId) : undefined,
    q ? or(ilike(table.name, pattern), ilike(table.phone, pattern), ilike(table.email, pattern)) : undefined,
  );
}

function sendCsv(res: Response, name: string, header: string[], rows: unknown[][]) {
  const body = [header.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
  res
    .set('Content-Type', 'text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`)
    .send('﻿' + body); // BOM so Excel opens Marathi text correctly
}

// ── Reservation enquiries ───────────────────────────────────

enquiriesRouter.get(
  '/reservations',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const where = buildWhere(reservationEnquiries, req.query);
    const [items, [{ total }]] = await Promise.all([
      db.query.reservationEnquiries.findMany({
        where,
        orderBy: desc(reservationEnquiries.createdAt),
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        with: { branch: { columns: { id: true, name: true } } },
      }),
      db.select({ total: count() }).from(reservationEnquiries).where(where),
    ]);
    res.json({ items, total, page, pageSize: PAGE_SIZE });
  }),
);

enquiriesRouter.get(
  '/reservations/export.csv',
  asyncHandler(async (req, res) => {
    const rows = await db
      .select({ r: reservationEnquiries, branchName: branches.name })
      .from(reservationEnquiries)
      .leftJoin(branches, eq(reservationEnquiries.branchId, branches.id))
      .where(buildWhere(reservationEnquiries, req.query))
      .orderBy(desc(reservationEnquiries.createdAt))
      .limit(10000);
    sendCsv(
      res,
      'reservation-enquiries',
      ['Received', 'Name', 'Phone', 'Email', 'Branch', 'Date', 'Time', 'Guests', 'Request', 'Status', 'Notes'],
      rows.map(({ r, branchName }) => [
        r.createdAt, r.name, r.phone, r.email, branchName, r.date, r.time, r.guests, r.specialRequest, r.status, r.internalNotes,
      ]),
    );
  }),
);

enquiriesRouter.patch(
  '/reservations/:id',
  asyncHandler(async (req, res) => {
    const data = enquiryUpdateSchema.parse(req.body);
    const [updated] = await db
      .update(reservationEnquiries)
      .set(data)
      .where(eq(reservationEnquiries.id, req.params.id))
      .returning();
    if (!updated) throw notFound('Enquiry');
    await logActivity(req, 'update', 'reservation', `Table enquiry from ${updated.name} → ${updated.status}`, updated.id);
    res.json(updated);
  }),
);

enquiriesRouter.delete(
  '/reservations/:id',
  requireRole('OWNER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const [removed] = await db.delete(reservationEnquiries).where(eq(reservationEnquiries.id, req.params.id)).returning();
    if (!removed) throw notFound('Enquiry');
    await logActivity(req, 'delete', 'reservation', `Deleted table enquiry from ${removed.name}`, removed.id);
    res.json({ ok: true });
  }),
);

// ── Contact enquiries ───────────────────────────────────────

enquiriesRouter.get(
  '/contacts',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const where = buildWhere(contactEnquiries, req.query);
    const [items, [{ total }]] = await Promise.all([
      db.query.contactEnquiries.findMany({
        where,
        orderBy: desc(contactEnquiries.createdAt),
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        with: { branch: { columns: { id: true, name: true } } },
      }),
      db.select({ total: count() }).from(contactEnquiries).where(where),
    ]);
    res.json({ items, total, page, pageSize: PAGE_SIZE });
  }),
);

enquiriesRouter.get(
  '/contacts/export.csv',
  asyncHandler(async (req, res) => {
    const rows = await db
      .select({ c: contactEnquiries, branchName: branches.name })
      .from(contactEnquiries)
      .leftJoin(branches, eq(contactEnquiries.branchId, branches.id))
      .where(buildWhere(contactEnquiries, req.query))
      .orderBy(desc(contactEnquiries.createdAt))
      .limit(10000);
    sendCsv(
      res,
      'contact-enquiries',
      ['Received', 'Name', 'Phone', 'Email', 'Branch', 'Subject', 'Message', 'Status', 'Notes'],
      rows.map(({ c, branchName }) => [c.createdAt, c.name, c.phone, c.email, branchName, c.subject, c.message, c.status, c.internalNotes]),
    );
  }),
);

enquiriesRouter.patch(
  '/contacts/:id',
  asyncHandler(async (req, res) => {
    const data = enquiryUpdateSchema.parse(req.body);
    const [updated] = await db.update(contactEnquiries).set(data).where(eq(contactEnquiries.id, req.params.id)).returning();
    if (!updated) throw notFound('Enquiry');
    await logActivity(req, 'update', 'contact', `Message from ${updated.name} → ${updated.status}`, updated.id);
    res.json(updated);
  }),
);

enquiriesRouter.delete(
  '/contacts/:id',
  requireRole('OWNER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const [removed] = await db.delete(contactEnquiries).where(eq(contactEnquiries.id, req.params.id)).returning();
    if (!removed) throw notFound('Enquiry');
    await logActivity(req, 'delete', 'contact', `Deleted message from ${removed.name}`, removed.id);
    res.json({ ok: true });
  }),
);
