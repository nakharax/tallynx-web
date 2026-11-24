import type { Language } from './i18n';
import {
  type AppRoutePath,
  getNavCategories,
  getRouteNavigationContext,
  normalizeRoutePath,
} from './navLogic';
import { DESK_IDEAS_CATALOG, type DeskIdeaItem } from './marketplaceLogic';

export interface RouteSeoMetadata {
  routePath: AppRoutePath;
  title: string;
  description: string;
  keywords: string[];
  robots: string;
  canonicalUrl: string;
  alternates: {
    en: string;
    th: string;
    xDefault: string;
  };
  ogType: 'website';
  ogLocale: 'en_US' | 'th_TH';
  ogLocaleAlternate: 'th_TH' | 'en_US';
  ogSiteName: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  dynamicOgImageUrl: string;
  ogImageAlt: string;
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

export interface ResolveSeoOptions {
  ogImageUrl?: string;
  robots?: string;
}

const DEFAULT_ORIGIN = 'https://tallynx.com';
const OG_IMAGE_PATH = '/og-share.jpg';
const DEFAULT_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1';

function normalizeOrigin(origin?: string): string {
  if (!origin || !origin.trim()) return DEFAULT_ORIGIN;
  return origin.replace(/\/+$/, '');
}

interface StaticRouteCopy {
  en: {
    title: string;
    description: string;
    keywords: string[];
    ogSiteName?: string;
    ogImageAlt?: string;
  };
  th: {
    title: string;
    description: string;
    keywords: string[];
    ogSiteName?: string;
    ogImageAlt?: string;
  };
}

const ROUTE_SEO_REGISTRY: Record<AppRoutePath, StaticRouteCopy> = {
  '/': {
    en: {
      title: 'TallyNX | MT5 Risk Shield and Statement Autopsy',
      description:
        'Check lot size against your daily loss limit in 10 seconds. Audit MT5 statements for post-stop trades and the 40% best-day threshold in 30 seconds.',
      keywords: [
        'TallyNX',
        'MT5 Statement Autopsy',
        'Lot Size Calculator',
        'Live Sandbox',
        'AI Risk Coach',
        'Verified MT5 Marketplace',
      ],
      ogImageAlt: 'TallyNX trading risk tools',
    },
    th: {
      title: 'TallyNX | เช็กความเสี่ยงและตรวจรายงาน MT5',
      description:
        'เช็กขนาด Lot เทียบเพดานขาดทุนรายวันใน 10 วินาที แล้วตรวจรายงาน MT5 ใน 30 วินาทีเพื่อหาออเดอร์หลังชน SL และเช็กเกณฑ์กำไรวันสูงสุด 40%',
      keywords: [
        'TallyNX',
        'ระบบบริหารพอร์ต MT5',
        'Prop Firm',
        'Consistency 40%',
        'AI Risk Coach',
        'TallyNX Marketplace',
      ],
      ogImageAlt: 'เครื่องมือคุมความเสี่ยง TallyNX',
    },
  },
  '/onboarding': {
    en: {
      title: 'TallyNX Desk Onboarding — MT5 Setup Walkthrough',
      description:
        'Try the risk calculator, choose a trading goal, and preview MT5 setup and discipline checks with the five-step TallyNX Desk walkthrough.',
      keywords: ['TallyNX Desk Onboarding', 'MT5 Setup Walkthrough', 'Position Size Calculator'],
    },
    th: {
      title: 'เริ่มต้นใช้งาน TallyNX Desk — คู่มือตั้งค่า MT5',
      description:
        'ทดลองคำนวณความเสี่ยง เลือกเป้าหมายการเทรด และดูตัวอย่างการตั้งค่า MT5 และการตรวจสอบวินัยผ่านคู่มือ TallyNX Desk 5 ขั้นตอน',
      keywords: ['คู่มือ TallyNX Desk', 'ตั้งค่า MT5', 'คำนวณขนาดสถานะ'],
    },
  },
  '/marketplace': {
    en: {
      title: 'TallyNX Marketplace – Verified MT5 Trading Desks',
      description:
        'Browse and license MT5 desk setups with proof from the Live Bridge, an official Cloud API, or a hashed broker statement. Inspect the source on each listing.',
      keywords: [
        'TallyNX Marketplace',
        'Verified MT5 Setups',
        'Trading Playbooks',
        'Non-Custodial Desk Blueprint',
      ],
      ogSiteName: 'TallyNX Marketplace',
      ogImageAlt: 'TallyNX Marketplace — Verified MT5 Trading Desks',
    },
    th: {
      title: 'TallyNX Marketplace – ชุดตั้งค่าโต๊ะเทรด MT5 ที่มีหลักฐาน',
      description:
        'เลือกซื้อสิทธิ์ใช้ชุดตั้งค่าโต๊ะเทรด MT5 และดูหลักฐานจาก Live Bridge (.ex5), Cloud API หรือแฮช .xlsx ระบบไม่คัดลอกออเดอร์',
      keywords: [
        'TallyNX Marketplace',
        'ชุดตั้งค่าโต๊ะเทรด MT5 ที่มีหลักฐาน',
        'Setup เทรดทอง',
        'Live Bridge MT5',
      ],
      ogSiteName: 'TallyNX Marketplace',
      ogImageAlt: 'TallyNX Marketplace — ชุดตั้งค่าโต๊ะเทรด MT5 ที่มีหลักฐาน',
    },
  },
  '/sandbox': {
    en: {
      title: 'TallyNX Live Sandbox – Interactive Drawdown Simulation',
      description:
        'See how simulated trades affect drawdown and try the 15-minute cooldown after a stop-loss. No sign-in required.',
      keywords: [
        'Drawdown Simulator',
        'Prop Firm Cooldown',
        'AI Trading Guardrail',
        'Risk Simulation',
      ],
    },
    th: {
      title: 'TallyNX Live Sandbox – จำลอง Drawdown ไม่ต้องล็อกอิน',
      description:
        'ดูว่าออเดอร์จำลองส่งผลต่อ Drawdown อย่างไร และลองช่วงพัก 15 นาทีหลังชน SL ได้โดยไม่ต้องล็อกอิน',
      keywords: [
        'จำลอง Drawdown',
        'ล็อกพักเทรด 15 นาที',
        'AI Guardrail',
        'TallyNX Sandbox',
      ],
    },
  },
  '/infrastructure': {
    en: {
      title: 'TallyNX | Read-Only MT5 Bridge Safety',
      description:
        'Compare the read-only local MT5 Bridge with cloud copy-bots. Review what data leaves your terminal, where orders execute, and how imports work.',
      keywords: [
        'Prop-Safe MT5 Sync',
        'Live Bridge .ex5',
        'FundedNext MCP',
        'Myfxbook Cloud API',
      ],
    },
    th: {
      title: 'TallyNX | ความปลอดภัยของ MT5 Bridge',
      description:
        'อ่านข้อมูล MT5 ผ่าน Live Bridge (.ex5) ในเครื่อง, Cloud API ทางการ หรือไฟล์ .xlsx คำสั่งซื้อขายทำผ่าน MT5 เท่านั้น',
      keywords: ['เชื่อมต่อ MT5 ปลอดภัย', 'Live Bridge .ex5', 'กฎ Prop Firm'],
    },
  },
  '/workspace': {
    en: {
      title: 'TallyNX Desk Workspace — 3-TP Calculator & 12-Gate Protocol',
      description:
        'Preview TallyNX Desk modules: Multi-TP risk ladder, 40% Consistency calendar, dual H1+M5 charts, AI Live Desk, and PropRules monitor.',
      keywords: [
        'TallyNX Desk',
        '3-TP Calculator',
        '12-Gate Protocol',
        'Consistency Rule 40%',
      ],
    },
    th: {
      title: 'โต๊ะเทรด TallyNX Desk — คำนวณ 3-TP และด่านวินัย 12-Gate',
      description:
        'เจาะลึกโมดูลโต๊ะเทรดจริง: คำนวณความเสี่ยง 3-TP, ปฏิทินกฎ Consistency 40%, กราฟคู่ H1+M5, AI Live Desk และศูนย์เช็กกฎ PropRules',
      keywords: ['TallyNX Desk', 'คำนวณ 3-TP', '12-Gate Protocol', 'PropRules'],
    },
  },
  '/analytics': {
    en: {
      title: 'TallyNX | MT5 Session and Drawdown Audit',
      description:
        'Explore a sample MT5 audit with drawdown, equity trends, session win rates, and a downloadable deal ledger.',
      keywords: [
        'MT5 Analytics',
        'Trading Performance Audit',
        'OLS Equity Trend',
        'Session Winrate',
      ],
    },
    th: {
      title: 'TallyNX | ตรวจสอบ Drawdown และเซสชัน MT5',
      description:
        'ดูตัวอย่างการตรวจสอบออเดอร์ MT5 พร้อม Drawdown แนวโน้ม Equity อัตราชนะรายเซสชัน และสมุดเทรดที่ดาวน์โหลดได้',
      keywords: ['วิเคราะห์พอร์ต MT5', 'สถิติรายเซสชัน', 'TallyNX Analytics'],
    },
  },
};

export function getSeoMetadataForRoute(
  path: string,
  lang: Language,
  origin?: string,
  options?: ResolveSeoOptions
): RouteSeoMetadata {
  const safeOrigin = normalizeOrigin(origin);
  const routePath = normalizeRoutePath(path);
  const canonicalUrl = `${safeOrigin}${routePath}`;
  const { title, description, keywords, ogSiteName, ogImageAlt } = ROUTE_SEO_REGISTRY[routePath][lang];
  const ogImage = options?.ogImageUrl ?? `${safeOrigin}${OG_IMAGE_PATH}`;
  const isTh = lang === 'th';

  return {
    routePath,
    title,
    description,
    keywords,
    robots: options?.robots ?? DEFAULT_ROBOTS,
    canonicalUrl,
    alternates: {
      en: `${canonicalUrl}?lang=en`,
      th: `${canonicalUrl}?lang=th`,
      xDefault: canonicalUrl,
    },
    ogType: 'website',
    ogLocale: isTh ? 'th_TH' : 'en_US',
    ogLocaleAlternate: isTh ? 'en_US' : 'th_TH',
    ogSiteName: ogSiteName ?? 'TallyNX Trading OS',
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogImage,
    dynamicOgImageUrl: `${safeOrigin}/api/og?route=${encodeURIComponent(routePath)}&lang=${lang}`,
    ogImageAlt: ogImageAlt ?? title,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: ogImage,
  };
}

/**
 * Builds Schema.org JSON-LD structured data specifically for the TallyNX Marketplace.
 * Outputs a CollectionPage wrapping an ItemList of verified SoftwareApplication/Product Offers.
 */
export function buildMarketplaceStructuredData(
  items: DeskIdeaItem[] = DESK_IDEAS_CATALOG,
  origin?: string
): Record<string, unknown> {
  const safeOrigin = normalizeOrigin(origin);
  const marketplaceUrl = `${safeOrigin}/marketplace`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'TallyNX Marketplace',
    description:
      'Verified MT5 trading desk configurations and risk rulebooks backed by Live Bridge (.ex5), Official Cloud APIs, and SHA-256 hashes of broker statements.',
    url: marketplaceUrl,
    image: `${safeOrigin}${OG_IMAGE_PATH}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TallyNX Trading OS',
      url: safeOrigin,
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Verified TallyNX Desk-Ideas',
      numberOfItems: items.length,
      itemListElement: items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          sku: item.id,
          name: item.title,
          description: item.summary,
          category: item.engineLabel,
          url: `${marketplaceUrl}#${item.id}`,
          brand: {
            '@type': 'Brand',
            name: 'TallyNX',
          },
          creator: {
            '@type': 'Person',
            name: item.creatorHandle,
          },
          offers: {
            '@type': 'Offer',
            price: item.priceUsd.toFixed(2),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `${marketplaceUrl}#${item.id}`,
          },
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'Verification Method',
              value: item.verificationMethod,
            },
            {
              '@type': 'PropertyValue',
              name: 'Max Drawdown',
              value: `${item.metrics.maxDrawdownPct}%`,
            },
            {
              '@type': 'PropertyValue',
              name: 'Profit Factor',
              value: String(item.metrics.profitFactor),
            },
            {
              '@type': 'PropertyValue',
              name: 'Execution Boundary',
              value: 'Non-Custodial MT5 Read-Only (Zero Auto Copy-Trading)',
            },
          ],
        },
      })),
    },
  };
}

