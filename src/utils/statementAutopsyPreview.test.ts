import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTOPSY_MODEL,
  SAMPLE_AUTOPSY_SCENARIOS,
  parseMt5HtmlOrCsvStatement,
  runLandingStatementAutopsy,
  type AutopsyPosition,
} from './statementAutopsyPreview.ts';

function trade(open: string, close: string, netPnlUsd: number, lots = 0.2, stopLossHit = false): AutopsyPosition {
  return {
    openedAt: Date.parse(`2026-06-${open}Z`),
    closedAt: Date.parse(`2026-06-${close}Z`),
    symbol: 'XAUUSD', lots, netPnlUsd, stopLossHit,
  };
}

test('reads standard MT5 HTML positions, with account metadata and deal exit reasons', () => {
  const cells = (values: string[]) => `<tr>${values.map((value) => `<td>${value}</td>`).join('')}</tr>`;
  const statement = parseMt5HtmlOrCsvStatement(`<!DOCTYPE html><html><body><table>
    ${cells(['<b>Company:</b>', 'Example &amp; Co.'])}
    ${cells(['Account:', '123456 (USD, Example-Demo, demo)'])}
    <tr><th colspan="13">Positions</th></tr>
    ${cells(['Time', 'Position', 'Symbol', 'Type', 'Volume', 'Price', 'S / L', 'T / P', 'Time', 'Price', 'Commission', 'Swap', 'Profit'])}
    ${cells(['2026.06.02 08:00:00', '1001', 'XAUUSD', 'buy', '0.60', '2352.00', '2342.00', '', '2026.06.02 08:15:01', '2341.88', '-4.00', '-1.00', '−607.20'])}
    ${cells(['2026.06.02 08:20:00', '1002', 'XAUUSD', 'sell', '0.70', '2342.00', '2346.20', '', '2026.06.02 08:35:00', '2346.20', '-4.00', '0.00', '-294.00'])}
    <tr><th colspan="13">Open Positions</th></tr>
    ${cells(['Time', 'Position', 'Symbol', 'Type', 'Volume', 'Price', 'S / L', 'T / P', 'Profit'])}
    ${cells(['2026.06.02 08:30:00', '1003', 'XAUUSD', 'buy', '0.20', '2348.00', '2346.20', '', '-2.00'])}
    <tr><th colspan="14">Deals</th></tr>
    ${cells(['Time', 'Deal', 'Symbol', 'Type', 'Direction', 'Volume', 'Price', 'Order', 'Commission', 'Fee', 'Swap', 'Profit', 'Balance', 'Comment'])}
    ${cells(['2026.06.02 06:00:00', '5001', '', 'balance', '', '', '', '', '', '', '', '50&nbsp;000.00', '50&nbsp;000.00', 'Initial funding'])}
    ${cells(['2026.06.02 08:15:01', '5003', 'XAUUSD', 'sell', 'out', '0.60', '2341.88', '6003', '-4.00', '0.00', '-1.00', '-607.20', '49&nbsp;387.80', '[sl 2342.00]'])}
    <script>const markup = '${cells(['Initial Balance:', '9000'])}'</script>
  </table></body></html>`);

  assert.equal(statement.firmName, 'Example & Co.');
  assert.equal(statement.currency, 'USD');
  assert.equal(statement.initialBalance, 50_000);
  assert.equal(statement.skippedRows, 0);
  assert.deepEqual(statement.positions, [
    { openedAt: Date.parse('2026-06-02T08:00:00Z'), closedAt: Date.parse('2026-06-02T08:15:01Z'), symbol: 'XAUUSD', lots: 0.6, netPnlUsd: -612.2, stopLossHit: true },
    trade('02T08:20:00', '02T08:35:00', -298, 0.7, true),
  ]);
});

