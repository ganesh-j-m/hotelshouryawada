import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/index.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`✓ Hotel Shauryawada API running on http://localhost:${config.port} (${config.nodeEnv})`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
