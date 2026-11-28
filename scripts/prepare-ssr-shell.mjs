import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const oldDistShellPath = path.join(distDir, 'ssr-shell.html');
const apiShellPath = path.resolve(rootDir, 'api', 'ssr-shell.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('Missing dist/index.html after vite build.');
  process.exit(1);
}

const html = fs.readFileSync(indexHtmlPath, 'utf8');
fs.mkdirSync(path.dirname(apiShellPath), { recursive: true });
fs.writeFileSync(apiShellPath, html, 'utf8');

// Remove static dist/index.html so Vercel executes the "/" -> "/api/index" SSR rewrite
// instead of serving an unlocalized static shell directly from CDN.
fs.unlinkSync(indexHtmlPath);
if (fs.existsSync(oldDistShellPath)) {
  fs.unlinkSync(oldDistShellPath);
}

await build({
  entryPoints: [path.resolve(rootDir, 'server.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  outfile: path.resolve(rootDir, 'api', 'server.bundle.js'),
});

console.log(
  'Prepared SSR shell & API bundle: api/ssr-shell.html, api/server.bundle.js'
);
