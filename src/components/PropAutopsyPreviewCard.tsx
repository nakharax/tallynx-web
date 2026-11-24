import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, FileSpreadsheet, LockKeyhole, Upload } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Language } from '../utils/i18n';
import { TALLYNX_DESK_APP_URL } from '../utils/navLogic';
import { buildDeskHandoffUrl, type OnboardingTransferState } from '../utils/onboardingLogic';
import {
  AUTOPSY_MODEL,
  SAMPLE_AUTOPSY_SCENARIOS,
  parseMt5HtmlOrCsvStatement,
  runLandingStatementAutopsy,
  type ParsedAutopsyStatement,
} from '../utils/statementAutopsyPreview';

interface PropAutopsyPreviewCardProps {
  lang: Language;
  isDark: boolean;
  transferState: OnboardingTransferState;
}

type SampleScenario = typeof SAMPLE_AUTOPSY_SCENARIOS[number];
type PreviewSource =
  | { kind: 'sample'; scenario: SampleScenario }
  | { kind: 'file'; name: string; statement: ParsedAutopsyStatement };
type UploadStatus = 'reading' | 'xlsx' | 'wrongType' | 'empty' | 'currency' | 'unreadable' | 'multiple';

const { cooldownMinutes, lotMultiplier, bestDayCapPct, simulationPaths, simulationTrades,
  simulationLossFloorPct, simulationGainTargetPct } = AUTOPSY_MODEL;

