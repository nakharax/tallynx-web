import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialSandboxState,
  simulateCappedLoss,
  simulateDisciplinedWin,
  triggerRevengeOverLot,
  completeSandboxCooldown,
  SANDBOX_COOLDOWN_MINUTES,
} from './ecosystemLogic';

test('the no-login simulation starts with independent ledger and equity histories', () => {
  const first = createInitialSandboxState();
  const second = createInitialSandboxState();
  assert.deepEqual(first, second);
  assert.notEqual(first.events, second.events);
  assert.notEqual(first.equityCurve, second.equityCurve);
  assert.equal(first.equity, 100000);
  assert.equal(first.dailyDdUsedPct, 0.4);
  assert.equal(first.dailyDdLimitPct, 5);
  assert.equal(first.guardrailState, 'SAFE');
  assert.equal(first.cooldownActive, false);
  assert.equal(completeSandboxCooldown(first), first);
});

test('a simulated win records the gain and updates the daily drawdown', () => {
  const session = createInitialSandboxState();
  const win = simulateDisciplinedWin(session);
  assert.equal(win.equity, 100850);
  assert.equal(win.dailyDdUsedPct, 0.25);
  assert.equal(win.wins, session.wins + 1);
  assert.equal(win.totalTrades, session.totalTrades + 1);
  assert.equal(win.cooldownActive, false);
  assert.equal(win.events[0].rMultiple, 1.7);
  assert.equal(win.equityCurve.at(-1), win.equity);
});

test('a stop-loss pauses each trade action for the simulated 15 minutes', () => {
  const loss = simulateCappedLoss(createInitialSandboxState());
  assert.equal(SANDBOX_COOLDOWN_MINUTES, 15);
  assert.equal(loss.equity, 99500);
  assert.equal(loss.dailyDdUsedPct, 0.9);
  assert.equal(loss.events[0].rMultiple, -1);
  assert.equal(loss.cooldownActive, true);

  for (const trade of [simulateDisciplinedWin, simulateCappedLoss, triggerRevengeOverLot]) {
    assert.equal(trade(loss), loss);
  }

  const afterCooldown = completeSandboxCooldown(loss);
  assert.equal(afterCooldown.equity, loss.equity);
  assert.equal(afterCooldown.dailyDdUsedPct, loss.dailyDdUsedPct);
  assert.equal(afterCooldown.events, loss.events);
  assert.equal(afterCooldown.cooldownActive, false);
  assert.equal(simulateDisciplinedWin(afterCooldown).totalTrades, loss.totalTrades + 1);
});

test('an oversized loss retains the risk alert when the cooldown ends', () => {
  const loss = triggerRevengeOverLot(createInitialSandboxState());
  assert.equal(loss.guardrailState, 'ALERT');
  assert.equal(loss.equity, 97900);
  assert.equal(loss.dailyDdUsedPct, 2.5);
  assert.equal(loss.events[0].lotMultiplier, 4);
  assert.equal(loss.cooldownActive, true);
  assert.equal(completeSandboxCooldown(loss).guardrailState, 'ALERT');
});
