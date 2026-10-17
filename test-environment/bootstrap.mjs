import { randomBytes } from 'node:crypto';
import { mkdir, open, lstat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { connection } from '../scripts/connection.mjs';

// Explicit endpoint required. Never default a test fixture to production.
export async function bootstrap(directory, endpoint) {
  const server = await connection(endpoint ?? '');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const state = await lstat(directory);
  if (!state.isDirectory() || (state.mode & 0o077) !== 0 || state.uid !== process.getuid()) {
    throw new Error('Use an owner-only state directory owned by the current user.');
  }
  const config = {
    gateway: {
      mode: 'local', bind: 'lan', port: 18789,
      auth: { mode: 'token', token: randomBytes(32).toString('hex') },
      controlUi: { allowedOrigins: ['http://127.0.0.1:18879', 'http://localhost:18879'] },
    },
    mcp: { servers: { ridian: server } },
  };
  const handle = await open(`${directory}/openclaw.json`, 'wx', 0o600);
  try { await handle.writeFile(JSON.stringify(config, null, 2) + '\n'); await handle.sync(); }
  finally { await handle.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await bootstrap('/home/node/.openclaw', process.argv[2]);
  console.log('Private test configuration created. Existing configuration is never overwritten.');
}
