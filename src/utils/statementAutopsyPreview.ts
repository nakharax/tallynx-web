export type AutopsySession = 'ASIA' | 'LONDON' | 'NEW_YORK';

export interface AutopsyPosition {
  openedAt: number;
  closedAt: number;
  symbol: string;
  lots: number;
  netPnlUsd: number;
  stopLossHit?: boolean;
}

export interface ParsedAutopsyStatement {
  positions: AutopsyPosition[];
  initialBalance: number | null;
  firmName: string | null;
  currency: string | null;
  skippedRows: number;
}

export const AUTOPSY_MODEL = {
  cooldownMinutes: 15,
  lotMultiplier: 1.5,
  bestDayCapPct: 40,
  simulationPaths: 1_000,
  simulationTrades: 50,
  simulationLossFloorPct: 10,
  simulationGainTargetPct: 8,
} as const;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const HTML_ENTITIES: Record<string, string> = {
  amp: '&', apos: "'", quot: '"', lt: '<', gt: '>', nbsp: ' ', ndash: '–', minus: '−',
};

function readHtmlRows(content: string): string[][] {
  const tables = content.replace(/<!--[^]*?-->|<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi, '');
  return Array.from(tables.matchAll(/<tr\b[^>]*>([^]*?)<\/tr\s*>/gi), ([, row]) =>
    Array.from(row.matchAll(/<t[dh]\b[^>]*>([^]*?)(?=<\/?t[dh]\b|$)/gi), ([, cell]) =>
      cell.replace(/<[^>]*>/g, ' ')
        .replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (entity, name: string) => {
          if (name[0] !== '#') return HTML_ENTITIES[name.toLowerCase()] ?? entity;
          const codePoint = name[1].toLowerCase() === 'x'
            ? Number.parseInt(name.slice(2), 16)
            : Number.parseInt(name.slice(1), 10);
          return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
        })
        .replace(/\s+/g, ' ')
        .trim(),
    ),
  );
}

function readDelimitedRows(content: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (character === '"' && (quoted || !cell.trim())) {
      if (quoted && content[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === separator) {
      row.push(cell.trim());
      cell = '';
    } else if (!quoted && (character === '\n' || character === '\r')) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
      if (character === '\r' && content[index + 1] === '\n') index++;
    } else {
      cell += character;
    }
  }
  if (!quoted && (cell || row.length)) rows.push([...row, cell.trim()]);
  return rows;
}

function parseNumber(value = '', money = false): number | null {
  let normalized = value.trim().replace(/[\s'’]/g, '').replace(/−/g, '-');
  if (money) normalized = normalized.replace(/USD|\$/gi, '');
  if (normalized.startsWith('(') && normalized.endsWith(')')) {
    normalized = `-${normalized.slice(1, -1)}`;
  }
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '');
  } else if (money && /^[+-]?[1-9]\d{0,2}(,\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/,/g, '');
  } else {
    normalized = normalized.replace(',', '.');
  }

  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(Math.round(number * 100)) ? number : null;
}

function parseTime(value = ''): number | null {
  const match = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})[ T]+(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,3}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '0', fraction = '0', zone = 'Z'] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, +fraction.padEnd(3, '0')));
  if (date.getUTCFullYear() !== +year || date.getUTCMonth() !== +month - 1 ||
      date.getUTCDate() !== +day || date.getUTCHours() !== +hour ||
      date.getUTCMinutes() !== +minute || date.getUTCSeconds() !== +second) return null;
  const time = Date.parse(date.toISOString().slice(0, -1) + zone.toUpperCase());
  return Number.isFinite(time) ? time : null;
}

function stopTriggered(reason = ''): boolean {
  return /^deal_reason_sl$/i.test(reason) ||
    /(?:^|\[|closed by )\s*(?:s\s*\/\s*l|sl|stop[\s-]*loss)(?:$|\]|[\s:]+(?:hit\b|triggered\b|\d))/i.test(reason);
}

