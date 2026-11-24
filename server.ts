import express from 'express';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  GEMINI_DECISION_MODEL,
  GEMINI_FLASH_LITE_31,
  GEMINI_FLASH_LITE_35,
  createDecisionGenAIClient,
  executeWithFlashLiteFailover,
  planModelRoute,
} from './src/utils/geminiOrchestrator.js';
import type { Language } from './src/utils/i18n.js';
import {
  getSeoMetadataForRoute,
  renderSsrNoscriptNavigation,
  renderSsrSeoHeadTags,
} from './src/utils/seoLogic.js';
import {
  VALID_APP_ROUTES,
  getRouteNavigationContext,
  normalizeRoutePath,
} from './src/utils/navLogic.js';
import {
  buildCrossSubdomainSsoUrl,
  normalizeTraderHandle,
} from './src/utils/tallynxEcosystemLogic.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
const PORT = Number(process.env.PORT) || 3000;
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const isDirectServerRun =
  Boolean(process.argv[1]) &&
  /(^|[\\/])server\.(ts|js|mjs|cjs)$/i.test(process.argv[1]);
const isProduction =
  process.env.NODE_ENV === 'production' || isVercel || !isDirectServerRun;

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '64kb' }));

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      timeout: 25000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const TREDYN_ADVISOR_SYSTEM_INSTRUCTION = `You are Tredyn Advisor, the risk discipline and architecture specialist for Tredyn Group, Tredyn Protocol, and the flagship trading workspace Tredyn · GHR v3.2 Desk.

Core architecture & product knowledge:
1. Three Core Pillars:
   - 01 Human Direction: The trader defines daily loss ceilings, risk bounds, and trading rules before market open. Software never overrides human judgment.
   - 02 Independent Intelligence: Strictly read-only drift and drawdown velocity monitoring. Alerts before limits breach.
   - 03 Engineering with Purpose: Non-custodial MT5 bridge and tamper-evident deal ledger. Orders stay in MT5 100% of the time.

2. Flagship Tredyn · GHR v3.2 Desk Capabilities:
   - 3-TP & 4-TP Ladder Calculator (5-State Math) for exact entry sizing, SL risk, and multi-target splits.
   - 40% Consistency Rule Auditor & Prop / Personal Switcher with 7-day and monthly P&L calendars.
   - 12-Gate Fail-Closed Discipline Protocol with an automatic 15-minute cooldown after Stop-Loss hits.
   - Safe Prop-Compliant Sync: Live Bridge (.ex5) from local/Private Dedicated IP, Official Cloud APIs (FundedNext MCP / Myfxbook / ProjectX), & instant .xlsx statement importer (no shared-IP Investor Password VPS).
   - Offline-First PWA with encrypted Google Cloud sync and 3-Model Risk Coach.

3. Multi-Engine Desks & Verified Desk-Idea Marketplace (/marketplace):
   - Tredyn is not restricted to GHR v3.2 Desk; traders can also build, publish, and license Custom Session Desks, EA Coexistent Guards, and Macro 4-TP Playbooks.
   - Strict Real-Data Rule: All listed performance metrics must come strictly from verified real MT5 data (Live Bridge .ex5, Official Cloud APIs like FundedNext MCP / Myfxbook / ProjectX, or SHA-256 verified broker .xlsx statements). Unverified synthetic claims are rejected fail-closed.
   - Zero Auto Copy-Trading: Marketplace distributes verified setup configurations and risk rulesets — it never executes or mirrors orders automatically across accounts.

4. Communication guidelines:
   - Never mention any legacy brand names. Refer only to Tredyn, Tredyn Protocol, and Tredyn · GHR v3.2 Desk.
   - Reply concisely in the user's language (Thai or English) using clean bullet points ("- **Title**: ...") and short paragraphs.
   - Always clarify that Tredyn is an analytical software instrument and setup marketplace, not a broker, prop firm, or signal/copy-trade service.`;

