import rateLimit from 'express-rate-limit';

const message = (text: string) => ({ error: text });

/** Brute-force protection for the admin login. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Too many sign-in attempts. Please wait 15 minutes and try again.'),
});

/** Spam protection for public contact / reservation forms. */
export const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('You have sent several enquiries recently. Please call the branch directly.'),
});

/** General API ceiling. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many requests. Please slow down.'),
});