function getColumns(row: string[]) {
  const symbol = row.findIndex((cell) => /^(?:symbol|instrument|สัญลักษณ์)$/i.test(cell));
  if (symbol < 0) return null;

  const headers = row.map((cell) => cell.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, ''));
  const column = (...names: string[]) => headers.findIndex((cell) => names.includes(cell));
  const volumes = column('volume', 'lots', 'lot', 'size', 'ปริมาณ', 'ล็อต');
  const net = headers.findIndex((cell) => /^(?:netprofit|netpnl)(?:[a-z]{3})?$/.test(cell));
  const profit = headers.findIndex((cell) => /^(?:(?:profitloss|profit|pnl|pl)(?:[a-z]{3})?|กำไร)$/.test(cell));
  const time = column('time', 'datetime', 'เวลา');
  const explicitOpenTime = column('opentime', 'openingtime', 'openedat', 'timeopen', 'entrytime', 'เวลาเปิด');
  const closedAt = column('closetime', 'closingtime', 'closedat', 'timeclose', 'exittime', 'เวลาปิด');
  const openTime = explicitOpenTime < 0 ? time : explicitOpenTime;
  const closeTime = closedAt < 0 && time >= 0 ? headers.lastIndexOf(headers[time]) : closedAt;
  const direction = column('direction', 'entry', 'dealentry');
  if (volumes < 0 || (net < 0 && profit < 0) || openTime < 0) return null;
  if (direction < 0 && (closeTime < 0 || closeTime === openTime)) return null;

  const closePrice = column('closeprice', 'closingprice', 'exitprice');
  const lastPrice = headers.lastIndexOf('price');
  return {
    symbol, net, profit, volumes, direction, openTime, closeTime,
    closePrice: closePrice < 0 && lastPrice !== column('price') ? lastPrice : closePrice,
    side: column('type', 'side', 'tradetype', 'dealtype', 'ประเภท'),
    stopPrice: column('sl', 'stoploss', 'stoplossprice'),
    stopFlag: column('stoplosshit', 'slhit'),
    reason: column('reason', 'closereason', 'dealreason', 'exitreason'),
    comment: column('comment', 'comments', 'หมายเหตุ'),
    commission: column('commission', 'ค่าคอมมิชชั่น'),
    swap: column('swap', 'สวอป'),
    fee: column('fee', 'fees'),
    balance: column('balance', 'ยอดคงเหลือ'),
    position: column('position', 'positionid', 'positionticket', 'ticket'),
  };
}

type StatementColumns = NonNullable<ReturnType<typeof getColumns>>;

interface DealFill {
  time: number;
  symbol: string;
  positionId: string;
  side: string;
  direction: string;
  lots: number;
  net: number;
  stopLossHit: boolean;
}

function dealExitKey(symbol: string, time: number, lots: number): string {
  return `${symbol}:${time}:${lots}`;
}

function recoverClosedDeals(deals: DealFill[], statement: ParsedAutopsyStatement): void {
  // With no position ID, multiple live entries on the same side cannot be matched reliably.
  const open = new Map<string, { time: number; lots: number; net: number; ambiguous: boolean }>();
  for (const deal of deals.sort((a, b) => a.time - b.time)) {
    const side = deal.direction === 'in' ? deal.side : (deal.side === 'buy' ? 'sell' : 'buy');
    const key = deal.positionId ? `#${deal.positionId}` : `${deal.symbol}:${side}`;
    const entry = open.get(key);

    if (deal.direction === 'in') {
      open.set(key, {
        time: entry?.time ?? deal.time,
        lots: (entry?.lots ?? 0) + deal.lots,
        net: (entry?.net ?? 0) + deal.net,
        ambiguous: Boolean(entry && !deal.positionId),
      });
      continue;
    }

    if (!['out', 'out by'].includes(deal.direction) || !entry || deal.lots > entry.lots + 1e-8) {
      open.delete(key);
      statement.skippedRows++;
      continue;
    }

    const entryCosts = entry.net * (deal.lots / entry.lots);
    entry.lots -= deal.lots;
    entry.net -= entryCosts;
    if (entry.lots <= 1e-8) open.delete(key);
    if (entry.ambiguous) {
      statement.skippedRows++;
      continue;
    }

    statement.positions.push({
      openedAt: entry.time,
      closedAt: deal.time,
      symbol: deal.symbol,
      lots: deal.lots,
      netPnlUsd: Math.round((deal.net + entryCosts) * 100) / 100,
      stopLossHit: deal.stopLossHit,
    });
  }
}