app.post(['/api/advisor', '/api/chat'], async (req, res) => {
  try {
    const { messages, lang, model: requestedModel } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please verify your environment settings.',
      });
    }

    const formattedContents = messages
      .slice(-20)
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(m.content || '').slice(0, 4000) }],
      }));

    const latestUserPrompt =
      [...messages].reverse().find((m: { role?: string; content?: string }) => m?.role === 'user')?.content ||
      messages[messages.length - 1]?.content ||
      '';

    const languageHint =
      lang === 'th'
        ? '\n\nRespond naturally in Thai unless the user writes in English.'
        : '\n\nRespond naturally in English unless the user writes in Thai.';

    const routePlan = await planModelRoute({
      prompt: String(latestUserPrompt),
      hasRichContext: messages.length > 3,
      preference: requestedModel,
      decisionClient: createDecisionGenAIClient(),
    });

    const genClient = getGenAIClient();
    const result = await executeWithFlashLiteFailover(routePlan, async (candidateModel, suffix) => {
      const response = await genClient.models.generateContent({
        model: candidateModel,
        contents: formattedContents,
        config: {
          systemInstruction: `${TREDYN_ADVISOR_SYSTEM_INSTRUCTION}${languageHint}${suffix}`,
        },
      });
      return response.text || 'Tredyn Advisor: Signal received, please refine your inquiry.';
    });

    return res.json({
      reply: result.reply,
      model: result.model,
      failoverUsed: result.failoverUsed,
      router: {
        decisionModel: result.route.decisionModel,
        routedBy: result.route.routedBy,
        routeTier: result.route.routeTier,
        confidence: result.route.decisionConfidence,
        safeHarborTriggered: result.route.asksForTradeSignal,
      },
    });
  } catch (error: unknown) {
    console.error('Gemini API advisor error:', error);
    let status = 502;
    let message = 'Unable to reach Tredyn Advisor right now. Please try again.';

    if (error && typeof error === 'object') {
      const errObj = error as { status?: number; message?: string };
      if (typeof errObj.status === 'number' && errObj.status >= 400 && errObj.status < 600) {
        status = errObj.status;
      }
      if (typeof errObj.message === 'string' && errObj.message.trim()) {
        try {
          const parsed = JSON.parse(errObj.message) as {
            error?: { code?: number; message?: string; status?: string };
          };
          if (parsed?.error?.code && parsed.error.code >= 400 && parsed.error.code < 600) {
            status = parsed.error.code;
          }
          if (parsed?.error?.status === 'DEADLINE_EXCEEDED' || status === 504) {
            message =
              'Tredyn Advisor timed out while waiting for a response. Please try again.';
          } else if (parsed?.error?.message) {
            message = parsed.error.message;
          } else {
            message = errObj.message;
          }
        } catch {
          message = errObj.message;
        }
      }
    }

    return res.status(status).json({ error: message });
  }
});

// Telemetry & Health endpoint
app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'online',
    runtime: 'MT5 Non-Custodial Telemetry Bridge',
    organization: 'TallyNX Ecosystem',
    brand: 'TallyNX',
    model: `${GEMINI_DECISION_MODEL} -> ${GEMINI_FLASH_LITE_35} | ${GEMINI_FLASH_LITE_31}`,
    models: {
      router: GEMINI_DECISION_MODEL,
      primaryDeep: GEMINI_FLASH_LITE_35,
      primaryFast: GEMINI_FLASH_LITE_31,
    },
    timestamp: new Date().toISOString(),
  });
});

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value: string): string {
  return escapeHtmlAttr(value);
}

function resolveRequestOrigin(req: express.Request): string {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : req.protocol || 'https';
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!forwardedHost || /[^a-zA-Z0-9.:-]/.test(forwardedHost)) {
    return 'https://tallynx.com';
  }
  return `${proto}://${forwardedHost}`;
}

