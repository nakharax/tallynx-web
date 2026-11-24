import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCrossSubdomainSsoUrl,
  normalizeTraderHandle,
} from './tallynxEcosystemLogic';

test('SSO normalizes a caller-supplied handle for the existing handoff contract', () => {
  assert.equal(normalizeTraderHandle(' /@Desk.Trader-1_ '), 'desk.trader-1_');
  assert.equal(normalizeTraderHandle('@Desk Trader!'), 'desktrader');
  assert.equal(normalizeTraderHandle('/@#'), '');
});

test('SSO adds handoff parameters while preserving the target Desk page', () => {
  const url = new URL(buildCrossSubdomainSsoUrl({
    baseDeskUrl: 'https://desk.tallynx.com/?page=calc',
    handle: '@Desk.Trader',
    lang: 'th',
    fromPath: '/',
    ssoToken: 'test-token',
  }));

  assert.equal(url.origin, 'https://desk.tallynx.com');
  assert.equal(url.searchParams.get('page'), 'calc');
  assert.equal(url.searchParams.get('source'), 'tallynx-portal');
  assert.equal(url.searchParams.get('profile'), 'desk.trader');
  assert.equal(url.searchParams.get('lang'), 'th');
  assert.equal(url.searchParams.get('from'), '/');
  assert.equal(url.searchParams.get('sso_token'), 'test-token');
});

test('SSO keeps the existing Mall fallback and omits absent optional parameters', () => {
  const url = new URL(buildCrossSubdomainSsoUrl({}));
  assert.equal(url.origin, 'https://mall.tallynx.com');
  assert.deepEqual([...url.searchParams], [['source', 'tallynx-portal']]);
});