test('parses quoted CSV, preserves offsets, and prefers net P&L over gross and charges', () => {
  const statement = parseMt5HtmlOrCsvStatement([
    '\ufeffBroker,"Example, Inc."',
    'Initial Balance,"$100,000.00"',
    'Open Time,Close Time,Symbol,Lots,Profit,Net PnL,Commission,Stop Loss Hit,Comment',
    '2026-06-02T08:00:00+07:00,2026-06-02T09:00:00+07:00,xauusd,1.2,-120,"(1,240.50)",-4,yes,"Desk ""A"",\nAsia"',
    '2026-06-03T08:00:00Z,2026-06-03T09:15:00Z,xauusd,1.2,150,150,-5,no,SL moved before manual exit',
    '2026.02.30 08:00:00,2026.03.02 09:00:00,xauusd,1.2,100,98,-4,no,invalid date',
    '2026.06.03 09:00:00,2026.06.03 08:00:00,xauusd,1.2,100,98,-4,no,close precedes open',
    '2026.06.03 08:00:00,2026.06.03 09:00:00,xauusd,0,100,98,-4,no,invalid volume',
  ].join('\r\n'));

  assert.equal(statement.firmName, 'Example, Inc.');
  assert.equal(statement.initialBalance, 100_000);
  assert.equal(statement.currency, null);
  assert.equal(statement.skippedRows, 3);
  assert.deepEqual(statement.positions, [
    trade('02T01:00:00', '02T02:00:00', -1_240.5, 1.2, true),
    trade('03T08:00:00', '03T09:15:00', 150, 1.2),
  ]);
});

test('accepts semicolon CSV with decimal commas and tab-separated position history', () => {
  const semicolon = parseMt5HtmlOrCsvStatement([
    'Starting Balance;50.000,00',
    'Time;Symbol;Type;Volume;Time;Profit (USD);Commission;Swap;Fee',
    '2026.06.02 09:00;EURUSD;sell;0,25;2026.06.02 10:00;1.234,50;-2,25;-0,25;-1,00',
  ].join('\n'));
  assert.equal(semicolon.initialBalance, 50_000);
  assert.equal(semicolon.currency, 'USD');
  assert.equal(semicolon.positions[0].lots, 0.25);
  assert.equal(semicolon.positions[0].netPnlUsd, 1_231);

  const tabbed = parseMt5HtmlOrCsvStatement([
    'Opened At\tClosed At\tSymbol\tLots\tnet_pnl_eur\tClose Reason',
    '2026.06.02 08:00\t2026.06.02 08:17\tXAUUSD\t0.2\t-100\tDEAL_REASON_SL',
  ].join('\n'));
  assert.equal(tabbed.initialBalance, null);
  assert.equal(tabbed.currency, 'EUR');
  assert.equal(tabbed.positions[0].stopLossHit, true);
});

test('recognizes MT5 column headings and trade sides in Thai', () => {
  const statement = parseMt5HtmlOrCsvStatement([
    'เวลาเปิด,เวลาปิด,สัญลักษณ์,ประเภท,ปริมาณ,กำไร,หมายเหตุ',
    '2026.06.02 09:00,2026.06.02 09:10,XAUUSD,ซื้อ,0.2,-200,[sl 2300]',
  ].join('\n'));
  assert.deepEqual(statement.positions, [trade('02T09:00:00', '02T09:10:00', -200, 0.2, true)]);
});

test('reads currency from the starting balance and handles an explicit open time with a generic close time', () => {
  const statement = parseMt5HtmlOrCsvStatement([
    'Initial Balance,50 000 EUR',
    'Open Time,Time,Symbol,Lots,Profit',
    '2026.06.02 09:00,2026.06.02 09:10,XAUUSD,0.2,-200',
  ].join('\n'));
  assert.equal(statement.currency, 'EUR');
  assert.equal(statement.initialBalance, 50_000);
  assert.deepEqual(statement.positions, [trade('02T09:00:00', '02T09:10:00', -200)]);
});

test('recovers closed deal fills with allocated entry costs and excludes cash movements', () => {
  const statement = parseMt5HtmlOrCsvStatement([
    'Time,Position ID,Symbol,Type,Entry,Volume,Commission,Fee,Swap,Profit,Balance,Comment',
    '2026.06.02 06:00,,,balance,,,,,,50000,50000,deposit',
    '2026.06.02 07:00,123,XAUUSD,buy,in,1.00,-4,0,0,0,49996,entry',
    '2026.06.02 07:30,123,XAUUSD,sell,out,0.25,-1,-1,0,100,50094,first exit',
    '2026.06.02 08:00,123,XAUUSD,sell,out,0.75,-3,0,-2,-250,49839,Stop Loss',
    '2026.06.02 09:00,,,balance,,,,,,-5000,44839,withdrawal',
    '2026.06.02 10:00,999,XAUUSD,sell,out,0.75,-3,0,0,100,44936,unmatched exit',
  ].join('\n'));

  assert.equal(statement.initialBalance, 50_000);
  assert.equal(statement.skippedRows, 1);
  assert.deepEqual(statement.positions, [
    trade('02T07:00:00', '02T07:30:00', 97, 0.25),
    trade('02T07:00:00', '02T08:00:00', -258, 0.75, true),
  ]);
});