function resolveRequestLang(req: express.Request): Language {
  const queryLang = typeof req.query.lang === 'string' ? req.query.lang.trim().toLowerCase() : '';
  if (queryLang === 'en' || queryLang === 'th') {
    return queryLang;
  }
  const acceptLang = String(req.headers['accept-language'] || '').toLowerCase();
  if (acceptLang.startsWith('en') && !acceptLang.includes('th')) {
    return 'en';
  }
  return 'th';
}

const MALL_SSO_AUDIENCE = 'mall.tallynx.com';
const SSO_ALLOWED_AUDIENCES = [MALL_SSO_AUDIENCE, 'desk.tallynx.com'] as const;
let devEphemeralSsoSecret: string | null = null;

function getSsoSigningConfig(): { secret: string; mode: 'signed-hmac' | 'ephemeral-session' } | null {
  const configured = process.env.TALLYNX_SSO_SECRET || process.env.SSO_SHARED_SECRET;
  if (configured && configured.trim().length >= 16) {
    return { secret: configured.trim(), mode: 'signed-hmac' };
  }
  if (isProduction) {
    return null;
  }
  if (!devEphemeralSsoSecret) {
    devEphemeralSsoSecret = crypto.randomBytes(32).toString('hex');
  }
  return { secret: devEphemeralSsoSecret, mode: 'ephemeral-session' };
}

function signSsoToken(claims: Record<string, unknown>, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySsoToken(
  token: string,
  secret: string
): { valid: true; claims: Record<string, unknown> } | { valid: false; reason: string } {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0 || dotIdx >= token.length - 1) {
    return { valid: false, reason: 'Malformed token format' };
  }
  const payload = token.slice(0, dotIdx);
  const signature = token.slice(dotIdx + 1);
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'Invalid token signature' };
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (!SSO_ALLOWED_AUDIENCES.some((audience) => audience === claims.aud)) {
      return { valid: false, reason: 'Invalid token audience' };
    }
    const rawExp = Number(claims.exp);
    const expSec = rawExp > 1e11 ? Math.floor(rawExp / 1000) : rawExp;
    const nowSec = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(expSec) || expSec < nowSec) {
      return { valid: false, reason: 'Token expired' };
    }
    return { valid: true, claims };
  } catch {
    return { valid: false, reason: 'Corrupt token payload' };
  }
}

// Cross-subdomain SSO for Mall and legacy Desk clients.
app.post('/api/auth/sso-handoff', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const body = (req.body || {}) as {
    handle?: string;
    email?: string;
    displayName?: string;
    targetOrigin?: string;
  };
  const requestedTarget = typeof body.targetOrigin === 'string' ? body.targetOrigin.trim() : '';
  let targetUrl: URL;
  try {
    targetUrl = new URL(requestedTarget || `https://${MALL_SSO_AUDIENCE}/`);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid SSO target origin' });
  }
  const aud = SSO_ALLOWED_AUDIENCES.find((audience) => targetUrl.origin === `https://${audience}`);
  if (!aud || targetUrl.protocol !== 'https:' || targetUrl.username || targetUrl.password) {
    return res.status(400).json({ ok: false, error: 'Unsupported SSO target origin' });
  }

  const ssoConfig = getSsoSigningConfig();
  if (!ssoConfig) {
    return res.status(503).json({
      ok: false,
      error: 'TALLYNX_SSO_SECRET is not configured on the server.',
    });
  }
  const { secret, mode } = ssoConfig;
  const handle = normalizeTraderHandle(typeof body.handle === 'string' ? body.handle : '') || 'trader';
  const nowSec = Math.floor(Date.now() / 1000);
  const claims = {
    iss: 'tallynx.com',
    aud,
    allowedAudiences: SSO_ALLOWED_AUDIENCES,
    sub: handle,
    displayName: typeof body.displayName === 'string' ? body.displayName.slice(0, 80) : `@${handle}`,
    emailHint: typeof body.email === 'string' ? body.email.slice(0, 120) : undefined,
    nonce: crypto.randomUUID(),
    iat: nowSec,
    exp: nowSec + 300,
    mode,
  };
  const token = signSsoToken(claims, secret);
  const redirectUrl = buildCrossSubdomainSsoUrl({
    baseDeskUrl: targetUrl.href,
    handle,
    lang: 'th',
    fromPath: '/',
    ssoToken: token,
  });

  return res.json({
    ok: true,
    token,
    expiresInSeconds: 300,
    mode,
    redirectUrl,
    allowedAudiences: SSO_ALLOWED_AUDIENCES,
    claims: {
      sub: claims.sub,
      iss: claims.iss,
      aud: claims.aud,
      allowedAudiences: claims.allowedAudiences,
      exp: claims.exp,
    },
  });
});