export function buildBreadcrumbStructuredData(
  path: AppRoutePath,
  lang: Language,
  origin?: string
): Record<string, unknown> {
  const safeOrigin = normalizeOrigin(origin);
  const items = [{
    '@type': 'ListItem',
    position: 1,
    name: lang === 'th' ? 'หน้าแรก TallyNX' : 'TallyNX Home',
    item: `${safeOrigin}/`,
  }];

  if (path !== '/') {
    const { currentItem } = getRouteNavigationContext(path, lang);
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: currentItem.title,
      item: `${safeOrigin}${path}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Builds Schema.org WebApplication JSON-LD for the core TallyNX Trading OS workspace.
 */
export function buildWebApplicationStructuredData(
  origin?: string
): Record<string, unknown> {
  const safeOrigin = normalizeOrigin(origin);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TallyNX Trading OS',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    inLanguage: ['en', 'th'],
    url: safeOrigin,
    image: `${safeOrigin}${OG_IMAGE_PATH}`,
    description:
      'Check lot size against your daily loss limit in 10 seconds. Audit MT5 statements for post-stop trades and the 40% best-day threshold in 30 seconds.',
    featureList: [
      'Position Size and Multi-TP Ladder Calculator',
      'MT5 Statement Autopsy',
      'Drawdown and Cooldown Sandbox',
      'MT5 Setup Walkthrough',
      '12-Gate Discipline Checklist',
      'Verified Desk-Idea Marketplace',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function buildStructuredDataForRoute(
  path: AppRoutePath,
  origin?: string,
  marketplaceItems: DeskIdeaItem[] = DESK_IDEAS_CATALOG
): Record<string, unknown> {
  return path === '/marketplace'
    ? buildMarketplaceStructuredData(marketplaceItems, origin)
    : buildWebApplicationStructuredData(origin);
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generates unified <head> HTML tags for SSR responses from the single centralized SEO registry.
 */
export function renderSsrSeoHeadTags(
  path: AppRoutePath,
  lang: Language,
  origin?: string,
  options?: ResolveSeoOptions
): string {
  const meta = getSeoMetadataForRoute(path, lang, origin, options);
  const primarySchema = buildStructuredDataForRoute(meta.routePath, origin);
  const breadcrumbSchema = buildBreadcrumbStructuredData(meta.routePath, lang, origin);

  const primaryJsonLd = JSON.stringify(primarySchema).replace(/</g, '\\u003c');
  const breadcrumbJsonLd = JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c');

  const lines = [
    `<title>${escapeHtmlAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`,
    `<meta name="keywords" content="${escapeHtmlAttr(meta.keywords.join(', '))}" />`,
    `<meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(meta.canonicalUrl)}" />`,
    `<link rel="alternate" hreflang="en" href="${escapeHtmlAttr(meta.alternates.en)}" />`,
    `<link rel="alternate" hreflang="th" href="${escapeHtmlAttr(meta.alternates.th)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(meta.alternates.xDefault)}" />`,
    `<meta property="og:type" content="${escapeHtmlAttr(meta.ogType)}" />`,
    `<meta property="og:locale" content="${escapeHtmlAttr(meta.ogLocale)}" />`,
    `<meta property="og:locale:alternate" content="${escapeHtmlAttr(meta.ogLocaleAlternate)}" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttr(meta.ogSiteName)}" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(meta.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(meta.ogDescription)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(meta.ogUrl)}" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(meta.ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtmlAttr(meta.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="${escapeHtmlAttr(meta.twitterCard)}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(meta.twitterTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(meta.twitterDescription)}" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(meta.twitterImage)}" />`,
    `<script id="tredyn-structured-data" type="application/ld+json">${primaryJsonLd}</script>`,
    `<script id="tallynx-breadcrumb-data" type="application/ld+json">${breadcrumbJsonLd}</script>`,
  ];

  return lines.join('\n    ');
}

