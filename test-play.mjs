// Play test for The Clockwork Observatory: drives the real game in headless
// Chromium and asserts the rules — finds, misclick penalty, hints, the
// keyboard lens, time-out and retry. Run: node test-play.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/home/hatch/workspace/shots-tool/package.json');
const puppeteer = require('puppeteer');
const gameRoot = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
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
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/index.html?shot=start`, {
  waitUntil: 'domcontentloaded', timeout: 120000,
});
await page.waitForFunction(() => typeof window.__observatory !== 'undefined', { timeout: 120000 });

const results = [];
const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);

check('starts on the start screen', await page.evaluate(() => window.__observatory.state === 'start'));
await page.click('#ov-start');
check('start leads to the round intro', await page.evaluate(() => window.__observatory.state === 'intro'));
await page.click('#ov-begin');
check('intro leads to playing', await page.evaluate(() => window.__observatory.state === 'playing'));

// Click the first difference (the orrery's outer planet) on the right panel,
// at the panel position its 3D anchor projected to.
const box = await (await page.$('#panel-right')).boundingBox();
const spot = await page.evaluate(() => { const d = window.__observatory.diffs[0]; return { x: d.x, y: d.y, id: d.id }; });
await page.mouse.click(box.x + spot.x, box.y + spot.y);
const afterFind = await page.evaluate(() => ({
  found: window.__observatory.foundAt.size,
  score: window.__observatory.score,
  left: document.getElementById('left-count').textContent,
}));
check(`clicking ${spot.id} at its projected anchor finds it`, afterFind.found === 1 && afterFind.score === 100);
check('counter shows 11 TO FIND', afterFind.left === '11 TO FIND');

// Misclick on empty floor: score and time both drop.
const before = await page.evaluate(() => ({ score: window.__observatory.score, t: window.__observatory.timeLeft }));
await page.mouse.click(box.x + 30, box.y + 600);
const afterMiss = await page.evaluate(() => ({
  score: window.__observatory.score, t: window.__observatory.timeLeft, misses: window.__observatory.totalMisses,
}));
check('misclick costs 25 points', afterMiss.score === before.score - 25);
check('misclick costs about 5 seconds', before.t - afterMiss.t >= 5 && before.t - afterMiss.t < 6.5);
check('misclick is counted', afterMiss.misses === 1);

// Hint: one is spent, a target is chosen.
await page.keyboard.press('h');
const hint = await page.evaluate(() => ({
  hints: window.__observatory.hintsLeft, target: !!window.__observatory.hintTarget, score: window.__observatory.score,
}));
check('hint spends the purse', hint.hints === 2);
check('hint picks a live target', hint.target === true);
check('hint costs 40 points', hint.score === afterMiss.score - 40);

// Keyboard lens: arrows wake it, Enter checks at its position.
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowDown');
const lens = await page.evaluate(() => ({ active: window.__observatory.lens.active, clicks: window.__observatory.totalClicks }));
await page.keyboard.press('Enter');
const clicksAfter = await page.evaluate(() => window.__observatory.totalClicks);
check('lens wakes on arrows', lens.active === true);
check('Enter checks at the lens', clicksAfter === lens.clicks + 1);

// Pause holds the clock.
await page.keyboard.press('p');
const t1 = await page.evaluate(() => window.__observatory.timeLeft);
await new Promise((r) => setTimeout(r, 600));
const t2 = await page.evaluate(() => window.__observatory.timeLeft);
check('pause holds the clock', Math.abs(t1 - t2) < 0.01);
await page.click('#ov-resume');

// Run the clock out: game over, then retry returns to the intro.
await page.evaluate(() => { window.__observatory.timeLeft = 0.15; });
await page.waitForFunction(() => window.__observatory.state === 'game-over', { timeout: 20000 }).catch(() => {});
check('time out ends the round', await page.evaluate(() => window.__observatory.state === 'game-over'));
await page.click('#ov-retry');
check('retry returns to the intro', await page.evaluate(() => window.__observatory.state === 'intro'));
await page.click('#ov-begin');
// Find all twelve through real clicks at their projected anchors.
const all = await page.evaluate(() => window.__observatory.diffs.map((d) => ({ x: d.x, y: d.y })));
for (const d of all) await page.mouse.click(box.x + d.x, box.y + d.y);
check('finding all 12 clears the round', await page.evaluate(() => window.__observatory.state === 'round-clear'));

console.log(results.join('\n'));
console.log(errors.length ? `PAGE ERRORS: ${errors.join(' | ')}` : 'no page errors');
await browser.close();
server.close();
if (results.some((r) => r.startsWith('FAIL')) || errors.length) process.exitCode = 1;
