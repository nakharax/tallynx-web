import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSeoMetadataForRoute,
  buildMarketplaceStructuredData,
  buildWebApplicationStructuredData,
  buildStructuredDataForRoute,
  buildBreadcrumbStructuredData,
  renderSsrSeoHeadTags,
  renderSsrNoscriptNavigation,
} from './seoLogic';
import { DESK_IDEAS_CATALOG } from './marketplaceLogic';
import { getNavCategories, getRouteNavigationContext, VALID_APP_ROUTES } from './navLogic';

test('getSeoMetadataForRoute returns branded Marketplace OpenGraph & Twitter tags within length targets', () => {
  const meta = getSeoMetadataForRoute('/marketplace', 'en', 'https://tallynx.example');

  assert.equal(meta.title, 'TallyNX Marketplace – MT5 Desk Blueprint Showcase');
  assert.ok(meta.title.length >= 30 && meta.title.length <= 60);
  assert.ok(meta.description.length >= 120 && meta.description.length <= 160);
  assert.equal(meta.canonicalUrl, 'https://tallynx.example/marketplace');
  assert.equal(meta.ogUrl, 'https://tallynx.example/marketplace');
  assert.equal(meta.ogImage, 'https://tallynx.example/og-share.jpg');
  assert.ok(meta.ogImageAlt.length > 10);
  assert.equal(meta.ogSiteName, 'TallyNX Marketplace');
  assert.equal(meta.ogTitle, meta.title);
  assert.equal(meta.ogDescription, meta.description);
  assert.equal(meta.twitterCard, 'summary_large_image');
  assert.equal(meta.twitterTitle, meta.title);
  assert.equal(meta.twitterDescription, meta.description);
  assert.equal(meta.twitterImage, 'https://tallynx.example/og-share.jpg');
});

test('buildMarketplaceStructuredData creates valid Schema.org CollectionPage + SoftwareApplication ItemList without fake InStock offers', () => {
  const schema = buildMarketplaceStructuredData(
    DESK_IDEAS_CATALOG,
    'https://tallynx.example'
  ) as {
    '@context': string;
    '@type': string;
    url: string;
    mainEntity: {
      '@type': string;
      numberOfItems: number;
      itemListElement: Array<{
        position: number;
        item: {
          '@type': string;
          identifier: string;
          name: string;
          offers?: unknown;
          additionalProperty: Array<{ name: string; value: string }>;
        };
      }>;
    };
  };

  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'CollectionPage');
  assert.equal(schema.url, 'https://tallynx.example/marketplace');
  assert.equal(schema.mainEntity['@type'], 'ItemList');
  assert.equal(schema.mainEntity.numberOfItems, DESK_IDEAS_CATALOG.length);
  assert.equal(schema.mainEntity.itemListElement.length, DESK_IDEAS_CATALOG.length);

  const first = schema.mainEntity.itemListElement[0];
  assert.equal(first.position, 1);
  assert.equal(first.item['@type'], 'SoftwareApplication');
  assert.equal(first.item.identifier, DESK_IDEAS_CATALOG[0].id);
  assert.equal(first.item.offers, undefined);
  assert.ok(
    first.item.additionalProperty.some((p) => p.name === 'Verification Channel')
  );
  assert.equal(JSON.stringify(schema).includes('InStock'), false);
});

test('marketplace uses the listing schema and every other core route describes the web app', () => {
  for (const route of VALID_APP_ROUTES) {
    const schema = buildStructuredDataForRoute(route, 'https://tallynx.example');
    assert.equal(schema['@type'], route === '/marketplace' ? 'CollectionPage' : 'WebApplication');
  }

  const webApp = buildWebApplicationStructuredData('https://tallynx.example');
  assert.equal(webApp['@context'], 'https://schema.org');
  assert.equal(webApp.applicationCategory, 'FinanceApplication');
  assert.ok(Array.isArray(webApp.featureList) && webApp.featureList.length >= 4);
  assert.deepEqual(webApp.inLanguage, ['en', 'th']);
});

const origin = 'https://tallynx.example';
const languages = ['en', 'th'] as const;