test('skips ambiguous deal matches and keeps an empty result for unrelated documents', () => {
  const statement = parseMt5HtmlOrCsvStatement([
    'Time,Symbol,Type,Direction,Volume,Profit',
    '2026.06.02 07:00,XAUUSD,buy,in,0.50,0',
    '2026.06.02 07:30,XAUUSD,buy,in,0.50,0',
    '2026.06.02 08:30,XAUUSD,sell,out,0.50,199',
    '2026.06.02 09:30,XAUUSD,sell,out,0.50,259',
  ].join('\n'));
  assert.equal(statement.skippedRows, 2);
  assert.deepEqual(statement.positions, []);
  assert.deepEqual(parseMt5HtmlOrCsvStatement('<html><p>unrelated export</p></html>').positions, []);
  assert.deepEqual(parseMt5HtmlOrCsvStatement('Open Time,Symbol,Volume,Profit').positions, []);
});

test('flags the inclusive timing and lot thresholds, using entry time and confirmed stops', () => {
  const trades = [
    trade('02T08:00:00', '02T09:00:00', -200, 0.2, true),
    trade('02T08:59:59', '02T09:03:00', -35),
    trade('02T09:00:00', '02T09:02:00', -50),
    trade('02T09:15:00', '02T09:20:00', 40),
    trade('02T09:15:01', '02T09:21:00', -60),
    trade('02T12:30:00', '02T12:45:00', -70, 0.3),
    trade('02T13:30:00', '02T14:00:00', 25),
  ];
  const result = runLandingStatementAutopsy(trades, 50_000, 'Test account');

  assert.equal(result.firmName, 'Test account');
  assert.equal(result.actualNetPnlUsd, -350);
  assert.equal(result.tiltTradeCount, 3);
  assert.equal(result.preventableTiltLossUsd, 120);
  assert.equal(result.counterfactualNetPnlUsd, -270);
  assert.equal(result.worstSession, 'LONDON');
  assert.equal(result.worstDailyClosedLossUsd, 375);
  assert.equal(result.disciplinedWorstDailyClosedLossUsd, 295);
  assert.deepEqual(result.equityCurve[0], { step: 0, actualEquity: 50_000, disciplinedEquity: 50_000 });
  assert.deepEqual(result.equityCurve[2], { step: 2, actualEquity: 49_750, disciplinedEquity: 49_800 });
  assert.deepEqual(result.equityCurve[7], { step: 7, actualEquity: 49_650, disciplinedEquity: 49_730 });
  assert.equal(trades[1].closedAt, Date.parse('2026-06-02T09:03:00Z'));
  assert.deepEqual(result, runLandingStatementAutopsy([...trades].reverse(), 50_000, 'Test account'));
});

test('does not count an at-entry stop as following itself or an unmarked loss as a stop', () => {
  const positions = [
    trade('02T07:30:00', '02T07:45:00', -12),
    trade('02T07:47:00', '02T07:48:00', -30, 0.4),
    trade('02T08:00:00', '02T08:00:00', -15, 0.2, true),
    trade('02T08:04:00', '02T08:06:00', -15),
  ];
  const result = runLandingStatementAutopsy(positions, 10_000, 'Demo');
  assert.equal(result.tiltTradeCount, 1);
  assert.equal(result.preventableTiltLossUsd, 15);
});

