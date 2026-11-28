#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

const SCAN_ROOTS = ['src', 'server', 'api', 'public', 'server.ts', 'index.html'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.json', '.md']);

const FORBIDDEN_CLAIMS = [
  { name: 'guaranteed profit', re: /\bguaranteed?\s+profit\b/i },
  { name: 'guaranteed pass', re: /\bguaranteed?\s+pass\b/i },
  { name: 'risk-free', re: /\brisk[- ]free\b/i },
  { name: 'zero-risk', re: /\bzero[- ]risk\b/i },
  { name: 'no-loss', re: /\bno[- ]loss\b/i },
  { name: 'กำไรแน่นอน', re: /กำไรแน่นอน/i },
  { name: 'ผ่านแน่นอน', re: /ผ่านแน่นอน/i },
  { name: 'รับประกันกำไร', re: /รับประกันกำไร/i },
  { name: 'รับประกันผ่าน', re: /รับประกันผ่าน/i },
  { name: 'ไม่มีความเสี่ยง', re: /ไม่มีความเสี่ยง/i },
  { name: 'ไร้ความเสี่ยง', re: /ไร้ความเสี่ยง/i },
  { name: 'ไม่มีวันขาดทุน', re: /ไม่มีวันขาดทุน/i },
  { name: 'รวยแน่นอน', re: /รวยแน่นอน/i },
];

const LEGACY_BRAND_PATTERNS = [
  { name: 'legacy brand (xpfirm)', re: /\bxpfirm\b/i },
  { name: 'legacy brand (nakharax)', re: /\bnakharax\b/i },
];

function isAllowlisted(relPath, lineText) {
  const norm = relPath.replace(/\\/g, '/');
  if (norm === 'src/utils/geminiOrchestrator.ts' || norm === 'api/server.bundle.js') {
    return lineText.includes('asksForTradeSignal') || lineText.includes('guaranteed profit');
  }
  if (norm === 'src/utils/advisorLogic.test.ts') {
    return lineText.includes("includes('xpfirm')") || lineText.includes("includes('nakharax')");
  }
  return false;
}

function collectFiles(entry) {
  const full = path.join(REPO_ROOT, entry);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  const out = [];
  for (const name of fs.readdirSync(full)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const childRel = path.join(entry, name);
    const childFull = path.join(REPO_ROOT, childRel);
    const cStat = fs.statSync(childFull);
    if (cStat.isDirectory()) {
      out.push(...collectFiles(childRel));
    } else if (EXTENSIONS.has(path.extname(name))) {
      out.push(childFull);
    }
  }
  return out;
}

function main() {
  const files = SCAN_ROOTS.flatMap(collectFiles);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const rule of [...FORBIDDEN_CLAIMS, ...LEGACY_BRAND_PATTERNS]) {
        if (rule.re.test(line) && !isAllowlisted(rel, line)) {
          violations.push(`${rel}:${idx + 1} [${rule.name}] -> ${line.trim()}`);
        }
      }
    });
  }

  console.log(`[INFO] Audited ${files.length} files for Legal Safe Harbor & Brand Hygiene`);
  if (violations.length > 0) {
    console.error('[FAIL] Policy Guard detected violations:');
    violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  }
  console.log('[PASS] All TallyNX Web CI policy gates passed cleanly.');
}

main();
