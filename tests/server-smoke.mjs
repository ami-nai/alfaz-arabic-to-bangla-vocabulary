import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const child = spawn(process.execPath, ['dist/server.cjs'], {
  env: { ...process.env, PORT: '3187', NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    child.stdout.on('data', data => {
      if (String(data).includes('Server running')) { clearTimeout(timer); resolve(); }
    });
    child.stderr.on('data', data => process.stderr.write(data));
    child.on('error', reject);
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
  });
  const root = await fetch('http://localhost:3187/');
  assert.equal(root.status, 200);
  const html = await root.text();
  assert.match(html, /<div id="root">/);
  const asset = html.match(/src="(\/assets\/[^\"]+)"/)[1];
  assert.equal((await fetch(`http://localhost:3187${asset}`)).status, 200);
  assert.equal((await fetch('http://localhost:3187/api/health')).status, 200);
  assert.equal((await fetch('http://localhost:3187/api/ai/enrich-word', { method: 'POST' })).status, 404);
  const source = await fetch('http://localhost:3187/server.cjs');
  assert.match(source.headers.get('content-type'), /text\/html/);
  console.log('Production smoke checks passed: frontend, assets, health, retired AI route, server bundle not served.');
} finally { child.kill(); }