test('checks the best closed day against 40% of total net P&L without capping the share', () => {
  const positions = [
    trade('02T22:05:00', '03T01:00:00', 400),
    trade('04T07:00:00', '04T08:00:00', 300),
    trade('05T13:00:00', '05T17:00:00', 300),
  ];
  const atCap = runLandingStatementAutopsy(positions, 50_000, 'Demo');
  assert.equal(atCap.bestDaySharePct, 40);
  assert.equal(atCap.bestDayThresholdReached, true);
  assert.equal(atCap.worstSession, 'LONDON');

  const concentrated = runLandingStatementAutopsy([
    positions[0], trade('04T13:00:00', '04T13:15:00', -200),
  ], 50_000, 'Demo');
  assert.equal(concentrated.bestDaySharePct, 200);
  assert.equal(concentrated.worstSession, 'NEW_YORK');

  const nonpositive = runLandingStatementAutopsy([
    positions[0], trade('04T12:59:00', '04T13:15:00', -400),
  ], 50_000, 'Demo');
  assert.equal(nonpositive.bestDaySharePct, null);
  assert.equal(nonpositive.bestDayThresholdReached, false);
  assert.equal(nonpositive.worstSession, 'LONDON');
});

test('simulates the documented loss floor and gain target on deterministic historical paths', () => {
  const loss = runLandingStatementAutopsy([trade('02T06:59:00', '02T07:30:00', -110)], 50_000, 'Demo');
  assert.equal(loss.currentRuinPct, 100);
  assert.equal(loss.reducedRiskRuinPct, 0);
  assert.equal(loss.currentPassPct, 0);
  assert.equal(loss.worstSession, 'ASIA');

  const gain = runLandingStatementAutopsy([trade('02T13:00:00', '02T13:30:00', 90)], 50_000, 'Demo');
  assert.equal(gain.currentPassPct, 100);
  assert.equal(gain.reducedRiskPassPct, 0);
  assert.equal(gain.reducedRiskRuinPct, 0);
  assert.equal(gain.worstSession, 'NEW_YORK');
  assert.equal(AUTOPSY_MODEL.simulationTrades, 50);

  const positions = [trade('02T06:10:00', '02T06:30:00', -850), trade('02T07:00:00', '02T07:30:00', 910)];
  const mixed = runLandingStatementAutopsy(positions, 50_000, 'Demo');
  assert.deepEqual(mixed, runLandingStatementAutopsy(positions, 50_000, 'Demo'));
  assert.ok(mixed.currentRuinPct > 0 && mixed.currentRuinPct < 100);
  assert.ok(mixed.currentPassPct > 0 && mixed.currentPassPct + mixed.currentRuinPct <= 100);
  assert.ok(mixed.reducedRiskPassPct + mixed.reducedRiskRuinPct <= 100);
});

test('keeps the landing proof numbers tied to the three sample histories', () => {
  const [tilt, consistency, clean] = SAMPLE_AUTOPSY_SCENARIOS.map(({ positions, initialBalance, firmName }) =>
    runLandingStatementAutopsy(positions, initialBalance, firmName),
  );
  assert.deepEqual(SAMPLE_AUTOPSY_SCENARIOS.map((preset) => preset.id), ['xau_tilt', 'consistency_trap', 'clean_guard']);
  assert.equal(tilt.tiltTradeCount, 3);
  assert.equal(tilt.preventableTiltLossUsd, 1_840);
  assert.equal(tilt.worstDailyClosedLossUsd, 2_660);
  assert.equal(tilt.disciplinedWorstDailyClosedLossUsd, 820);
  assert.equal(tilt.actualNetPnlUsd, -1_605);
  assert.equal(tilt.counterfactualNetPnlUsd, 235);
  assert.equal(consistency.bestDaySharePct, 48);
  assert.equal(consistency.disciplinedBestDaySharePct, 38.4);
  assert.equal(consistency.bestDayThresholdReached, true);
  assert.equal(clean.tiltTradeCount, 0);
  assert.equal(clean.bestDayThresholdReached, false);
  assert.equal(clean.actualNetPnlUsd, clean.counterfactualNetPnlUsd);
});

test('handles empty history and rejects invalid starting balances', () => {
  const result = runLandingStatementAutopsy([], 10_000, 'Demo');
  assert.equal(result.worstSession, null);
  assert.equal(result.bestDaySharePct, null);
  assert.equal(result.currentRuinPct, 0);
  assert.deepEqual(result.equityCurve, [{ step: 0, actualEquity: 10_000, disciplinedEquity: 10_000 }]);
  for (const balance of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => runLandingStatementAutopsy([], balance, 'Demo'), RangeError);
  }
});
