/** Applies SQL migrations from ./drizzle. Safe to run on every deploy. */
import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';

const migrationsFolder = path.resolve(process.env.MIGRATIONS_DIR ?? 'drizzle');

migrate(db, { migrationsFolder })
  .then(() => console.log('✓ Database migrations applied'))
  .catch((e) => {
    console.error('✗ Migration failed:', e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
