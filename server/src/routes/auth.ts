import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { adminUsers } from '../db/schema.js';
import { asyncHandler, HttpError } from '../lib/errors.js';
import { changePasswordSchema, loginSchema } from '../lib/validators.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { clearAuthCookie, requireAuth, setAuthCookie, signToken, verifyOrigin } from '../middleware/auth.js';
import { logActivity } from '../lib/util.js';

export const authRouter = Router();
authRouter.use(verifyOrigin);

// Compared against when the email does not exist, so response time doesn't reveal valid emails
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);

authRouter.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok || !user.isActive) {
      throw new HttpError(401, 'Incorrect email or password.');
    }

    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
    setAuthCookie(res, signToken(user.id, user.role));
    req.admin = { id: user.id, email: user.email, name: user.name, role: user.role };
    await logActivity(req, 'login', 'auth', `${user.name} signed in`);
    res.json({ user: req.admin });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store').json({ user: req.admin });
});

authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, req.admin!.id));
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'Current password is incorrect.');
    }
    await db
      .update(adminUsers)
      .set({ passwordHash: await bcrypt.hash(newPassword, 12) })
      .where(eq(adminUsers.id, user.id));
    await logActivity(req, 'update', 'auth', `${user.name} changed their password`);
    res.json({ ok: true });
  }),
);
