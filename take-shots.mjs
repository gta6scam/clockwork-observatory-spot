// take-shots.mjs — photographs the game for screenshots/ and reports any
// page error. It serves game/ over a throwaway local port, opens each
// staged state (?shot=...) in headless Chromium, lets a few frames render,
// and saves a JPEG sized for the gate (long side 1280, well under 256 KiB).
//
//   node take-shots.mjs
//
// Uses the workspace's existing puppeteer install; nothing is downloaded.

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/home/hatch/workspace/shots-tool/package.json');
const puppeteer = require('puppeteer');

const here = fileURLToPath(new URL('.', import.meta.url));
const gameRoot = join(here, 'game');
const outDir = join(here, 'screenshots');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = join(gameRoot, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!path.startsWith(gameRoot) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  res.end(readFileSync(path));
});

const SHOTS = [
  { name: '1-cover.jpg', query: '?shot=cover' },
  { name: '2-start.jpg', query: '?shot=start' },
  { name: '3-eclipse.jpg', query: '?shot=late' },
  { name: '4-end.jpg', query: '?shot=end' },
];

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const problems = [];
page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
});
page.on('requestfailed', (req) => problems.push(`requestfailed: ${req.url()}`));

for (const shot of SHOTS) {
  // The 3D scene compiles shaders on first load, which is slow under
  // software rendering: wait for the game object rather than network idle.
  await page.goto(`http://localhost:${port}/index.html${shot.query}`, {
    waitUntil: 'domcontentloaded', timeout: 120000,
  });
  await page.waitForFunction(() => typeof window.__observatory !== 'undefined', { timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: join(outDir, shot.name), type: 'jpeg', quality: 84 });
  console.log('shot', shot.name);
}

await browser.close();
server.close();

if (problems.length) {
  console.log('PROBLEMS:\n' + problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('no page errors, no failed requests');
}
