import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || 'dist');
const base = process.env.VITE_BASE_PATH || '/';
assert.ok(['/', '/staging/'].includes(base), `Unexpected deployment base: ${base}`);
const html = readFileSync(path.join(dir, 'index.html'), 'utf8');
assert.ok(html.includes('rel="canonical" href="https://tome.frozenrabbit.com/"'));
assert.ok(!html.includes('emu-rabbit.github.io/frozen_rabbit_tome'));
assert.ok(!html.includes('%BASE_URL%'));
assert.ok(html.includes(`href="${base}logo.png"`));
assert.ok(html.includes(`content="${base === '/' ? 'index' : 'noindex'}, follow"`));
for (const match of html.matchAll(/(?:src|href)="(\/(?!\/)[^"]+)"/g)) {
  assert.ok(match[1].startsWith(base), `Wrong asset base: ${match[1]}`);
  assert.ok(existsSync(path.join(dir, match[1].slice(base.length))), `Missing asset: ${match[1]}`);
}
const robots = readFileSync(path.join(dir, 'robots.txt'), 'utf8');
if (base === '/') {
  assert.ok(robots.includes('Sitemap: https://tome.frozenrabbit.com/sitemap.xml'));
  const sitemap = readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('<loc>https://tome.frozenrabbit.com/</loc>'));
  assert.ok(!sitemap.includes('github.io'));
} else {
  assert.ok(robots.includes('Disallow: /'));
  assert.ok(!existsSync(path.join(dir, 'sitemap.xml')));
}
const assets = readdirSync(path.join(dir, 'assets'));
for (const prefix of ['solver.worker-', 'collectableSolver.worker-', 'regular-gathering-solver-core-', 'collectable-solver-core-']) {
  assert.ok(assets.some(name => name.startsWith(prefix)), `Missing worker/WASM asset: ${prefix}`);
}
assert.ok(existsSync(path.join(dir, 'og-cover.png')));
console.log(`Deployment artifact verified: ${base} (${dir})`);
