import { GoogleGenAI } from '@google/genai';

export const GEMINI_DECISION_MODEL = 'gemini-decision-1' as const;
export const GEMINI_FLASH_LITE_35 = 'gemini-3.5-flash-lite' as const;
export const GEMINI_FLASH_LITE_31 = 'gemini-3.1-flash-lite' as const;

export type GeminiGenerationModel =
  | typeof GEMINI_FLASH_LITE_35
  | typeof GEMINI_FLASH_LITE_31;

export type ChatModelPreference = 'auto' | GeminiGenerationModel;

export interface DecisionRoutePlan {
  requestedPreference: ChatModelPreference;
  candidateModels: [GeminiGenerationModel, GeminiGenerationModel];
  routedBy: 'decision-1' | 'heuristic' | 'manual';
  routeTier: 'deep_analysis' | 'quick_reply';
  decisionConfidence: number;
  asksForTradeSignal: boolean;
  decisionModel: typeof GEMINI_DECISION_MODEL;
}

export interface OrchestratedResult {
  reply: string;
  model: GeminiGenerationModel;
  failoverUsed: boolean;
  route: DecisionRoutePlan;
}

export interface DecisionClientLike {
  decisions: {
    create: (params: {
      model: string;
      input: string;
      questions: Record<
        string,
        | {
            type: 'choice';
            instructions: string;
            criteria: Record<string, string>;
          }
        | {
            type: 'noul';
            instructions: string;
            criteria?: {
              true_description?: string;
              false_description?: string;
            };
          }
      >;
    }) => Promise<{
      answers?: Record<
        string,
        | {
            type: 'choice';
            choice: string;
            confidence: number;
          }
        | {
            type: 'noul';
            noul: number;
            confidence: number;
          }
        | Record<string, unknown>
      >;
    }>;
  };
}

export const SAFE_HARBOR_REMINDER =
  '\n\n[Decision-1 Compliance Guard]: User query may request trade signals or profit predictions. Strictly decline giving buy/sell signals, entry targets, or profit guarantees; provide only objective risk math, drawdown telemetry, and discipline rules.';

export function normalizeChatModelPreference(raw: unknown): ChatModelPreference {
  if (raw === GEMINI_FLASH_LITE_35) return GEMINI_FLASH_LITE_35;
  if (raw === GEMINI_FLASH_LITE_31) return GEMINI_FLASH_LITE_31;
  return 'auto';
}

export function heuristicRouteTier(prompt: string, hasRichContext: boolean): 'deep_analysis' | 'quick_reply' {
  const normalized = prompt.trim().toLowerCase();
  if (
    hasRichContext ||
    normalized.length >= 120 ||
    /(drawdown|consistency|kelly|expectancy|risk|lot|monte carlo|architecture|audit|analyze|วิเคราะห์|วางแผน|คำนวณ|พอร์ต|ความเสี่ยง|กฎ\s*40%|12-gate|ghr)/i.test(
      normalized,
    )
  ) {
    return 'deep_analysis';
  }
  return 'quick_reply';
}

export function isRetryableQuotaOrTransientError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  if (!msg) return true;
  if (/API_KEY_INVALID|INVALID_ARGUMENT|PERMISSION_DENIED|UNAUTHENTICATED|\b401\b|\b403\b/i.test(msg)) {
    return false;
  }
  return /RESOURCE_EXHAUSTED|TOO_MANY_REQUESTS|UNAVAILABLE|DEADLINE_EXCEEDED|NOT_FOUND|\b429\b|\b500\b|\b502\b|\b503\b|\b504\b|\b404\b|quota|rate.?limit|overloaded/i.test(
    msg,
  );
}

