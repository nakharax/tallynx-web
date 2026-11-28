import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DESK_IDEAS_CATALOG,
  filterAndSortDeskIdeas,
  validateDeskSubmission,
  createVerifiedDeskIdea,
  calculateLicenseBagTotal,
  buildDeskConfigExport,
  findDeskIdeaFromSearch,
} from './marketplaceLogic';

test('DESK_IDEAS_CATALOG spans multiple engines with non-custodial channel metadata', () => {
  const engines = new Set(DESK_IDEAS_CATALOG.map((item) => item.engineType));
  assert.ok(engines.has('ghr-v32'));
  assert.ok(engines.has('custom-desk'));
  assert.ok(engines.has('ea-guard'));
  assert.ok(engines.has('macro-playbook'));

  for (const item of DESK_IDEAS_CATALOG) {
    assert.ok(item.verificationProof.ledgerHash.startsWith('sample-blueprint:'));
    assert.ok(item.verificationProof.verifiedDealsCount > 0);
    assert.ok(item.metrics.maxDrawdownPct > 0);
  }
});

test('filterAndSortDeskIdeas filters by category, verification method, search query, and sorts cleanly', () => {
  const customOnly = filterAndSortDeskIdeas(DESK_IDEAS_CATALOG, {
    query: '',
    category: 'custom-engine',
    verificationMethod: 'all',
    sortKey: 'featured',
  });
  assert.equal(customOnly.length, 1);
  assert.equal(customOnly[0].engineType, 'custom-desk');

  const sortedByDd = filterAndSortDeskIdeas(DESK_IDEAS_CATALOG, {
    query: '',
    category: 'all',
    verificationMethod: 'all',
    sortKey: 'lowest-dd',
  });
  assert.ok(sortedByDd[0].metrics.maxDrawdownPct <= sortedByDd[1].metrics.maxDrawdownPct);

  const searchGold = filterAndSortDeskIdeas(DESK_IDEAS_CATALOG, {
    query: 'London Open Gold',
    category: 'all',
    verificationMethod: 'cloud-api-sync',
    sortKey: 'featured',
  });
  assert.equal(searchGold.length, 1);
  assert.equal(searchGold[0].id, 'idea-ghr-prop-shield');
});

test('validateDeskSubmission fails closed when channel proof reference or metrics are missing', () => {
  const invalidResult = validateDeskSubmission({
    title: 'Ab',
    creatorHandle: '',
    engineType: 'custom-desk',
    category: 'custom-engine',
    verificationMethod: 'cloud-api-sync',
    accountOrHashRef: '12',
    brokerServer: '',
    maxDrawdownPct: 0,
    winRatePct: 120,
    profitFactor: 0,
    priceUsd: -5,
    summary: 'short',
  });

  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.length >= 6);

  const validResult = validateDeskSubmission({
    title: 'Frankfurt DAX Tight Range Desk',
    creatorHandle: '@dax.desk',
    engineType: 'custom-desk',
    category: 'custom-engine',
    verificationMethod: 'ea-local-bridge',
    accountOrHashRef: '99201455',
    brokerServer: 'RawSpread-Live02',
    maxDrawdownPct: 1.9,
    winRatePct: 58,
    profitFactor: 2.15,
    priceUsd: 0,
    summary: 'Frankfurt open range blueprint configured for Live Bridge (.ex5) telemetry.',
  });

  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);
});

test('createVerifiedDeskIdea creates honest unverified drafts without fake sha256 hashes or synthetic deals', () => {
  const created = createVerifiedDeskIdea(
    {
      title: 'Frankfurt DAX Tight Range Desk',
      creatorHandle: 'dax.desk',
      engineType: 'custom-desk',
      category: 'custom-engine',
      verificationMethod: 'ea-local-bridge',
      accountOrHashRef: '99201455',
      brokerServer: 'RawSpread-Live02',
      maxDrawdownPct: 1.9,
      winRatePct: 58,
      profitFactor: 2.15,
      priceUsd: 45,
      summary: 'Frankfurt open range blueprint configured for Live Bridge (.ex5) telemetry.',
    },
    DESK_IDEAS_CATALOG.length
  );

  assert.equal(created.creatorHandle, '@dax.desk');
  assert.equal(created.verificationProof.ledgerHash, 'pending-desk-verification');
  assert.equal(created.verificationProof.verifiedDealsCount, 0);
  assert.equal(created.sampleDeals.length, 0);

  const bag = calculateLicenseBagTotal([
    created,
    DESK_IDEAS_CATALOG.find((x) => x.priceUsd === 0)!,
  ]);
  assert.equal(bag.count, 2);
  assert.equal(bag.subtotalUsd, 45);
  assert.equal(bag.freeCount, 1);
  assert.equal(bag.paidCount, 1);

  const exported = JSON.parse(buildDeskConfigExport(created));
  assert.equal(exported.schema, 'tallynx.desk-blueprint/v5.2');
  assert.equal(exported.execution_boundary.auto_copy_trade, false);
  assert.equal(exported.execution_boundary.orders_route, 'LOCAL_MT5_ONLY');
});

test('findDeskIdeaFromSearch resolves ?idea=<id> query string to the matching DeskIdeaItem', () => {
  const found = findDeskIdeaFromSearch('?idea=idea-ny-index-custom', DESK_IDEAS_CATALOG);
  assert.ok(found);
  assert.equal(found.id, 'idea-ny-index-custom');
  assert.equal(findDeskIdeaFromSearch('?idea=non-existent', DESK_IDEAS_CATALOG), null);
  assert.equal(findDeskIdeaFromSearch('', DESK_IDEAS_CATALOG), null);
});