test('all core routes have distinct localized metadata and canonical and alternate links', () => {
  for (const lang of languages) {
    const metadata = VALID_APP_ROUTES.map((route) => getSeoMetadataForRoute(route, lang, origin + '/'));
    const titles = new Set(metadata.map(({ title }) => title));
    const descriptions = new Set(metadata.map(({ description }) => description));
    assert.equal(titles.size, VALID_APP_ROUTES.length);
    assert.equal(descriptions.size, VALID_APP_ROUTES.length);

    metadata.forEach((meta, index) => {
      const route = VALID_APP_ROUTES[index];
      const canonicalUrl = origin + route;
      assert.equal(meta.routePath, route);
      assert.equal(meta.canonicalUrl, canonicalUrl);
      assert.equal(meta.ogUrl, canonicalUrl);
      assert.equal(meta.ogType, 'website');
      assert.equal(meta.ogLocale, lang === 'th' ? 'th_TH' : 'en_US');
      assert.deepEqual(meta.alternates, { en: canonicalUrl + '?lang=en', th: canonicalUrl + '?lang=th', xDefault: canonicalUrl });
      assert.ok(meta.title.length >= 25);
      assert.ok(meta.description.length >= 70);
      assert.ok(meta.keywords.length >= 2);
      if (lang === 'th') {
        assert.match(meta.title, /[\u0E00-\u0E7F]/);
        assert.match(meta.description, /[\u0E00-\u0E7F]/);
      }
    });
  }
});

test('retired routes and old profile links use the overview canonical and social card', () => {
  for (const path of ['/brand-film', '/leaderboard/', '/@profile', '/@example-trader', '/missing']) {
    const meta = getSeoMetadataForRoute(path, 'en', origin);
    assert.deepEqual(meta, getSeoMetadataForRoute('/', 'en', origin));
    assert.equal(meta.ogImage, `${origin}/og-share.jpg`);
  }
});

test('breadcrumbs point to the overview and the actual localized page', () => {
  for (const lang of languages) {
    for (const route of VALID_APP_ROUTES) {
      const breadcrumb = buildBreadcrumbStructuredData(route, lang, origin);
      const items = breadcrumb.itemListElement as Array<{ position: number; name: string; item: string }>;
      assert.equal(breadcrumb['@type'], 'BreadcrumbList');
      assert.equal(items.length, route === '/' ? 1 : 2);
      assert.equal(items[0].item, origin + '/');
      assert.equal(items.at(-1)?.item, origin + route);
      if (route !== '/') {
        assert.equal(items[1].position, 2);
        assert.equal(items[1].name, getRouteNavigationContext(route, lang).currentItem.title);
      }
    }
  }
});

test('SSR uses the canonical, language alternate, and raster og-share.jpg URL for every route', () => {
  for (const route of VALID_APP_ROUTES) {
    const seo = getSeoMetadataForRoute(route, 'th', origin);
    const html = renderSsrSeoHeadTags(route, 'th', origin);
    assert.ok(html.includes(`rel="canonical" href="${seo.canonicalUrl}"`));
    assert.ok(html.includes(`hreflang="th" href="${seo.alternates.th}"`));
    assert.ok(html.includes('property="og:locale" content="th_TH"'));
    assert.ok(html.includes(`property="og:image" content="${origin}/og-share.jpg"`));
    assert.ok(html.includes('property="og:image:type" content="image/jpeg"'));
    assert.ok(html.includes('<script id="tallynx-structured-data"'));
    assert.ok(html.includes('<script id="tallynx-breadcrumb-data"'));
    assert.ok(!html.includes('profile:username'));
  }
});

test('the noscript navigation links to exactly the seven core pages and retains the language', () => {
  for (const lang of languages) {
    const html = renderSsrNoscriptNavigation('/workspace', lang, origin);
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1]));
    assert.deepEqual(links.map(({ pathname }) => pathname), VALID_APP_ROUTES);
    assert.ok(links.every((link) => link.origin === origin && link.searchParams.get('lang') === lang));
    assert.ok(html.includes('data-route="/workspace"'));
    for (const { items } of getNavCategories(lang)) {
      for (const item of items.filter(({ external }) => !external)) {
        assert.ok(html.includes(`>${item.title}</a>`));
      }
    }
  }
});
