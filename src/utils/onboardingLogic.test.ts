import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TRANSFER_STATE,
  calculateThreeTpLadderPlan,
  buildDeskHandoffUrl,
  parseTransferStateFromSearch,
  getSevenDayHealthSummary,
  evaluateTwelveGateReadiness,
  TWELVE_GATE_ITEMS,
  applyPropFirmPreset,
  detectActivePropFirmPreset,
  mapEngineCodeToDeskScreen,
} from './onboardingLogic';

test('calculateThreeTpLadderPlan computes exact $10k 1% risk 3-TP splits and consistency checks', () => {
  const plan = calculateThreeTpLadderPlan(DEFAULT_TRANSFER_STATE);

  assert.equal(plan.riskUsd, 100);
  assert.equal(plan.totalLots, 0.4); // $100 / (25 * 10) = 0.40 lots
  assert.equal(plan.targets.length, 3);
  assert.equal(plan.targets[0].profitUsd, 40);
  assert.equal(plan.targets[1].profitUsd, 70);
  assert.equal(plan.targets[2].profitUsd, 87.5);
  assert.equal(plan.fullWinUsd, 197.5);
  assert.equal(plan.blendedR, 1.98);
  assert.equal(plan.dailyDdLimitUsd, 400);
  assert.equal(plan.tradesBeforeDailyFloor, 4);
  assert.equal(plan.consistencyStatus, 'SAFE');

  const breachPlan = calculateThreeTpLadderPlan({
    ...DEFAULT_TRANSFER_STATE,
    mode: 'prop',
    simulatedDaySharePct: 44,
  });
  assert.equal(breachPlan.consistencyStatus, 'BREACH');
});

test('buildDeskHandoffUrl & parseTransferStateFromSearch round-trip sandbox settings across subdomains', () => {
  const input = {
    accountSize: 50000,
    riskPct: 1.5,
    slPips: 30,
    symbol: 'EURUSD' as const,
    mode: 'personal' as const,
    dailyDdLimitPct: 5,
    simulatedDaySharePct: 36,
  };

  const url = buildDeskHandoffUrl('https://desk.tallynx.com/', input, {
    step: 3,
    via: 'cloud',
    source: 'landing_15s',
    lang: 'th',
    theme: 'dark',
    page: 'calc',
  });

  const target = new URL(url);
  assert.equal(target.searchParams.get('lang'), 'th');
  assert.equal(target.searchParams.get('theme'), 'dark');
  assert.equal(target.searchParams.get('page'), 'calc');
  const parsed = parseTransferStateFromSearch(target.search);

  assert.equal(parsed.hasTransferredParams, true);
  assert.equal(parsed.state.accountSize, 50000);
  assert.equal(parsed.state.riskPct, 1.5);
  assert.equal(parsed.state.slPips, 30);
  assert.equal(parsed.state.symbol, 'EURUSD');
  assert.equal(parsed.state.mode, 'personal');
  assert.equal(parsed.state.dailyDdLimitPct, 5);
  assert.equal(parsed.state.simulatedDaySharePct, 36);
  assert.equal(parsed.state.connectedVia, 'cloud');
});

test('Desk URLs retain base queries and hashes and omit sandbox data for plain launches', () => {
  const url = buildDeskHandoffUrl('/preview?lang=th&campaign=web#chart', undefined, {
    lang: 'en', theme: 'light', page: 'chart',
  });
  assert.equal(url, '/preview?lang=en&campaign=web&theme=light&page=chart#chart');
});

test('getSevenDayHealthSummary builds valid 7-day telemetry consistent with tier and goal', () => {
  const summary = getSevenDayHealthSummary(DEFAULT_TRANSFER_STATE, 'ex5');
  assert.equal(summary.tierUsed, 'ex5');
  assert.equal(summary.days.length, 7);
  assert.ok(summary.netProfitUsd > 0);
  assert.ok(summary.heartbeatLatencyMs < 1400);
  assert.equal(summary.consistencyPass, true);
});

test('evaluateTwelveGateReadiness enforces critical gates before permitting execution readiness', () => {
  assert.equal(TWELVE_GATE_ITEMS.length, 12);

  const partial = evaluateTwelveGateReadiness(['g1', 'g2', 'g3']);
  assert.equal(partial.readyToExecute, false);
  assert.equal(partial.criticalPassed, false);

  const allCriticalOnly = TWELVE_GATE_ITEMS.filter((g) => g.critical).map((g) => g.id);
  const criticalOnlyEval = evaluateTwelveGateReadiness(allCriticalOnly);
  assert.equal(criticalOnlyEval.criticalPassed, true);
  assert.equal(criticalOnlyEval.readyToExecute, false); // requires >= 9 checked

  const nineWithCritical = [...allCriticalOnly, 'g3', 'g5', 'g6'];
  const readyEval = evaluateTwelveGateReadiness(nineWithCritical);
  assert.equal(readyEval.readyToExecute, true);
});

test('applyPropFirmPreset, detectActivePropFirmPreset, and mapEngineCodeToDeskScreen map presets and screens accurately', () => {
  const ftmoState = applyPropFirmPreset(DEFAULT_TRANSFER_STATE, 'ftmo');
  assert.equal(ftmoState.mode, 'prop');
  assert.equal(ftmoState.dailyDdLimitPct, 5.0);
  assert.equal(detectActivePropFirmPreset(ftmoState), 'ftmo');

  const the5ersState = applyPropFirmPreset(DEFAULT_TRANSFER_STATE, 'the5ers');
  assert.equal(the5ersState.dailyDdLimitPct, 3.0);
  assert.equal(the5ersState.riskPct, 0.5);
  assert.equal(detectActivePropFirmPreset(the5ersState), 'the5ers');

  const personalState = applyPropFirmPreset(DEFAULT_TRANSFER_STATE, 'personal');
  assert.equal(personalState.mode, 'personal');
  assert.equal(detectActivePropFirmPreset(personalState), 'personal');

  assert.equal(mapEngineCodeToDeskScreen('01. Ladder Math'), 'calc');
  assert.equal(mapEngineCodeToDeskScreen('02. Prop Compliance'), 'analysis');
  assert.equal(mapEngineCodeToDeskScreen('03. AI Guardrails'), 'gate');
  assert.equal(mapEngineCodeToDeskScreen('04. Zero-Custody Sync'), 'chart');
  assert.equal(mapEngineCodeToDeskScreen('05. Cloud & SSO'), 'analysis');
});
