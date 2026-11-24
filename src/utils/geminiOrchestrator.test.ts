import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GEMINI_DECISION_MODEL,
  GEMINI_FLASH_LITE_31,
  GEMINI_FLASH_LITE_35,
  executeWithFlashLiteFailover,
  planModelRoute,
  type DecisionClientLike,
} from './geminiOrchestrator.ts';

test('geminiOrchestrator constants use verified 2026 model IDs', () => {
  assert.equal(GEMINI_DECISION_MODEL, 'gemini-decision-1');
  assert.equal(GEMINI_FLASH_LITE_35, 'gemini-3.5-flash-lite');
  assert.equal(GEMINI_FLASH_LITE_31, 'gemini-3.1-flash-lite');
});

test('planModelRoute uses gemini-decision-1 to route deep risk questions to 3.5-flash-lite first', async () => {
  const mockDecision: DecisionClientLike = {
    decisions: {
      create: async () => ({
        answers: {
          complexity: { type: 'choice', choice: 'deep_analysis', confidence: 0.91 },
          asks_for_trade_signal: { type: 'noul', noul: 0.12, confidence: 0.88 },
        },
      }),
    },
  };

  const plan = await planModelRoute({
    prompt: 'Analyze my daily drawdown velocity and 40% consistency cap buffer.',
    preference: 'auto',
    decisionClient: mockDecision,
  });

  assert.equal(plan.routedBy, 'decision-1');
  assert.equal(plan.routeTier, 'deep_analysis');
  assert.deepEqual(plan.candidateModels, [GEMINI_FLASH_LITE_35, GEMINI_FLASH_LITE_31]);
  assert.equal(plan.asksForTradeSignal, false);
});

test('planModelRoute routes simple queries to 3.1-flash-lite first and flags signal requests', async () => {
  const mockDecision: DecisionClientLike = {
    decisions: {
      create: async () => ({
        answers: {
          complexity: { type: 'choice', choice: 'quick_reply', confidence: 0.87 },
          asks_for_trade_signal: { type: 'noul', noul: 0.94, confidence: 0.94 },
        },
      }),
    },
  };

  const plan = await planModelRoute({
    prompt: 'Should I buy XAUUSD right now?',
    preference: 'auto',
    decisionClient: mockDecision,
  });

  assert.equal(plan.routedBy, 'decision-1');
  assert.equal(plan.routeTier, 'quick_reply');
  assert.deepEqual(plan.candidateModels, [GEMINI_FLASH_LITE_31, GEMINI_FLASH_LITE_35]);
  assert.equal(plan.asksForTradeSignal, true);
});

test('planModelRoute fails open to heuristic when gemini-decision-1 errors', async () => {
  const brokenDecision: DecisionClientLike = {
    decisions: {
      create: async () => {
        throw new Error('429 RESOURCE_EXHAUSTED');
      },
    },
  };

  const plan = await planModelRoute({
    prompt: 'Hello!',
    preference: 'auto',
    decisionClient: brokenDecision,
  });

  assert.equal(plan.routedBy, 'heuristic');
  assert.deepEqual(plan.candidateModels, [GEMINI_FLASH_LITE_31, GEMINI_FLASH_LITE_35]);
});

test('executeWithFlashLiteFailover falls back seamlessly from 3.5 to 3.1 on 429 quota error', async () => {
  const plan = await planModelRoute({
    prompt: 'Analyze MT5 risk telemetry',
    preference: GEMINI_FLASH_LITE_35,
  });

  const called: string[] = [];
  const result = await executeWithFlashLiteFailover(plan, async (model) => {
    called.push(model);
    if (model === GEMINI_FLASH_LITE_35) {
      throw new Error('429 RESOURCE_EXHAUSTED: free tier RPM exceeded');
    }
    return 'Telemetry verified via failover';
  });

  assert.deepEqual(called, [GEMINI_FLASH_LITE_35, GEMINI_FLASH_LITE_31]);
  assert.equal(result.model, GEMINI_FLASH_LITE_31);
  assert.equal(result.failoverUsed, true);
  assert.equal(result.reply, 'Telemetry verified via failover');
});

test('executeWithFlashLiteFailover does not swallow invalid API key 401/403 errors', async () => {
  const plan = await planModelRoute({
    prompt: 'Hi',
    preference: GEMINI_FLASH_LITE_31,
  });

  await assert.rejects(
    executeWithFlashLiteFailover(plan, async () => {
      throw new Error('403 API_KEY_INVALID');
    }),
    /API_KEY_INVALID/,
  );
});