function readStatementMetadata(row: string[], statement: ParsedAutopsyStatement): boolean {
  const first = row.findIndex(Boolean);
  if (first === -1) return false;
  const match = /^(initial balance|starting balance|initial deposit|start balance|company|firm(?: name)?|broker|currency|account)\s*(?::\s*(.*))?$/i.exec(row[first]);
  if (!match) return false;
  const key = match[1].toLowerCase();
  const value = match[2] || row.slice(first + 1).find(Boolean) || '';

  if (key === 'account' || key === 'currency') {
    const code = key === 'account' ? /\(([a-z]{3})\s*[,)]/i.exec(value)?.[1] : /^[a-z]{3}$/i.exec(value)?.[0];
    if (code) statement.currency = code.toUpperCase();
  } else if (key === 'company' || key === 'broker' || key.startsWith('firm')) {
    if (value) statement.firmName = value;
  } else {
    const unit = /^(?:([a-z]{3})\s+)(?=[\d$])|(?:\s+([a-z]{3}))$/i.exec(value);
    if (unit && !statement.currency) statement.currency = (unit[1] ?? unit[2]).toUpperCase();
    const amount = parseNumber(unit ? value.replace(unit[0], '') : value, true);
    if (amount !== null && amount > 0) statement.initialBalance = amount;
  }
  return true;
}

function parseRows(rows: string[][]): { statement: ParsedAutopsyStatement; recognized: boolean } {
  const statement: ParsedAutopsyStatement = {
    positions: [], initialBalance: null, firmName: null, currency: null, skippedRows: 0,
  };
  const deals: DealFill[] = [];
  const positionIds: string[] = [];
  let columns: StatementColumns | null = null;
  let recognized = false;
  let firstDeal = true;
  let inferredBalance: number | null = null;
  let skippedDeals = 0;

  for (const row of rows) {
    if (readStatementMetadata(row, statement)) continue;
    if (!row.some(Boolean)) continue;
    const header = getColumns(row);
    if (header) {
      columns = header;
      recognized = true;
      const currency = /(?:profit(?:[/ ]loss)?|pnl|p\s*&?\s*l)[\s_(]+([a-z]{3})\)?$/i
        .exec(row[header.net < 0 ? header.profit : header.net])?.[1];
      if (currency && !statement.currency) statement.currency = currency.toUpperCase();
      continue;
    }
    if (row.filter(Boolean).length < 2 || /^(?:total|totals|summary)\b/i.test(row[0])) {
      columns = null;
      continue;
    }
    if (!columns) continue;

    const { direction, openTime, closeTime, symbol, volumes, net, profit, side, balance } = columns;
    const openedAt = parseTime(row[openTime]);
    const tradeSide = (row[side] ?? '').toLowerCase().replace(/^ซื้อ$|^long$/, 'buy').replace(/^ขาย$|^short$/, 'sell');
    const pnl = parseNumber(row[net < 0 ? profit : net], true);
    const netPnl = net < 0 && pnl !== null
      ? pnl + (parseNumber(row[columns.commission], true) ?? 0) +
        (parseNumber(row[columns.swap], true) ?? 0) + (parseNumber(row[columns.fee], true) ?? 0)
      : pnl;

    if (direction >= 0 && firstDeal && openedAt !== null) {
      firstDeal = false;
      const cash = parseNumber(row[balance], true);
      if (['balance', 'deposit'].includes(tradeSide) && cash !== null && cash > 0 &&
          pnl !== null && Math.abs(cash - pnl) < 0.005) inferredBalance = cash;
    }

    if (/^(?:balance|deposit|withdrawal|credit|charge|correction|commission|commission daily|commission monthly)$/.test(tradeSide)) continue;
    const ticker = (row[symbol] ?? '').toUpperCase();
    const lots = parseNumber(row[volumes]);
    const hasStopReason = /^(?:true|yes|1|sl)$/i.test(row[columns.stopFlag] ?? '') ||
      [row[columns.reason], row[columns.comment]].some(stopTriggered);
    const positionId = row[columns.position] ?? '';

    if (openedAt === null || !ticker || lots === null || lots <= 0 || netPnl === null ||
        (side >= 0 && !['buy', 'sell'].includes(tradeSide))) {
      if (direction < 0) statement.skippedRows++;
      else skippedDeals++;
      continue;
    }

    if (direction >= 0) {
      deals.push({
        time: openedAt, symbol: ticker, lots, positionId,
        direction: (row[direction] ?? '').toLowerCase().replace(/[-_]/g, ' '),
        side: tradeSide, net: netPnl, stopLossHit: hasStopReason,
      });
      continue;
    }

    const closedAt = parseTime(row[closeTime]);
    if (closedAt === null || closedAt < openedAt) {
      statement.skippedRows++;
      continue;
    }

    const stopPrice = parseNumber(row[columns.stopPrice]);
    const exitPrice = parseNumber(row[columns.closePrice]);
    statement.positions.push({
      openedAt, closedAt, symbol: ticker, lots, netPnlUsd: Math.round(netPnl * 100) / 100,
      stopLossHit: hasStopReason || (stopPrice !== null && stopPrice > 0 && stopPrice === exitPrice),
    });
    positionIds.push(positionId);
  }

  statement.initialBalance ??= inferredBalance;
  if (statement.positions.length === 0) {
    statement.skippedRows += skippedDeals;
    recoverClosedDeals(deals, statement);
  } else {
    const stopsByPosition = new Set(deals.filter((deal) => deal.stopLossHit && deal.positionId && deal.direction.startsWith('out'))
      .map((deal) => `${deal.positionId}:${deal.time}`));
    const stopsByFill = new Set(deals.filter((deal) => deal.stopLossHit && !deal.positionId && deal.direction.startsWith('out'))
      .map((deal) => dealExitKey(deal.symbol, deal.time, deal.lots)));
    const fillCounts = new Map<string, number>();
    for (const { symbol, closedAt, lots } of statement.positions) {
      const key = dealExitKey(symbol, closedAt, lots);
      fillCounts.set(key, (fillCounts.get(key) ?? 0) + 1);
    }
    statement.positions.forEach((position, index) => {
      const key = dealExitKey(position.symbol, position.closedAt, position.lots);
      position.stopLossHit ||= stopsByPosition.has(`${positionIds[index]}:${position.closedAt}`) ||
        (fillCounts.get(key) === 1 && stopsByFill.has(key));
    });
  }
  return { statement, recognized };
}