const copyByLanguage = {
  en: {
    sampleHeading: 'Try a sample challenge',
    uploadHeading: 'Drop an MT5 statement',
    uploadHint: 'HTML, HTM or CSV · Stays on this device',
    chooseFile: 'Choose file',
    reading: 'Reading your statement…',
    xlsx: 'Open the workbook in Desk to analyze it.',
    xlsxCta: 'Open in TallyNX Desk (.xlsx Analyzer)',
    wrongType: 'Choose an MT5 HTML, HTM, CSV or XLSX file.',
    empty: 'No closed trades found. Export an MT5 report with closed positions or matched deals.',
    currency: 'This preview analyzes USD statements. Choose a USD export.',
    unreadable: 'The file could not be read. Try exporting it again from MT5.',
    multiple: 'Choose one statement at a time.',
    replayHeading: 'Statement replay',
    sampleSource: 'Illustrative history',
    fileSource: 'Local file',
    balance: 'Starting balance (USD)',
    balanceMissing: 'The export omitted its starting balance. Verify the prefilled calculator balance.',
    balanceRequired: 'Enter a positive USD starting balance to run the replay.',
    assumedCurrency: 'The report omits its currency. Amounts are read as USD.',
    skippedRows: (count: number) => `Rows without enough closed-trade data: ${count}.`,
    noStops: 'No stop-loss exits were identified in this export.',
    actual: 'Actual P&L',
    disciplined: 'Disciplined Counterfactual P&L',
    equity: 'Equity at trade close',
    actualLine: 'Recorded',
    disciplinedLine: 'Cooldown replay',
    step: 'Closed trade',
    chartSampled: 'Chart sampled for this long statement.',
    tiltLoss: 'Preventable Tilt Loss',
    tiltCount: (count: number) => `${count} flagged ${count === 1 ? 'entry' : 'entries'} removed in the replay`,
    consistency: `${bestDayCapPct}% Best-Day Check`,
    thresholdReached: `At or above the ${bestDayCapPct}% threshold`,
    belowThreshold: `Below the ${bestDayCapPct}% threshold`,
    consistencyUnavailable: 'Requires positive net P&L',
    worstSession: 'Weakest entry session',
    sessions: { ASIA: 'Asia', LONDON: 'London', NEW_YORK: 'New York' },
    model: 'Monte Carlo · 1× vs 0.5×',
    modelDetails: `Historical statistical simulation. ${simulationPaths.toLocaleString('en-US')} resampled paths of up to ${simulationTrades} closed trades at each scale. Both thresholds are relative to the starting balance. Paths that reach neither threshold are unresolved.`,
    scale: 'P&L scale',
    ruin: `Ruin · −${simulationLossFloorPct}%`,
    pass: `Pass · +${simulationGainTargetPct}%`,
    cooldownCta: 'Lock 15m Cooldown in TallyNX Desk',
    cooldownDetails: 'Open Desk’s 12-Gate settings with your calculator inputs and the replay balance.',
    method: 'How the replay works',
    methodDetails: `The replay omits entries within ${cooldownMinutes} minutes of a recorded stop-loss or at least ${lotMultiplier}× the statement’s median lot after a stop-loss. It removes both gains and losses on those entries. Best day divides the highest daily net P&L by total net P&L. Days use UTC closes. Entry sessions start at 22:00 (Asia), 07:00 (London) and 13:00 (New York) UTC. Times without a zone are read as UTC.`,
  },
  th: {
    sampleHeading: 'ลองชาเลนจ์ตัวอย่าง',
    uploadHeading: 'วางไฟล์ Statement จาก MT5',
    uploadHint: 'HTML, HTM หรือ CSV · ไฟล์อยู่บนอุปกรณ์นี้',
    chooseFile: 'เลือกไฟล์',
    reading: 'กำลังอ่าน Statement…',
    xlsx: 'เปิดไฟล์เวิร์กบุ๊กใน Desk เพื่อวิเคราะห์',
    xlsxCta: 'เปิดใน TallyNX Desk (ตัววิเคราะห์ .xlsx)',
    wrongType: 'เลือกไฟล์ MT5 แบบ HTML, HTM, CSV หรือ XLSX',
    empty: 'ไม่พบรายการที่ปิดแล้ว ส่งออกรายงาน MT5 ที่มีสถานะปิดหรือดีลที่จับคู่ได้',
    currency: 'พรีวิวนี้วิเคราะห์ Statement สกุล USD โปรดเลือกไฟล์ที่ใช้ USD',
    unreadable: 'อ่านไฟล์ไม่ได้ ลองส่งออกรายงานจาก MT5 อีกครั้ง',
    multiple: 'เลือก Statement ครั้งละหนึ่งไฟล์',
    replayHeading: 'จำลองย้อนหลังจาก Statement',
    sampleSource: 'ประวัติตัวอย่าง',
    fileSource: 'ไฟล์บนอุปกรณ์',
    balance: 'ยอดเริ่มต้น (USD)',
    balanceMissing: 'รายงานไม่ระบุยอดเริ่มต้น โปรดตรวจสอบยอดที่ดึงมาจากเครื่องคำนวณ',
    balanceRequired: 'ใส่ยอดเริ่มต้นเป็น USD ที่มากกว่า 0 เพื่อดูผลจำลอง',
    assumedCurrency: 'รายงานไม่ระบุสกุลเงิน ระบบอ่านยอดเป็น USD',
    skippedRows: (count: number) => `ข้าม ${count} แถวที่ไม่มีข้อมูลรายการปิดเพียงพอ`,
    noStops: 'ไม่พบรายการที่ปิดเพราะชน SL ในไฟล์นี้',
    actual: 'กำไร/ขาดทุนจริง',
    disciplined: 'กำไร/ขาดทุนจำลองเมื่อตัดไม้ผิดวินัย',
    equity: 'มูลค่าพอร์ต ณ จุดปิดรายการ',
    actualLine: 'ผลจริง',
    disciplinedLine: 'ผลจำลองเมื่อพัก',
    step: 'รายการที่ปิดแล้ว',
    chartSampled: 'กราฟแสดงบางจุดสำหรับ Statement ที่มีรายการจำนวนมาก',
    tiltLoss: 'ขาดทุนจากไม้แก้มือที่เลี่ยงได้ในแบบจำลอง',
    tiltCount: (count: number) => `ตัด ${count} ไม้ที่เข้าเกณฑ์ออกจากแบบจำลอง`,
    consistency: `เช็กสัดส่วนกำไรวันสูงสุด ${bestDayCapPct}%`,
    thresholdReached: `แตะหรือเกินเกณฑ์ ${bestDayCapPct}%`,
    belowThreshold: `ต่ำกว่าเกณฑ์ ${bestDayCapPct}%`,
    consistencyUnavailable: 'ต้องมีกำไรสุทธิเป็นบวกจึงคำนวณได้',
    worstSession: 'ช่วงเวลาเปิดเทรดที่ผลงานต่ำสุด',
    sessions: { ASIA: 'เอเชีย', LONDON: 'ลอนดอน', NEW_YORK: 'นิวยอร์ก' },
    model: 'Monte Carlo · 1× เทียบ 0.5×',
    modelDetails: `การจำลองเชิงสถิติจากข้อมูลย้อนหลัง สุ่ม ${simulationPaths.toLocaleString('th-TH')} เส้นทาง สูงสุด ${simulationTrades} รายการต่อเส้นทางในแต่ละสเกล ทั้งสองเกณฑ์คิดจากยอดเริ่มต้น เส้นทางที่ยังไม่แตะเกณฑ์ใดถือว่ายังไม่จบ`,
    scale: 'สเกลกำไร/ขาดทุน',
    ruin: `แตะเพดานขาดทุน −${simulationLossFloorPct}%`,
    pass: `ถึงเป้าจำลอง +${simulationGainTargetPct}%`,
    cooldownCta: 'ตั้งช่วงพัก 15 นาทีใน TallyNX Desk',
    cooldownDetails: 'เปิดการตั้งค่า 12-Gate ใน Desk พร้อมค่าจากเครื่องคำนวณและยอดเริ่มต้นที่ใช้จำลอง',
    method: 'วิธีคำนวณผลจำลอง',
    methodDetails: `แบบจำลองตัดทั้งกำไรและขาดทุนจากไม้ที่เปิดภายใน ${cooldownMinutes} นาทีหลังชน SL หรือใช้ล็อตตั้งแต่ ${lotMultiplier} เท่าของค่ามัธยฐานหลังเคยชน SL สัดส่วนกำไรวันสูงสุดคำนวณจากกำไรสุทธิวันสูงสุดหารด้วยกำไรสุทธิรวม ระบบแบ่งวันตามเวลาปิด UTC และแบ่งช่วงเทรดตามเวลาเปิดที่เริ่ม 22:00 (เอเชีย), 07:00 (ลอนดอน) และ 13:00 (นิวยอร์ก) ตาม UTC หากไฟล์ไม่ระบุเขตเวลา ระบบจะอ่านเป็น UTC`,
  },
};

