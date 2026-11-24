import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_TABS,
  getNextTabIndex,
  calculateDrawdownSimulation,
} from './orbitLogic.ts';

test('both languages cover the same three Desk walkthroughs with localized copy', () => {
  const { en, th } = WORKSPACE_TABS;
  assert.deepEqual(en.map(({ id }) => id), ['visibility', 'limits', 'trades']);
  assert.deepEqual(th.map(({ id }) => id), en.map(({ id }) => id));

  th.forEach((tab, index) => {
    assert.match(tab.title, /[\u0E00-\u0E7F]/);
    assert.match(tab.description, /[\u0E00-\u0E7F]/);
    assert.equal(tab.metrics.length, en[index].metrics.length);
  });
});

test('Workspace tab navigation wraps forward and backward', () => {
  assert.equal(getNextTabIndex(0, 3), 1);
  assert.equal(getNextTabIndex(2, 3, 1), 0);
  assert.equal(getNextTabIndex(0, 3, -1), 2);
  assert.equal(getNextTabIndex(0, 0), 0);
});

const account = {
  accountBalance: 100000,
  currentEquity: 99500,
  dailyLossLimitPct: 3,
  maxDrawdownLimitPct: 8,
  todayRealizedLoss: 200,
};

test('drawdown simulation includes both realized and floating losses', () => {
  const result = calculateDrawdownSimulation(account);
  assert.equal(result.dailyLossLimitAmount, 3000);
  assert.equal(result.maxDrawdownLimitAmount, 8000);
  assert.equal(result.currentFloatingLoss, 500);
  assert.equal(result.totalDailyLossUsed, 700);
  assert.equal(result.dailyBufferRemaining, 2300);
  assert.equal(result.overallBufferRemaining, 7300);
  assert.equal(result.status, 'NOMINAL');
});

test('drawdown warnings start at 55% and 85% of the loss budget and usage caps at 100%', () => {
  const simulateLoss = (floatingLoss: number) => calculateDrawdownSimulation({
    ...account,
    currentEquity: account.accountBalance - floatingLoss,
    todayRealizedLoss: 0,
  });
  assert.equal(simulateLoss(1649).status, 'NOMINAL');
  assert.equal(simulateLoss(1650).status, 'CAUTION');
  assert.equal(simulateLoss(2549).status, 'CAUTION');
  assert.equal(simulateLoss(2550).status, 'GUARD_ACTIVE');
  const breached = simulateLoss(3300);
  assert.equal(breached.dailyBufferRemaining, 0);
  assert.equal(breached.dailyUsageRatio, 1);
});

test('drawdown simulation uses no floating loss when equity exceeds balance', () => {
  const result = calculateDrawdownSimulation({ ...account, currentEquity: 101000, todayRealizedLoss: -50 });
  assert.equal(result.currentFloatingLoss, 0);
  assert.equal(result.totalDailyLossUsed, 0);
  assert.equal(result.dailyBufferRemaining, result.dailyLossLimitAmount);
});