/** Reads MT5 closed positions or matchable deal fills without attaching the file to the DOM. */
export function parseMt5HtmlOrCsvStatement(content: string): ParsedAutopsyStatement {
  const source = content.replace(/^\uFEFF/, '').trim();
  if (/^<(?:[!?]|html\b|head\b|body\b|table\b|tr\b)/i.test(source)) {
    return parseRows(readHtmlRows(source)).statement;
  }
  const csv = parseRows(readDelimitedRows(source, ','));
  if (csv.recognized) return csv.statement;
  for (const delimiter of [';', '\t']) {
    const parsed = parseRows(readDelimitedRows(source, delimiter));
    if (parsed.recognized) return parsed.statement;
  }
  return csv.statement;
}

export interface AutopsyEquityPoint {
  step: number;
  actualEquity: number;
  disciplinedEquity: number;
}

function simulateHistoricalTrades(pnlCents: number[], initialCents: number) {
  const { simulationPaths, simulationTrades, simulationLossFloorPct, simulationGainTargetPct } = AUTOPSY_MODEL;
  const floor = -(initialCents * simulationLossFloorPct) / 100;
  const target = (initialCents * simulationGainTargetPct) / 100;
  let seed = 0x4f1bbcdc;
  let ruin = 0;
  let pass = 0;
  let reducedRuin = 0;
  let reducedPass = 0;

  // Resample realized outcomes with replacement, using the same path at both scales.
  for (let path = 0; path < simulationPaths && pnlCents.length; path++) {
    let balanceChange = 0;
    let currentOutcome = 0;
    let reducedOutcome = 0;
    for (let trade = 0; trade < simulationTrades; trade++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      balanceChange += pnlCents[Math.floor(((seed >>> 0) / 0x100000000) * pnlCents.length)];

      currentOutcome ||= balanceChange <= floor ? -1 : balanceChange >= target ? 1 : 0;
      reducedOutcome ||= balanceChange / 2 <= floor ? -1 : balanceChange / 2 >= target ? 1 : 0;
      if (currentOutcome && reducedOutcome) break;
    }
    ruin += Number(currentOutcome === -1);
    pass += Number(currentOutcome === 1);
    reducedRuin += Number(reducedOutcome === -1);
    reducedPass += Number(reducedOutcome === 1);
  }

  return {
    currentRuinPct: (ruin / simulationPaths) * 100,
    reducedRiskRuinPct: (reducedRuin / simulationPaths) * 100,
    currentPassPct: (pass / simulationPaths) * 100,
    reducedRiskPassPct: (reducedPass / simulationPaths) * 100,
  };
}

function entrySession(time: number): AutopsySession {
  const hour = new Date(time).getUTCHours();
  if (hour >= 22 || hour < 7) return 'ASIA';
  return hour < 13 ? 'LONDON' : 'NEW_YORK';
}