const handleSsoVerification = (req: express.Request, res: express.Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const token =
    (typeof req.query.token === 'string' && req.query.token.trim()) ||
    (typeof req.query.ssoToken === 'string' && req.query.ssoToken.trim()) ||
    (typeof req.body?.token === 'string' && req.body.token.trim()) ||
    (typeof req.body?.ssoToken === 'string' && req.body.ssoToken.trim()) ||
    '';
  if (!token) {
    return res.status(400).json({ ok: false, valid: false, error: 'Missing SSO token' });
  }
  const ssoConfig = getSsoSigningConfig();
  if (!ssoConfig) {
    return res.status(503).json({
      ok: false,
      valid: false,
      error: 'TALLYNX_SSO_SECRET is not configured on the server.',
    });
  }
  const { secret, mode } = ssoConfig;
  const result = verifySsoToken(token, secret);
  if (!result.valid) {
    return res.status(401).json({ ok: false, valid: false, error: result.reason });
  }
  const rawSub = String(result.claims.handle || result.claims.sub || 'trader');
  const handle = rawSub.startsWith('@') ? rawSub : `@${rawSub}`;
  return res.json({
    ok: true,
    valid: true,
    handle,
    mode,
    allowedAudiences: SSO_ALLOWED_AUDIENCES,
    claims: result.claims,
  });
};

app.get(['/api/auth/sso-verify', '/api/auth/sso-exchange'], handleSsoVerification);
app.post(['/api/auth/sso-verify', '/api/auth/sso-exchange'], handleSsoVerification);

