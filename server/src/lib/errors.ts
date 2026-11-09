import type { NextFunction, Request, Response, RequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

function pgErrorCode(err: unknown): string | undefined {
  for (let e: unknown = err, depth = 0; e && depth < 3; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
    e = (e as { cause?: unknown }).cause;
  }
  return undefined;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found`);

/** Wraps an async route so rejected promises reach the error handler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Central error handler — never leaks stack traces or SQL to the client. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({ error: 'Please check the highlighted fields.', fields });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large.' : 'Upload failed. Please try again.';
    return res.status(400).json({ error: message });
  }

  // PostgreSQL error codes (may be wrapped by Drizzle in `cause`)
  const pgCode = pgErrorCode(err);
  if (pgCode === '23505') return res.status(409).json({ error: 'This value already exists.' });
  if (pgCode === '23503') return res.status(400).json({ error: 'Related record not found.' });
  if (pgCode === '22P02') return res.status(404).json({ error: 'Record not found.' });

  console.error('[error]', err);
  return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
}