/** Replays closed-trade history. Model boundaries and session hours are illustrative. */
export function runLandingStatementAutopsy(
  positions: readonly AutopsyPosition[],
  initialBalance: number,
  firmName: string,
) {
  const initialCents = Math.round(initialBalance * 100);
  if (initialCents <= 0 || !Number.isSafeInteger(initialCents)) {
    throw new RangeError('A positive USD starting balance is required.');
  }

  const trades = positions.filter(({ openedAt, closedAt, lots, netPnlUsd }) =>
    Number.isFinite(openedAt) && Number.isFinite(closedAt) && Math.abs(openedAt) <= 8.64e15 &&
    Math.abs(closedAt) <= 8.64e15 && closedAt >= openedAt && Number.isFinite(lots) && lots > 0 &&
    Number.isSafeInteger(Math.round(netPnlUsd * 100)),
  ).sort((a, b) => a.closedAt - b.closedAt || a.openedAt - b.openedAt);
  const lots = trades.map((position) => position.lots).sort((a, b) => a - b);
  const midpoint = Math.floor(lots.length / 2);
  const medianLot = lots.length % 2 ? lots[midpoint] : ((lots[midpoint - 1] ?? 0) + (lots[midpoint] ?? 0)) / 2;
  const oversizedLot = medianLot * AUTOPSY_MODEL.lotMultiplier;
  const stops = trades.filter((position) => position.stopLossHit);
  const flagged = new Set<AutopsyPosition>();
  let stopIndex = 0;

  for (const position of [...trades].sort((a, b) => a.openedAt - b.openedAt)) {
    while (stopIndex < stops.length && stops[stopIndex].closedAt <= position.openedAt) stopIndex++;
    const latestStop = stops[stopIndex - 1];
    const priorStop = latestStop === position ? stops[stopIndex - 2] : latestStop;
    if (priorStop && (position.openedAt - priorStop.closedAt <= AUTOPSY_MODEL.cooldownMinutes * MINUTE_MS ||
        oversizedLot - position.lots <= oversizedLot * Number.EPSILON)) {
      flagged.add(position);
    }
  }

  const dailyPnl = new Map<number, { actual: number; disciplined: number }>();
  const sessionPnl = new Map<AutopsySession, number>();
  const equityCurve: AutopsyEquityPoint[] = [{
    step: 0, actualEquity: initialCents / 100, disciplinedEquity: initialCents / 100,
  }];
  let actualNet = 0;
  let disciplinedNet = 0;
  let tiltLoss = 0;
  let worstDailyClosedLoss = 0;
  let disciplinedWorstDailyClosedLoss = 0;

  const pnlCents = trades.map((position, index) => {
    const pnl = Math.round(position.netPnlUsd * 100);
    const skipped = flagged.has(position);
    const replayPnl = skipped ? 0 : pnl;
    actualNet += pnl;
    disciplinedNet += replayPnl;
    if (skipped && pnl < 0) tiltLoss -= pnl;

    const day = Math.floor(position.closedAt / DAY_MS);
    const daily = dailyPnl.get(day) ?? { actual: 0, disciplined: 0 };
    daily.actual += pnl;
    daily.disciplined += replayPnl;
    dailyPnl.set(day, daily);
    worstDailyClosedLoss = Math.max(worstDailyClosedLoss, -daily.actual);
    disciplinedWorstDailyClosedLoss = Math.max(disciplinedWorstDailyClosedLoss, -daily.disciplined);

    const session = entrySession(position.openedAt);
    sessionPnl.set(session, (sessionPnl.get(session) ?? 0) + pnl);
    equityCurve.push({
      step: index + 1,
      actualEquity: (initialCents + actualNet) / 100,
      disciplinedEquity: (initialCents + disciplinedNet) / 100,
    });
    return pnl;
  });

  let bestDay = 0;
  let disciplinedBestDay = 0;
  for (const day of dailyPnl.values()) {
    bestDay = Math.max(bestDay, day.actual);
    disciplinedBestDay = Math.max(disciplinedBestDay, day.disciplined);
  }
  let worstSession: AutopsySession | null = null;
  let weakestSessionPnl = Infinity;
  for (const session of ['ASIA', 'LONDON', 'NEW_YORK'] as const) {
    const net = sessionPnl.get(session);
    if (net !== undefined && net < weakestSessionPnl) {
      worstSession = session;
      weakestSessionPnl = net;
    }
  }

  return {
    firmName,
    actualNetPnlUsd: actualNet / 100,
    preventableTiltLossUsd: tiltLoss / 100,
    counterfactualNetPnlUsd: disciplinedNet / 100,
    tiltTradeCount: flagged.size,
    bestDaySharePct: actualNet > 0 ? (bestDay / actualNet) * 100 : null,
    disciplinedBestDaySharePct: disciplinedNet > 0 ? (disciplinedBestDay / disciplinedNet) * 100 : null,
    bestDayThresholdReached: actualNet > 0 && bestDay * 100 >= actualNet * AUTOPSY_MODEL.bestDayCapPct,
    worstSession,
    worstDailyClosedLossUsd: worstDailyClosedLoss / 100,
    disciplinedWorstDailyClosedLossUsd: disciplinedWorstDailyClosedLoss / 100,
    equityCurve,
    ...simulateHistoricalTrades(pnlCents, initialCents),
  };
}

