import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANDING_AUTOPSY_PROOF,
  LANDING_MARKETPLACE_SPOTLIGHT,
} from './landingSpotlightData';
import { DESK_IDEAS_CATALOG } from './marketplaceLogic';
import {
  SAMPLE_AUTOPSY_SCENARIOS,
  runLandingStatementAutopsy,
} from './statementAutopsyPreview';

test('LANDING_AUTOPSY_PROOF stays synchronized with live sample autopsy computations', () => {
  const [tilt, consistency] = SAMPLE_AUTOPSY_SCENARIOS.slice(0, 2).map((sample) =>
    runLandingStatementAutopsy(sample.positions, sample.initialBalance, sample.firmName),
  );

  assert.equal(LANDING_AUTOPSY_PROOF.tilt.worstDailyClosedLossUsd, tilt.worstDailyClosedLossUsd);
  assert.equal(
    LANDING_AUTOPSY_PROOF.tilt.disciplinedWorstDailyClosedLossUsd,
    tilt.disciplinedWorstDailyClosedLossUsd,
  );
  assert.equal(LANDING_AUTOPSY_PROOF.tilt.preventableTiltLossUsd, tilt.preventableTiltLossUsd);
  assert.equal(LANDING_AUTOPSY_PROOF.tilt.tiltTradeCount, tilt.tiltTradeCount);
  assert.equal(LANDING_AUTOPSY_PROOF.consistency.bestDaySharePct, consistency.bestDaySharePct);
  assert.equal(
    LANDING_AUTOPSY_PROOF.consistency.disciplinedBestDaySharePct,
    consistency.disciplinedBestDaySharePct,
  );
});

test('LANDING_MARKETPLACE_SPOTLIGHT matches top 3 DESK_IDEAS_CATALOG records', () => {
  const topThree = DESK_IDEAS_CATALOG.slice(0, 3);
  assert.equal(LANDING_MARKETPLACE_SPOTLIGHT.length, topThree.length);

  LANDING_MARKETPLACE_SPOTLIGHT.forEach((spot, index) => {
    const item = topThree[index];
    assert.equal(spot.id, item.id);
    assert.equal(spot.title, item.title);
    assert.equal(spot.creatorHandle, item.creatorHandle);
    assert.equal(spot.engineType, item.engineType);
    assert.equal(spot.verificationMethod, item.verificationMethod);
    assert.equal(spot.brokerServer, item.verificationProof.brokerServer);
    assert.equal(spot.summary, item.summary);
    assert.equal(spot.summaryTh, item.summaryTh);
    assert.equal(spot.maxDrawdownPct, item.metrics.maxDrawdownPct);
    assert.equal(spot.profitFactor, item.metrics.profitFactor);
    assert.equal(spot.priceUsd, item.priceUsd);
  });
});