export function renderSsrNoscriptNavigation(
  path: AppRoutePath,
  lang: Language,
  origin?: string
): string {
  const safeOrigin = normalizeOrigin(origin);
  const meta = getSeoMetadataForRoute(path, lang, safeOrigin);
  const routeLinks = getNavCategories(lang)
    .flatMap(({ items }) => items)
    .filter((item) => !item.external)
    .map((item) => `<li><a href="${escapeHtmlAttr(`${safeOrigin}${item.href}?lang=${lang}`)}">${escapeHtmlAttr(item.title)}</a></li>`)
    .join('');
  const navLabel = lang === 'th' ? 'เมนูหลัก' : 'Primary navigation';

  return `<noscript id="tallynx-ssr-summary" data-route="${meta.routePath}"><main><h1>${escapeHtmlAttr(meta.title)}</h1><p>${escapeHtmlAttr(meta.description)}</p><nav aria-label="${navLabel}"><ul>${routeLinks}</ul></nav></main></noscript>`;
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkTag(
  rel: string,
  href: string,
  extraAttrs?: Record<string, string>
) {
  const selector = extraAttrs?.hreflang
    ? `link[rel="${rel}"][hreflang="${extraAttrs.hreflang}"]`
    : `link[rel="${rel}"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (extraAttrs) {
      for (const [k, v] of Object.entries(extraAttrs)) {
        link.setAttribute(k, v);
      }
    }
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertJsonLdScript(id: string, payload: Record<string, unknown>) {
  let script = document.head.querySelector<HTMLScriptElement>(`script#${id}`);
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}

/**
 * Synchronizes document title, meta description, robots, hreflang, canonical link,
 * OpenGraph, Twitter Cards, and Schema.org JSON-LD in the active browser <head>.
 */
export function syncDocumentSeo(
  path: AppRoutePath,
  lang: Language,
  marketplaceItems: DeskIdeaItem[] = DESK_IDEAS_CATALOG
): RouteSeoMetadata | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const origin = window.location.origin;
  const meta = getSeoMetadataForRoute(path, lang, origin);

  document.documentElement.lang = lang;
  document.title = meta.title;

  upsertLinkTag('canonical', meta.canonicalUrl);
  upsertLinkTag('alternate', meta.alternates.en, { hreflang: 'en' });
  upsertLinkTag('alternate', meta.alternates.th, { hreflang: 'th' });
  upsertLinkTag('alternate', meta.alternates.xDefault, { hreflang: 'x-default' });

  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'keywords', meta.keywords.join(', '));
  upsertMetaTag('name', 'robots', meta.robots);

  upsertMetaTag('property', 'og:type', meta.ogType);
  upsertMetaTag('property', 'og:locale', meta.ogLocale);
  upsertMetaTag('property', 'og:locale:alternate', meta.ogLocaleAlternate);
  upsertMetaTag('property', 'og:site_name', meta.ogSiteName);
  upsertMetaTag('property', 'og:title', meta.ogTitle);
  upsertMetaTag('property', 'og:description', meta.ogDescription);
  upsertMetaTag('property', 'og:url', meta.ogUrl);
  upsertMetaTag('property', 'og:image', meta.ogImage);
  upsertMetaTag('property', 'og:image:alt', meta.ogImageAlt);

  upsertMetaTag('name', 'twitter:card', meta.twitterCard);
  upsertMetaTag('name', 'twitter:title', meta.twitterTitle);
  upsertMetaTag('name', 'twitter:description', meta.twitterDescription);
  upsertMetaTag('name', 'twitter:image', meta.twitterImage);

  const primarySchema = buildStructuredDataForRoute(meta.routePath, origin, marketplaceItems);
  const breadcrumbSchema = buildBreadcrumbStructuredData(meta.routePath, lang, origin);
  upsertJsonLdScript('tredyn-structured-data', primarySchema);
  upsertJsonLdScript('tallynx-breadcrumb-data', breadcrumbSchema);

  return meta;
}