function sampleTrade(day: number, entry: string, exit: string, symbol: string, lots: number, netPnlUsd: number, stopLossHit = false): AutopsyPosition {
  const date = `2026-06-${String(day).padStart(2, '0')}`;
  return {
    openedAt: Date.parse(`${date}T${entry}:00Z`), closedAt: Date.parse(`${date}T${exit}:00Z`),
    symbol, lots, netPnlUsd, stopLossHit,
  };
}

export const SAMPLE_AUTOPSY_SCENARIOS = [
  {
    id: 'xau_tilt',
    label: '$50k Prop Challenge · 3 Revenge Trades After SL',
    labelTh: 'ชาเลนจ์ $50k · 3 ไม้แก้มือหลังชน SL',
    initialBalance: 50_000,
    firmName: 'Prop Challenge',
    positions: [
      sampleTrade(2, '07:10', '07:24', 'XAUUSD', 0.60, 440),
      sampleTrade(3, '08:45', '09:00', 'XAUUSD', 0.60, -820, true),
      sampleTrade(3, '09:03', '09:05', 'XAUUSD', 1.00, -625),
      sampleTrade(3, '09:06', '09:08', 'XAUUSD', 1.15, -710),
      sampleTrade(3, '09:12', '09:16', 'XAUUSD', 1.20, -505),
      sampleTrade(4, '06:15', '06:36', 'XAUUSD', 0.60, 320),
      sampleTrade(4, '13:30', '14:00', 'XAUUSD', 0.60, -390),
      sampleTrade(5, '08:07', '08:57', 'XAUUSD', 0.65, 515),
      sampleTrade(5, '13:10', '13:48', 'XAUUSD', 0.60, 170),
    ],
  },
  {
    id: 'consistency_trap',
    label: '$100k Funded · 40% Best-Day Payout Hold',
    labelTh: 'พอร์ต Funded $100k · ติดเกณฑ์วันกำไรสูงสุด 40%',
    initialBalance: 100_000,
    firmName: 'Funded Account',
    positions: [
      sampleTrade(2, '07:20', '08:42', 'XAUUSD', 2.00, 1_900),
      sampleTrade(2, '13:24', '13:56', 'XAUUSD', 2.00, 2_900),
      sampleTrade(3, '12:18', '13:09', 'XAUUSD', 2.00, 2_700),
      sampleTrade(4, '08:10', '09:14', 'XAUUSD', 2.00, 2_500),
      sampleTrade(5, '07:12', '08:03', 'XAUUSD', 2.00, 3_000),
      sampleTrade(5, '13:17', '13:30', 'XAUUSD', 2.00, -500, true),
      sampleTrade(5, '13:34', '13:58', 'XAUUSD', 3.50, -2_500),
    ],
  },
  {
    id: 'clean_guard',
    label: '$50k FTMO · 15-Min Cooldown Disciplined',
    labelTh: 'FTMO $50k · พักครบ 15 นาทีหลังชน SL',
    initialBalance: 50_000,
    firmName: 'FTMO',
    positions: [
      sampleTrade(2, '07:00', '07:25', 'EURUSD', 0.50, -280, true),
      sampleTrade(2, '07:43', '09:17', 'EURUSD', 0.50, 630),
      sampleTrade(3, '12:52', '13:40', 'EURUSD', 0.60, 450),
      sampleTrade(4, '06:15', '07:10', 'EURUSD', 0.50, 300),
      sampleTrade(5, '09:21', '10:47', 'EURUSD', 0.50, 200),
      sampleTrade(5, '13:00', '13:18', 'EURUSD', 0.50, -150, true),
      sampleTrade(5, '13:40', '14:22', 'EURUSD', 0.50, 275),
    ],
  },
] as const;