// Dynamic OpenGraph SVG Card Generator (/api/og?route=...)
app.get('/api/og', (req, res) => {
  const rawRoute = typeof req.query.route === 'string' && req.query.route.trim() ? req.query.route.trim() : '/';
  const cleanRoute = rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;
  const origin = resolveRequestOrigin(req);
  const lang = resolveRequestLang(req);
  const route = normalizeRoutePath(cleanRoute);
  const seo = getSeoMetadataForRoute(route, lang, origin);
  const { currentItem } = getRouteNavigationContext(route, lang);
  const isTh = lang === 'th';
  const headline = seo.title.slice(0, 72);
  const subline = seo.description.slice(0, 118);
  const statBoxes = [
    { label: isTh ? 'การเข้าถึงข้อมูล' : 'DATA ACCESS', value: isTh ? 'อ่านอย่างเดียว' : 'Read-only MT5' },
    { label: isTh ? 'การดูแลเงินทุน' : 'CUSTODY', value: isTh ? 'ไม่ถือเงิน' : 'Non-Custodial' },
    { label: isTh ? 'ที่ส่งคำสั่งซื้อขาย' : 'ORDER EXECUTION', value: isTh ? 'MT5 บนเครื่อง' : 'Local MT5' },
    { label: isTh ? 'ตั้งค่าโต๊ะเทรด' : 'DESK SETUP', value: isTh ? '5 ขั้นตอน' : '5 Steps' },
  ];

  const statMarkup = statBoxes
    .map((stat, idx) => {
      const x = 64 + idx * 272;
      return `
  <rect x="${x}" y="390" width="248" height="126" rx="14" fill="#13161C" stroke="#262B36" stroke-width="1.5"/>
  <text x="${x + 22}" y="430" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="600" fill="#9CA3AF" letter-spacing="1.4">${escapeXml(stat.label)}</text>
  <text x="${x + 22}" y="482" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="30" font-weight="700" fill="#FFFFFF">${escapeXml(stat.value)}</text>`;
    })
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0A0B0D"/>
      <stop offset="100%" stop-color="#11141B"/>
    </linearGradient>
    <radialGradient id="blueGlow" cx="0.85" cy="0.18" r="0.55">
      <stop offset="0%" stop-color="#0752E8" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#0752E8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <rect width="1200" height="630" fill="url(#blueGlow)"/>
  <rect x="28" y="28" width="1144" height="574" rx="24" stroke="#232834" stroke-width="1.5"/>

  <!-- Brand Mark -->
  <rect x="64" y="68" width="44" height="44" rx="10" fill="#0752E8" fill-opacity="0.14" stroke="#0752E8" stroke-width="1.5"/>
  <polygon points="86,78 96,90 86,102 76,90" fill="#0752E8"/>
  <text x="124" y="99" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF" letter-spacing="-0.8">tallynx.</text>

  <!-- Pill Badge -->
  <rect x="64" y="144" width="660" height="36" rx="18" fill="#0752E8" fill-opacity="0.12" stroke="#0752E8" stroke-opacity="0.45"/>
  <text x="84" y="167" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="700" fill="#FFFFFF" letter-spacing="1.2">${escapeXml(currentItem.title)}</text>

  <!-- Headline & Subline -->
  <text x="64" y="252" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="40" font-weight="800" fill="#FFFFFF" letter-spacing="-1.2">${escapeXml(headline)}</text>
  <text x="64" y="304" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#A1A1AA">${escapeXml(subline)}</text>
  <text x="64" y="344" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" fill="#10B981">● Live Bridge (.ex5) · Cloud API · Analytical Software Only (Non-Custodial)</text>

  <!-- Telemetry Metric Cards -->
  ${statMarkup}

  <!-- Footer -->
  <text x="64" y="566" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" fill="#737373">${escapeXml(origin.replace(/^https?:\/\//, '') + route)}</text>
</svg>`;

  res.vary('Accept-Language');
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
  return sendCachedResponse(req, res, svg, !isVercel);
});

app.get('/robots.txt', (req, res) => {
  const origin = resolveRequestOrigin(req);
  const body = `User-agent: *\nAllow: /\nDisallow: /api/auth/\nSitemap: ${origin}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  return sendCachedResponse(req, res, body, !isVercel);
});