export async function planModelRoute(params: {
  prompt: string;
  hasRichContext?: boolean;
  preference?: unknown;
  decisionClient?: DecisionClientLike | null;
}): Promise<DecisionRoutePlan> {
  const pref = normalizeChatModelPreference(params.preference);
  const hasRichContext = Boolean(params.hasRichContext);
  let asksForTradeSignal = /(buy|sell|signal|entry|tp|sl|target price|แนะนำเข้า|จุดเข้า|ซิก|สัญญาณ|กำไรแน่นอน)/i.test(
    params.prompt,
  );

  if (pref === GEMINI_FLASH_LITE_35) {
    return {
      requestedPreference: pref,
      candidateModels: [GEMINI_FLASH_LITE_35, GEMINI_FLASH_LITE_31],
      routedBy: 'manual',
      routeTier: 'deep_analysis',
      decisionConfidence: 1,
      asksForTradeSignal,
      decisionModel: GEMINI_DECISION_MODEL,
    };
  }
  if (pref === GEMINI_FLASH_LITE_31) {
    return {
      requestedPreference: pref,
      candidateModels: [GEMINI_FLASH_LITE_31, GEMINI_FLASH_LITE_35],
      routedBy: 'manual',
      routeTier: 'quick_reply',
      decisionConfidence: 1,
      asksForTradeSignal,
      decisionModel: GEMINI_DECISION_MODEL,
    };
  }

  let routeTier = heuristicRouteTier(params.prompt, hasRichContext);
  let routedBy: DecisionRoutePlan['routedBy'] = 'heuristic';
  let decisionConfidence = 0.5;

  if (params.decisionClient) {
    try {
      const response = await params.decisionClient.decisions.create({
        model: GEMINI_DECISION_MODEL,
        input: `User message: ${params.prompt.slice(0, 1500)} | Context attached: ${hasRichContext ? 'yes' : 'no'}`,
        questions: {
          complexity: {
            type: 'choice',
            instructions:
              'Classify the complexity of the user query for routing between a deeper Flash-Lite model and a fast Flash-Lite model.',
            criteria: {
              deep_analysis:
                'Requires multi-step risk math, portfolio review, drawdown diagnostics, strategy audit, or technical architecture analysis.',
              quick_reply:
                'Greeting, short definition, simple FAQ, quick status check, or concise UI navigation help.',
            },
          },
          asks_for_trade_signal: {
            type: 'noul',
            instructions:
              'Is the user asking for direct buy/sell trade signals, entry price calls, financial advice, or guaranteed profit?',
          },
        },
      });

      const complexityAns = response.answers?.complexity;
      if (complexityAns && 'type' in complexityAns && complexityAns.type === 'choice') {
        routeTier = complexityAns.choice === 'deep_analysis' ? 'deep_analysis' : 'quick_reply';
        decisionConfidence =
          typeof complexityAns.confidence === 'number' ? Number(complexityAns.confidence.toFixed(3)) : 0.75;
        routedBy = 'decision-1';
      }

      const signalAns = response.answers?.asks_for_trade_signal;
      if (
        signalAns &&
        'type' in signalAns &&
        signalAns.type === 'noul' &&
        typeof signalAns.noul === 'number'
      ) {
        asksForTradeSignal = asksForTradeSignal || signalAns.noul >= 0.65;
      }
    } catch {
      // Fail-open to deterministic heuristic so a Decision API error never blocks AI chat
    }
  }

  const candidateModels: [GeminiGenerationModel, GeminiGenerationModel] =
    routeTier === 'deep_analysis'
      ? [GEMINI_FLASH_LITE_35, GEMINI_FLASH_LITE_31]
      : [GEMINI_FLASH_LITE_31, GEMINI_FLASH_LITE_35];

  return {
    requestedPreference: 'auto',
    candidateModels,
    routedBy,
    routeTier,
    decisionConfidence,
    asksForTradeSignal,
    decisionModel: GEMINI_DECISION_MODEL,
  };
}

export async function executeWithFlashLiteFailover(
  route: DecisionRoutePlan,
  runModel: (model: GeminiGenerationModel, systemInstructionSuffix: string) => Promise<string>,
): Promise<OrchestratedResult> {
  const suffix = route.asksForTradeSignal ? SAFE_HARBOR_REMINDER : '';
  let lastError: unknown;

  for (let i = 0; i < route.candidateModels.length; i++) {
    const candidate = route.candidateModels[i];
    try {
      const reply = await runModel(candidate, suffix);
      return {
        reply,
        model: candidate,
        failoverUsed: i > 0,
        route,
      };
    } catch (err) {
      lastError = err;
      const canRetryNext = i < route.candidateModels.length - 1 && isRetryableQuotaOrTransientError(err);
      if (!canRetryNext) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All Flash-Lite candidates failed');
}

export function createDecisionGenAIClient(apiKey?: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: apiKey ?? process.env.GEMINI_API_KEY,
    httpOptions: {
      apiVersion: 'v1beta',
    },
  });
}