function decodeStatement(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  return new TextDecoder().decode(bytes);
}

const MONEY_FORMAT_OPTIONS = {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
} as const;

const CHART_MARGIN = { top: 8, right: 10, bottom: 0, left: 0 };
const AXIS_TICK_STYLE = { fill: 'var(--desk-muted)', fontSize: 11 };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'var(--desk-canvas)',
  borderColor: 'var(--desk-line)',
  borderRadius: 10,
  fontSize: 12,
};
const TOOLTIP_ITEM_STYLE = { color: 'var(--desk-ink)' };
const TOOLTIP_LABEL_STYLE = { color: 'var(--desk-muted)' };

export const PropAutopsyPreviewCard = React.memo(function PropAutopsyPreviewCard({
  lang,
  isDark,
  transferState,
}: PropAutopsyPreviewCardProps) {
  const copy = copyByLanguage[lang];
  const [source, setSource] = useState<PreviewSource>({ kind: 'sample', scenario: SAMPLE_AUTOPSY_SCENARIOS[0] });
  const [balanceInput, setBalanceInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const readRequest = useRef(0);
  const balanceId = useId();
  const sample = source.kind === 'sample' ? source.scenario : null;
  const imported = source.kind === 'file' ? source.statement : null;
  const balance = sample?.initialBalance ?? Number(balanceInput);
  const startingCents = Math.round(balance * 100);
  const validBalance = startingCents > 0 && Number.isSafeInteger(startingCents);

  const result = useMemo(() => validBalance ? runLandingStatementAutopsy(
    source.kind === 'sample' ? source.scenario.positions : source.statement.positions,
    balance,
    source.kind === 'sample' ? source.scenario.firmName : source.statement.firmName ?? 'MT5',
  ) : null, [source, balance, validBalance]);
  const equity = useMemo(() => {
    if (!result) return [];
    const points = result.equityCurve;
    const stride = Math.ceil(points.length / 600);
    return stride === 1 ? points : points.filter((_, index) => index % stride === 0 || index === points.length - 1);
  }, [result]);

  const formatters = useMemo(() => {
    const locale = lang === 'th' ? 'th-TH' : 'en-US';
    const money = new Intl.NumberFormat(locale, MONEY_FORMAT_OPTIONS);
    const signedMoney = new Intl.NumberFormat(locale, { ...MONEY_FORMAT_OPTIONS, signDisplay: 'exceptZero' });
    const axisMoney = new Intl.NumberFormat(locale, { ...MONEY_FORMAT_OPTIONS, notation: 'compact', maximumFractionDigits: 1 });
    const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return { money, signedMoney, axisMoney, decimal };
  }, [lang]);

  const { money, signedMoney, axisMoney, decimal } = formatters;
  const percent = useCallback((value: number) => `${decimal.format(value)}%`, [decimal]);
  const theme = isDark ? 'dark' : 'light';
  const xlsxUrl = useMemo(
    () => buildDeskHandoffUrl(`${TALLYNX_DESK_APP_URL}?page=analysis&source=web_xlsx_handoff`, undefined, { lang, theme }),
    [lang, theme]
  );
  const cooldownUrl = useMemo(
    () => result && buildDeskHandoffUrl(`${TALLYNX_DESK_APP_URL}?cooldown_minutes=${cooldownMinutes}`, {
      ...transferState,
      accountSize: balance,
      simulatedDaySharePct: result.bestDaySharePct ?? transferState.simulatedDaySharePct,
    }, { lang, theme, page: 'gate', source: 'web_statement_autopsy' }),
    [result, transferState, balance, lang, theme]
  );

  const yDomain = useCallback(([min, max]: readonly [number, number]): [number, number] => {
    const padding = Math.max((max - min) * 0.10, balance * 0.0025);
    return [min - padding, max + padding];
  }, [balance]);
  const yTickFormatter = useCallback((value: number) => axisMoney.format(value), [axisMoney]);
  const tooltipLabelFormatter = useCallback(
    (value: unknown) => Number(value) === 0 ? copy.balance : `${copy.step} ${value}`,
    [copy.balance, copy.step]
  );
  const tooltipFormatter = useCallback((value: unknown) => money.format(Number(value)), [money]);

  const chooseSample = useCallback((scenario: SampleScenario) => {
    readRequest.current++;
    setSource({ kind: 'sample', scenario });
    setUploadStatus(null);
  }, []);

  const readFile = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const request = ++readRequest.current;
    if (files.length > 1) {
      setUploadStatus('multiple');
      return;
    }
    const file = files[0];
    if (/\.xlsx$/i.test(file.name)) {
      setUploadStatus('xlsx');
      return;
    }
    if (!/\.(?:html?|csv)$/i.test(file.name)) {
      setUploadStatus('wrongType');
      return;
    }

    setUploadStatus('reading');
    try {
      const buffer = await file.arrayBuffer();
      if (request !== readRequest.current) return;
      const statement = parseMt5HtmlOrCsvStatement(decodeStatement(buffer));
      if (statement.currency && statement.currency !== 'USD') {
        setUploadStatus('currency');
        return;
      }
      if (!statement.positions.length) {
        setUploadStatus('empty');
        return;
      }
      setSource({ kind: 'file', name: file.name, statement });
      setBalanceInput(String(statement.initialBalance ?? transferState.accountSize));
      setUploadStatus(null);
    } catch {
      if (request === readRequest.current) setUploadStatus('unreadable');
    }
  }, [transferState.accountSize]);

  const actualStroke = isDark ? '#FFFFFF' : '#09090B';
  const replayStroke = '#0752E8';
  const sourceLabel = source.kind === 'file' ? source.name : lang === 'th' ? source.scenario.labelTh : source.scenario.label;
  const tile = 'min-w-0 rounded-xl border border-hairline bg-white p-4 dark:bg-[#09090B]';

  return (
    <section className="grid min-w-0 gap-3" aria-label={copy.replayHeading} data-testid="prop-autopsy-preview">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
        <div className={tile}>
          <h3 className="text-sm font-semibold text-ink">{copy.sampleHeading}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {SAMPLE_AUTOPSY_SCENARIOS.map((scenario) => {
              const isSelected = sample?.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => chooseSample(scenario)}
                  className={`min-h-9 max-w-full cursor-pointer rounded-full border px-3.5 py-1.5 text-left text-xs font-semibold transition-colors ${
                    isSelected ? 'border-accent-solid bg-accent-solid text-white' : 'border-hairline text-ink hover:border-focus hover:text-focus'
                  }`}
                >
                  {lang === 'th' ? scenario.labelTh : scenario.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`${tile} border-dashed transition-colors ${isDragging ? 'border-accent-solid bg-accent-solid/10 dark:bg-accent-solid/10' : ''}`}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void readFile(event.dataTransfer.files);
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Upload className="h-5 w-5 shrink-0 text-focus" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-ink">{copy.uploadHeading}</h3>
                <p className="mt-0.5 text-xs text-muted">{copy.uploadHint}</p>
              </div>
            </div>
            <input
              ref={fileInput}
              type="file"
              hidden
              accept=".html,.htm,.csv,.xlsx"
              data-testid="autopsy-statement-upload"
              onChange={(event) => {
                void readFile(event.currentTarget.files);
                event.currentTarget.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="min-h-9 cursor-pointer rounded-lg border border-hairline px-3 text-xs font-semibold text-ink transition-colors hover:border-focus hover:text-focus"
            >
              {copy.chooseFile}
            </button>
          </div>
          <div role="status" className="text-xs text-muted">
            {uploadStatus && <p className="mt-3">{copy[uploadStatus]}</p>}
          </div>
          {uploadStatus === 'xlsx' && (
            <a
              href={xlsxUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="autopsy-xlsx-handoff"
              className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg bg-accent-solid px-3 py-2 text-xs font-semibold text-white hover:brightness-95"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
              {copy.xlsxCta}
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="grid min-w-0 gap-3 rounded-2xl border border-hairline bg-white p-3 sm:p-4 dark:bg-[#09090B]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">{copy.replayHeading}</h3>
            <p className="mt-1 break-words text-xs text-muted" aria-live="polite">
              {sample ? copy.sampleSource : copy.fileSource} · {sourceLabel}
              {imported?.firmName && <> · {imported.firmName}</>}
            </p>
          </div>
          {imported ? (
            <label className="grid gap-1 text-xs font-semibold text-ink" htmlFor={balanceId}>
              {copy.balance}
              <input
                id={balanceId}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={balanceInput}
                aria-invalid={!validBalance}
                onChange={(event) => setBalanceInput(event.currentTarget.value)}
                className="w-36 rounded-lg border border-hairline bg-canvas px-3 py-2 font-mono text-sm"
              />
            </label>
          ) : (
            <p className="font-mono text-xs tabular-nums text-muted">{money.format(balance)}</p>
          )}
        </div>

        {imported && (
          <div className="space-y-1 text-xs text-muted">
            {imported.initialBalance === null && <p>{copy.balanceMissing}</p>}
            {imported.currency === null && <p>{copy.assumedCurrency}</p>}
            {imported.skippedRows > 0 && <p>{copy.skippedRows(imported.skippedRows)}</p>}
            {!imported.positions.some((position) => position.stopLossHit) && <p>{copy.noStops}</p>}
          </div>
        )}

        {result ? (
          <>
            <dl className="grid grid-cols-2 gap-2.5">
              <div className="flex min-w-0 flex-col justify-between rounded-xl border border-hairline p-3 sm:p-4">
                <dt className="text-xs font-semibold text-muted">{copy.actual}</dt>
                <dd className="mt-2 break-words font-mono text-lg font-bold tabular-nums text-ink sm:text-3xl">{signedMoney.format(result.actualNetPnlUsd)}</dd>
              </div>
              <div className="flex min-w-0 flex-col justify-between rounded-xl border border-accent-solid/30 bg-accent-solid/5 p-3 sm:p-4 dark:bg-accent-solid/10">
                <dt className="text-xs font-semibold text-ink">{copy.disciplined}</dt>
                <dd className="mt-2 break-words font-mono text-lg font-bold tabular-nums text-focus sm:text-3xl">{signedMoney.format(result.counterfactualNetPnlUsd)}</dd>
              </div>
            </dl>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
              <figure className={tile}>
                <figcaption className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{copy.equity}</span>
                  <span className="flex flex-wrap gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-4 border-t-2 border-dashed border-current text-ink" aria-hidden="true" />{copy.actualLine}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-4 border-t-2 border-accent-solid" aria-hidden="true" />{copy.disciplinedLine}
                    </span>
                  </span>
                </figcaption>
                <div className="mt-3 h-48 min-w-0 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={equity} margin={CHART_MARGIN}>
                      <CartesianGrid vertical={false} stroke="var(--desk-line)" />
                      <XAxis type="number" dataKey="step" domain={[0, 'dataMax']} allowDecimals={false} tickCount={5} tickLine={false} axisLine={false} tick={AXIS_TICK_STYLE} />
                      <YAxis width={50} domain={yDomain} tickFormatter={yTickFormatter} tickLine={false} axisLine={false} tick={AXIS_TICK_STYLE} />
                      <Tooltip
                        labelFormatter={tooltipLabelFormatter}
                        formatter={tooltipFormatter}
                        contentStyle={TOOLTIP_CONTENT_STYLE}
                        itemStyle={TOOLTIP_ITEM_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                      />
                      <Line type="linear" dataKey="disciplinedEquity" name={copy.disciplinedLine} stroke={replayStroke} strokeWidth={2.75} dot={false} isAnimationActive={false} />
                      <Line type="linear" dataKey="actualEquity" name={copy.actualLine} stroke={actualStroke} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-right text-xs text-muted">{equity.length < result.equityCurve.length ? copy.chartSampled : copy.step}</p>
              </figure>

              <dl className="divide-y divide-hairline rounded-xl border border-hairline px-4">
                <div className="py-3.5">
                  <dt className="text-xs font-semibold text-muted">{copy.tiltLoss}</dt>
                  <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-focus">{money.format(result.preventableTiltLossUsd)}</dd>
                  <dd className="mt-1 text-xs text-muted">{copy.tiltCount(result.tiltTradeCount)}</dd>
                </div>
                <div className="py-3.5">
                  <dt className="text-xs font-semibold text-muted">{copy.consistency}</dt>
                  <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-ink">
                    {result.bestDaySharePct === null ? '—' : percent(result.bestDaySharePct)}
                  </dd>
                  <dd className="mt-1 text-xs text-muted">
                    {result.bestDaySharePct === null ? copy.consistencyUnavailable : result.bestDayThresholdReached ? copy.thresholdReached : copy.belowThreshold}
                  </dd>
                  {result.disciplinedBestDaySharePct !== null && (
                    <dd className="mt-1 text-xs text-muted">
                      {copy.disciplinedLine} · <span className="font-mono font-semibold text-focus">{percent(result.disciplinedBestDaySharePct)}</span>
                    </dd>
                  )}
                </div>
                <div className="py-3.5">
                  <dt className="text-xs font-semibold text-muted">{copy.worstSession}</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">{result.worstSession ? copy.sessions[result.worstSession] : '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
              <div className={tile}>
                <h4 className="text-sm font-semibold text-ink">{copy.model}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{copy.modelDetails}</p>
                <table className="mt-3 w-full table-fixed text-left text-xs">
                  <thead className="text-muted">
                    <tr>
                      <th scope="col" className="pb-2 pr-1 font-medium">{copy.scale}</th>
                      <th scope="col" className="pb-2 pr-1 font-medium">{copy.ruin}</th>
                      <th scope="col" className="pb-2 font-medium">{copy.pass}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline border-t border-hairline font-mono tabular-nums text-ink">
                    <tr><th scope="row" className="py-2 font-semibold">1×</th><td>{percent(result.currentRuinPct)}</td><td>{percent(result.currentPassPct)}</td></tr>
                    <tr><th scope="row" className="pt-2 font-semibold">0.5×</th><td className="pt-2">{percent(result.reducedRiskRuinPct)}</td><td className="pt-2">{percent(result.reducedRiskPassPct)}</td></tr>
                  </tbody>
                </table>
              </div>

              {cooldownUrl && (
                <div className="flex flex-col items-start justify-center gap-3 rounded-xl border border-neutral-800 bg-[#09090B] p-4 text-white">
                  <p className="max-w-sm text-sm leading-relaxed text-neutral-200">{copy.cooldownDetails}</p>
                  <a
                    href={cooldownUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="autopsy-cooldown-handoff"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent-solid px-3.5 py-2 text-sm font-semibold hover:brightness-95"
                  >
                    <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {copy.cooldownCta}
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>

            <details className="px-1 text-xs text-muted">
              <summary className="cursor-pointer py-1.5 font-semibold text-ink">{copy.method}</summary>
              <p className="mt-1 max-w-4xl leading-relaxed">{copy.methodDetails}</p>
            </details>
          </>
        ) : (
          <p className="rounded-lg border border-hairline p-3 text-sm text-ink" role="status">{copy.balanceRequired}</p>
        )}
      </div>
    </section>
  );
});

export default PropAutopsyPreviewCard;