app.get('/sitemap.xml', (req, res) => {
  const origin = resolveRequestOrigin(req);
  const lastmod = new Date().toISOString().split('T')[0];

  const urlsXml = VALID_APP_ROUTES
    .map(
      (route) => `  <url>
    <loc>${escapeXml(`${origin}${route}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : route === '/sandbox' || route === '/marketplace' ? '0.9' : '0.8'}</priority>
  </url>`
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  return sendCachedResponse(req, res, body, !isVercel);
});

function computeWeakEtag(payload: string): string {
  const hash = crypto.createHash('sha256').update(payload).digest('base64url').slice(0, 18);
  return `W/"${hash}"`;
}

function sendCachedResponse(
  req: express.Request,
  res: express.Response,
  payload: string,
  allowCompression: boolean,
  precomputedEtag?: string
) {
  const etag = precomputedEtag ?? computeWeakEtag(payload);
  res.setHeader('ETag', etag);

  const ifNoneMatch = req.headers['if-none-match'];
  if (typeof ifNoneMatch === 'string' && ifNoneMatch.split(',').some((tag) => tag.trim() === etag)) {
    return res.status(304).end();
  }

  if (allowCompression && payload.length >= 1024) {
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    res.vary('Accept-Encoding');
    if (acceptEncoding.includes('br')) {
      res.setHeader('Content-Encoding', 'br');
      return res.status(200).send(zlib.brotliCompressSync(Buffer.from(payload, 'utf8')));
    }
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      return res.status(200).send(zlib.gzipSync(Buffer.from(payload, 'utf8')));
    }
  }

  return res.status(200).send(payload);
}

let cachedCleanedSsrShellHtml: string | null = null;
const ssrDocumentCache = new Map<string, { html: string; etag: string }>();
const MAX_SSR_CACHE_ENTRIES = 64;

function stripStaticSeoHeadTags(templateHtml: string): string {
  return templateHtml
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']keywords["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<link[^>]+rel=["'](?:canonical|alternate)["'][^>]*>/gi, '')
    .replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
}

function loadSsrShellHtml(): string | null {
  if (cachedCleanedSsrShellHtml) {
    return cachedCleanedSsrShellHtml;
  }
  const candidates = [
    path.resolve(__dirname, 'ssr-shell.html'),
    path.resolve(__dirname, 'api', 'ssr-shell.html'),
    path.resolve(process.cwd(), 'api', 'ssr-shell.html'),
    path.resolve(__dirname, 'index.html'),
    path.resolve(process.cwd(), 'index.html'),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const html = fs.readFileSync(candidate, 'utf8');
        if (html.includes('</head>')) {
          cachedCleanedSsrShellHtml = stripStaticSeoHeadTags(html);
          return cachedCleanedSsrShellHtml;
        }
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

function renderSsrDocument(req: express.Request, cleanedTemplateHtml: string): { html: string; etag: string } {
  const rawPath = req.path || '/';
  const origin = resolveRequestOrigin(req);
  const lang = resolveRequestLang(req);
  const normalized = normalizeRoutePath(rawPath);
  const cacheKey = `${origin}|${normalized}|${lang}`;
  const cached = ssrDocumentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { dynamicOgImageUrl } = getSeoMetadataForRoute(normalized, lang, origin);
  const langTaggedHtml = cleanedTemplateHtml.replace(
    /<html([^>]*?)lang=["'][^"']*["']/i,
    `<html$1lang="${lang}"`
  );
  const headInjection = renderSsrSeoHeadTags(normalized, lang, origin, { ogImageUrl: dynamicOgImageUrl });
  const noscriptSummary = renderSsrNoscriptNavigation(normalized, lang, origin);

  const withHead = langTaggedHtml.replace('</head>', `    ${headInjection}\n  </head>`);
  const html = withHead.includes('<div id="root">')
    ? withHead.replace('<div id="root">', `${noscriptSummary}\n    <div id="root">`)
    : withHead.replace('</body>', `    ${noscriptSummary}\n  </body>`);

  const entry = { html, etag: computeWeakEtag(html) };
  if (ssrDocumentCache.size >= MAX_SSR_CACHE_ENTRIES) {
    const oldestKey = ssrDocumentCache.keys().next().value;
    if (oldestKey !== undefined) {
      ssrDocumentCache.delete(oldestKey);
    }
  }
  ssrDocumentCache.set(cacheKey, entry);
  return entry;
}

if (isProduction) {
  if (isDirectServerRun && !isVercel) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        maxAge: '1y',
        immutable: true,
        etag: true,
      })
    );
    app.use(
      express.static(distDir, {
        maxAge: '1h',
        index: false,
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
  }

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    const shell = loadSsrShellHtml();
    if (!shell) {
      return res.status(503).send('TallyNX SSR shell unavailable');
    }
    const { html, etag } = renderSsrDocument(req, shell);
    res.vary('Accept-Language');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return sendCachedResponse(req, res, html, !isVercel, etag);
  });
}

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TallyNX Server] Running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (isDirectServerRun && !isVercel) {
  startServer();
}
