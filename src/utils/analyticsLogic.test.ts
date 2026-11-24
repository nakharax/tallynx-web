import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MT5_DEAL_AUDIT_SAMPLES,
  MT5_SESSION_LEDGER,
  RISK_BUDGET_PRESETS,
  summarizeDealMatrix,
  computeWaffleAllocation,
  computeOlsRegression,
  filterAndSortSessions,
  buildAnalyticsCsv,
  generateInitialDrawdownStream,
  appendNextDrawdownTick,
  summarizeDrawdownStream,
  classifyStreamGateStatus,
} from './analyticsLogic';

test('MT5_DEAL_AUDIT_SAMPLES has 120 records with exact outcome distribution', () => {
  assert.equal(MT5_DEAL_AUDIT_SAMPLES.length, 120);

  const byOutcome = summarizeDealMatrix(MT5_DEAL_AUDIT_SAMPLES, 'outcome');
  assert.equal(byOutcome.length, 4);
  const sum = byOutcome.reduce((acc, row) => acc + row.count, 0);
  assert.equal(sum, 120);
  assert.equal(byOutcome[0].key, 'disciplined');
  assert.equal(byOutcome[0].count, 88);

  const bySession = summarizeDealMatrix(MT5_DEAL_AUDIT_SAMPLES, 'session');
  assert.equal(
    bySession.reduce((acc, row) => acc + row.count, 0),
    120
  );
});

test('computeWaffleAllocation always returns 100 proportional cells', () => {
  for (const preset of RISK_BUDGET_PRESETS) {
    const res = computeWaffleAllocation(
      preset.dailyCapPct,
      preset.realizedLossPct,
      preset.warningBufferPct
    );
    assert.equal(res.cells.length, 100);
    assert.equal(
      res.usedCells + res.bufferCells + res.availableCells,
      100
    );
    assert.ok(res.usedCells > 0);
  }

  // Zero cap defensive fallback
  const zeroCap = computeWaffleAllocation(0, 1, 0.5);
  assert.equal(zeroCap.cells.length, 100);
  assert.equal(zeroCap.availableCells, 100);
});

test('computeOlsRegression calculates exact linear slope, intercept, and R^2', () => {
  const exactLine = computeOlsRegression([
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
    { x: 4, y: 8 },
  ]);
  assert.equal(exactLine.slope, 2);
  assert.equal(exactLine.intercept, 0);
  assert.equal(exactLine.r2, 1);
  assert.equal(exactLine.correlation, 1);
  assert.equal(exactLine.count, 4);

  // Real MT5 sample data yields positive correlation between holding duration and drawdown
  const dealPoints = MT5_DEAL_AUDIT_SAMPLES.map((d) => ({
    x: d.holdingMinutes,
    y: d.drawdownPct,
  }));
  const dealOls = computeOlsRegression(dealPoints);
  assert.equal(dealOls.count, 120);
  assert.ok(dealOls.slope > 0.01);
  assert.ok(dealOls.r2 > 0.7);
});

test('filterAndSortSessions filters by query/status and sorts numerically', () => {
  const xau = filterAndSortSessions(MT5_SESSION_LEDGER, {
    query: 'xauusd',
    statusFilter: 'all',
    sortKey: 'dealsCount',
    sortDir: 'desc',
  });
  assert.equal(xau.length, 2);
  assert.ok(xau[0].dealsCount >= xau[1].dealsCount);

  const gatedOnly = filterAndSortSessions(MT5_SESSION_LEDGER, {
    query: '',
    statusFilter: 'gated',
    sortKey: 'maxDrawdownPct',
    sortDir: 'desc',
  });
  assert.equal(gatedOnly.length, 1);
  assert.equal(gatedOnly[0].instrument, 'US30');

  const empty = filterAndSortSessions(MT5_SESSION_LEDGER, {
    query: 'NONEXISTENT_PAIR',
    statusFilter: 'all',
    sortKey: 'netR',
    sortDir: 'desc',
  });
  assert.equal(empty.length, 0);
});

test('buildAnalyticsCsv generates valid header and rows', () => {
  const csv = buildAnalyticsCsv(MT5_SESSION_LEDGER.slice(0, 2));
  const lines = csv.split('\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[0].startsWith('Cohort ID,Instrument,Session'));
  assert.ok(lines[1].includes('XAUUSD'));
  assert.ok(lines[2].includes('EURUSD'));
});

test('generateInitialDrawdownStream and appendNextDrawdownTick keep bounded sliding window and valid invariants', () => {
  const initial = generateInitialDrawdownStream('calm', 4.0, 24);
  assert.equal(initial.length, 24);
  assert.equal(initial[0].stepIndex, 0);
  assert.equal(initial[23].stepIndex, 23);

  for (const pt of initial) {
    assert.ok(pt.intradayDrawdownPct >= 0 && pt.intradayDrawdownPct <= 4.0);
    assert.equal(
      Number((pt.intradayDrawdownPct + pt.headroomPct).toFixed(2)),
      4.0
    );
    assert.ok(pt.heartbeatMs > 0 && pt.heartbeatMs <= 1400);
  }

  // Append tick with sliding window cap = 24
  const next = appendNextDrawdownTick(initial, 'volatile', 4.0, 24, 0);
  assert.equal(next.length, 24);
  assert.equal(next[0].stepIndex, 1);
  assert.equal(next[23].stepIndex, 24);

  // Spike shock triggers gated status when pushing >= 85% of cap without exceeding daily cap
  const shocked = appendNextDrawdownTick(next, 'breach_test', 4.0, 24, 3.2);
  const lastShocked = shocked[shocked.length - 1];
  assert.ok(lastShocked.intradayDrawdownPct >= 3.4);
  assert.ok(lastShocked.intradayDrawdownPct <= 4.0);
  assert.equal(lastShocked.status, 'gated');
  assert.equal(classifyStreamGateStatus(3.5, 4.0), 'gated');
  assert.equal(classifyStreamGateStatus(2.4, 4.0), 'caution');
  assert.equal(classifyStreamGateStatus(1.2, 4.0), 'nominal');

  const summary = summarizeDrawdownStream(shocked, 4.0);
  assert.equal(summary.currentDdPct, lastShocked.intradayDrawdownPct);
  assert.ok(summary.peakDdPct >= summary.currentDdPct);
  assert.equal(summary.latestStep, 25);
});
