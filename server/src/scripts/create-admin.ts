/**
 * Creates (or resets the password of) an OWNER account from environment variables:
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... SEED_ADMIN_NAME=... npm run admin:create
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, pool } from '../db/index.js';
import { adminUsers } from '../db/schema.js';
import { passwordSchema } from '../lib/validators.js';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Owner';
  if (!email) throw new Error('Set SEED_ADMIN_EMAIL');
  const check = passwordSchema.safeParse(password);
  if (!check.success) throw new Error(`SEED_ADMIN_PASSWORD: ${check.error.issues[0]?.message}`);

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(adminUsers)
    .values({ email, name, passwordHash, role: 'OWNER' })
    .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash, isActive: true, role: 'OWNER' } });
  console.log(`✓ Owner account ready: ${email}`);
}

main()
  .catch((e) => {
    console.error('✗', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
