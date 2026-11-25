// Isolated UI QA: every database/auth request uses a local, disposable fixture.
// No real Supabase credentials or client data are used by this preview.
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { createFixtureServer } from '../tests/helpers/fixture-server.mjs';

const fixture = await createFixtureServer();
process.env.NEXT_PUBLIC_SUPABASE_URL = fixture.url;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service-key';
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = '';
process.env.VAPID_PRIVATE_KEY = '';
process.env.SUPERADMIN_EMAIL = 'preview-admin@example.test';
process.env.SUPERADMIN_PASSWORD = 'fixture-password';
process.env.MENUHUB_FIXTURE_PREVIEW = '1';
await mkdir('.next-catering-preview', { recursive: true });
await writeFile('.next-catering-preview/tsconfig.json', JSON.stringify({
  extends: '../tsconfig.json',
  include: ['../src/**/*.js', '../src/**/*.jsx'],
}, null, 2));

const port = Number(process.env.PORT || 3100);
const { default: next } = await import('next');
const app = next({ dev: true, webpack: true, hostname: '127.0.0.1', port });
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((req, res) => handle(req, res));
await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
console.log(`Catering fixture preview: http://127.0.0.1:${port}/kolar-kitchen/catering`);
console.log('Owner preview login: owner@example.test / fixture-password');
console.log('Fixture data only. Ctrl+C stops the preview.');

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.closeAllConnections();
  server.close();
  await app.close();
  await fixture.close();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.stdin.setEncoding('utf8');
process.stdin.on('data', data => { if (data.trim() === 'stop') void stop(); });
