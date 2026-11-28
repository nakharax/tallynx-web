import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Bookmark,
  ShieldCheck,
  Plus,
  X,
  Check,
  Copy,
  Download,
  ArrowUpRight,
  ExternalLink,
  RotateCcw,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { Language } from '../utils/i18n';
import { TALLYNX_DESK_APP_URL } from '../utils/navLogic';
import {
  DESK_IDEAS_CATALOG,
  DeskCategory,
  DeskEngineType,
  DeskIdeaItem,
  ENGINE_LABELS,
  MarketplaceSortKey,
  VERIFICATION_LABELS,
  VerificationMethod,
  buildDeskConfigExport,
  createVerifiedDeskIdea,
  filterAndSortDeskIdeas,
  findDeskIdeaFromSearch,
  validateDeskSubmission,
} from '../utils/marketplaceLogic';
import { syncDocumentSeo } from '../utils/seoLogic';

interface DeskMarketplaceSectionProps {
  lang: Language;
}

const DESK_MARKETPLACE_URL = `${TALLYNX_DESK_APP_URL}?page=marketplace`;

function buildDeskMarketplaceIdeaUrl(ideaId: string, lang: Language): string {
  const url = new URL(DESK_MARKETPLACE_URL);
  url.searchParams.set('idea', ideaId);
  url.searchParams.set('lang', lang);
  url.searchParams.set('source', 'web_blueprint_showcase');
  return url.toString();
}

export const DeskMarketplaceSection: React.FC<DeskMarketplaceSectionProps> = ({
  lang,
}) => {
  const isTh = lang === 'th';

  const [catalog, setCatalog] = useState<DeskIdeaItem[]>(DESK_IDEAS_CATALOG);

  useEffect(() => {
    syncDocumentSeo('/marketplace', lang, catalog);
  }, [lang, catalog]);

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<DeskCategory>('all');
  const [verificationFilter, setVerificationFilter] = useState<
    'all' | VerificationMethod
  >('all');
  const [sortKey, setSortKey] = useState<MarketplaceSortKey>('featured');

  const [inspectedItem, setInspectedItem] = useState<DeskIdeaItem | null>(() => {
    if (typeof window === 'undefined') return null;
    return findDeskIdeaFromSearch(window.location.search, DESK_IDEAS_CATALOG);
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Saved Blueprints drawer state (no fake payment checkout)
  const [savedItems, setSavedItems] = useState<DeskIdeaItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Local Draft Blueprint modal state
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [publishSuccessTitle, setPublishSuccessTitle] = useState<string | null>(
    null
  );
  const [formTitle, setFormTitle] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formEngine, setFormEngine] = useState<DeskEngineType>('custom-desk');
  const [formCategory, setFormCategory] =
    useState<Exclude<DeskCategory, 'all'>>('custom-engine');
  const [formVerification, setFormVerification] =
    useState<VerificationMethod>('ea-local-bridge');
  const [formAccountRef, setFormAccountRef] = useState('');
  const [formBrokerServer, setFormBrokerServer] = useState('');
  const [formMaxDd, setFormMaxDd] = useState('2.1');
  const [formWinRate, setFormWinRate] = useState('58');
  const [formProfitFactor, setFormProfitFactor] = useState('2.15');
  const [formPrice, setFormPrice] = useState('0');
  const [formSummary, setFormSummary] = useState('');

  // Close any open modal/drawer on Escape key
  useEffect(() => {
    if (!inspectedItem && !drawerOpen && !publishOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (publishOpen) {
        setPublishOpen(false);
      } else if (drawerOpen) {
        setDrawerOpen(false);
      } else if (inspectedItem) {
        setInspectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedItem, drawerOpen, publishOpen]);

  const filteredItems = useMemo(
    () =>
      filterAndSortDeskIdeas(catalog, {
        query: searchQuery,
        category,
        verificationMethod: verificationFilter,
        sortKey,
      }),
    [catalog, searchQuery, category, verificationFilter, sortKey]
  );

  const isSaved = (id: string) => savedItems.some((item) => item.id === id);

  const handleSaveBlueprint = (item: DeskIdeaItem) => {
    if (!isSaved(item.id)) {
      setSavedItems((prev) => [...prev, item]);
    }
    setDrawerOpen(true);
  };

  const handleRemoveSaved = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownloadConfig = (item: DeskIdeaItem) => {
    const json = buildDeskConfigExport(item);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.id}-desk-blueprint.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyConfig = (item: DeskIdeaItem) => {
    navigator.clipboard?.writeText(buildDeskConfigExport(item)).catch(() => {});
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      title: formTitle,
      creatorHandle: formHandle,
      engineType: formEngine,
      category: formCategory,
      verificationMethod: formVerification,
      accountOrHashRef: formAccountRef,
      brokerServer: formBrokerServer,
      maxDrawdownPct: Number(formMaxDd),
      winRatePct: Number(formWinRate),
      profitFactor: Number(formProfitFactor),
      priceUsd: Number(formPrice),
      summary: formSummary,
    };

    const validation = validateDeskSubmission(input, lang);
    if (!validation.valid) {
      setPublishErrors(validation.errors);
      return;
    }

    const newItem = createVerifiedDeskIdea(input, catalog.length);
    setCatalog((prev) => [newItem, ...prev]);
    setPublishErrors([]);
    setPublishOpen(false);
    setPublishSuccessTitle(newItem.title);
    setCategory('all');
    setVerificationFilter('all');
    setSearchQuery('');
    setFormTitle('');
    setFormHandle('');
    setFormAccountRef('');
    setFormBrokerServer('');
    setFormSummary('');
  };

  const categories: Array<{ id: DeskCategory; label: string }> = [
    { id: 'all', label: isTh ? 'ทั้งหมด' : 'All Blueprints' },
    { id: 'prop-challenge', label: isTh ? 'สอบกองทุน Prop' : 'Prop Challenge' },
    { id: 'discretionary', label: isTh ? 'เทรดมือ / สวิง' : 'Discretionary' },
    { id: 'algorithmic', label: isTh ? 'สาย EA / ระบบ' : 'Algorithmic & EA' },
    { id: 'custom-engine', label: isTh ? 'โต๊ะเทรดอิสระ' : 'Custom Engines' },
  ];

  const deskMarketplaceHref = `${DESK_MARKETPLACE_URL}&lang=${lang}&source=web_marketplace_header`;

  return (
    <section
      id="marketplace"
      data-testid="desk-marketplace-page"
      className="py-8 lg:py-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Marketplace Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#2B2D2F] dark:text-neutral-400">
              <span className="font-semibold text-focus">
                {isTh ? 'TallyNX Blueprint Showcase' : 'TallyNX Blueprint Showcase'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isTh
                  ? 'ตัวอย่างโครงสร้างโต๊ะเทรดสำหรับ TallyNX Desk'
                  : 'Interactive Showcase · Real Publishing in TallyNX Desk'}
              </span>
            </div>

            <h1 className="mt-2.5 text-3xl font-semibold tracking-[-0.03em] text-[#141618] sm:text-4xl dark:text-white">
              {isTh
                ? 'สำรวจโครงสร้างโต๊ะเทรดและกติกาความเสี่ยง'
                : 'Explore trading desk blueprints'}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400 max-w-2xl">
              {isTh
                ? 'หน้านี้แสดงโครงสร้างโต๊ะเทรดตัวอย่างและไฟล์ JSON Spec ที่ออกแบบสำหรับ Live Bridge (.ex5), Cloud API ทางการ หรือแฮชไฟล์ .xlsx การเผยแพร่และโหลดใช้งานจริงทำใน TallyNX Desk โดยไม่มีระบบคัดลอกออเดอร์'
                : 'Inspect sample desk blueprints, risk rulesets, and JSON specs built for Live Bridge (.ex5), Official Cloud APIs, or hashed .xlsx statements. Real verification, publishing, and loading happen inside TallyNX Desk — zero auto copy-trading.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={deskMarketplaceHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="open-desk-marketplace-link"
              className="desk-primary min-h-9 px-4 text-xs"
            >
              <span>
                {isTh ? 'เปิด Marketplace จริงใน Desk' : 'Open Live Marketplace in Desk'}
              </span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              data-testid="open-publish-desk-btn"
              onClick={() => {
                setPublishErrors([]);
                setPublishOpen(true);
              }}
              className="inline-flex h-9 items-center space-x-2 rounded-lg border border-[#D6D1C7] bg-white px-4 text-xs font-semibold text-[#141618] hover:border-focus hover:bg-[#F8F6F0] dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-white transition whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-focus" />
              <span>
                {isTh ? 'ร่าง Blueprint (พรีวิว)' : 'Draft Blueprint (Preview)'}
              </span>
            </button>

            <button
              type="button"
              data-testid="open-saved-blueprints-btn"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-9 items-center space-x-2 rounded-lg border border-[#D6D1C7] bg-white px-4 text-xs font-semibold text-[#141618] hover:border-focus hover:bg-[#F8F6F0] dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-white transition whitespace-nowrap cursor-pointer"
            >
              <Bookmark className="h-3.5 w-3.5 text-focus" />
              <span>
                {isTh ? 'บันทึกไว้' : 'Saved'} ({savedItems.length})
              </span>
            </button>
          </div>
        </div>

        {/* Local draft preview confirmation notice */}
        {publishSuccessTitle && (
          <div
            data-testid="publish-success-banner"
            className="flex items-start justify-between gap-3 rounded-lg border border-hairline bg-panel px-4 py-3 text-xs text-ink"
          >
            <div className="flex items-start space-x-2">
              <FileCheck2 className="mt-0.5 h-4 w-4 text-muted shrink-0" />
              <span>
                {isTh
                  ? `เพิ่มร่างพรีวิว "${publishSuccessTitle}" บนหน้านี้แล้ว (ยังไม่ยืนยันข้อมูลจริง — เปิด TallyNX Desk เพื่อยืนยันและเผยแพร่จริง)`
                  : `Added local draft preview "${publishSuccessTitle}" on this page (unverified — open TallyNX Desk to verify real MT5 telemetry and publish).`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPublishSuccessTitle(null)}
              aria-label="Dismiss confirmation"
              className="mt-0.5 shrink-0 text-muted hover:text-ink cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 4-Column Quantitative Boundary Strip */}
        <div className="grid grid-cols-2 border-y border-[#D6D1C7] dark:border-[#2B2D2F] lg:grid-cols-4">
          <div className="py-5 pr-4 border-r border-b lg:border-b-0 border-[#D6D1C7] dark:border-[#2B2D2F]">
            <div className="font-mono tabular-nums text-2xl font-semibold text-[#141618] dark:text-white">
              {catalog.length}
            </div>
            <div className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
              {isTh
                ? 'Blueprint ตัวอย่างในคลัง'
                : 'Sample Blueprints'}
            </div>
          </div>
          <div className="py-5 pl-4 lg:px-6 border-b lg:border-b-0 lg:border-r border-[#D6D1C7] dark:border-[#2B2D2F]">
            <div className="font-mono tabular-nums text-2xl font-semibold text-[#141618] dark:text-white">
              3 Channels
            </div>
            <div className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
              {isTh
                ? 'Live Bridge (.ex5) · Cloud API · .xlsx'
                : 'Live Bridge (.ex5) · Cloud API · .xlsx'}
            </div>
          </div>
          <div className="py-5 pr-4 lg:px-6 border-r border-[#D6D1C7] dark:border-[#2B2D2F]">
            <div className="font-mono tabular-nums text-2xl font-semibold text-[#141618] dark:text-white">
              0
            </div>
            <div className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
              {isTh
                ? 'คำสั่งที่คัดลอกอัตโนมัติ'
                : 'Orders Copied Automatically'}
            </div>
          </div>
          <div className="py-5 pl-4 lg:pl-6">
            <div className="font-mono tabular-nums text-2xl font-semibold text-focus">
              4 Engines
            </div>
            <div className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
              {isTh
                ? 'Flagship OS, Custom, EA & Macro'
                : 'Flagship OS, Custom, EA & Macro'}
            </div>
          </div>
        </div>

        {/* Search, Category Filter Tabs, Verification Source & Sort Bar */}
        <div className="space-y-4">
          <div className="grid min-w-0 gap-3">
            {/* Category Segmented Tabs */}
            <div
              role="group"
              aria-label="Filter blueprints by trading discipline"
              className="desk-tabs border-b border-hairline"
            >
              {categories.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    data-testid={`marketplace-cat-${cat.id}`}
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={active}
                    className="desk-tab"
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Search, Verification Method, Sort */}
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto_auto]">
              <div className="relative col-span-2 min-w-0 sm:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  data-testid="marketplace-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isTh
                      ? 'ค้นหาชื่อโครงสร้างโต๊ะเทรด, คู่เงิน, ช่องทางซิงก์...'
                      : 'Search blueprint, creator, sync source...'
                  }
                  aria-label="Search Blueprints"
                  className="h-9 w-full rounded-lg border border-[#D6D1C7] bg-white pl-9 pr-3 text-xs text-[#141618] placeholder:text-muted focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-white"
                />
              </div>

              <select
                aria-label="Filter by verification channel"
                value={verificationFilter}
                onChange={(e) =>
                  setVerificationFilter(
                    e.target.value as 'all' | VerificationMethod
                  )
                }
                className="h-9 w-full min-w-0 rounded border border-hairline bg-panel px-2 text-xs font-semibold text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-neutral-200 cursor-pointer"
              >
                <option value="all">
                  {isTh ? 'ทุกช่องทางซิงก์' : 'All Channels'}
                </option>
                <option value="ea-local-bridge">
                  {isTh ? 'Live Bridge (.ex5)' : 'Live Bridge (.ex5)'}
                </option>
                <option value="cloud-api-sync">
                  {isTh ? 'Official Cloud API' : 'Official Cloud API'}
                </option>
                <option value="xlsx-sha256">
                  {isTh ? '.xlsx Statement Hash' : '.xlsx Statement Hash'}
                </option>
              </select>

              <select
                aria-label="Sort Blueprints"
                value={sortKey}
                onChange={(e) =>
                  setSortKey(e.target.value as MarketplaceSortKey)
                }
                className="h-9 w-full min-w-0 rounded border border-hairline bg-panel px-2 text-xs font-semibold text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-neutral-200 cursor-pointer"
              >
                <option value="featured">
                  {isTh ? 'เรียงตามแนะนำ' : 'Featured'}
                </option>
                <option value="profit-factor">
                  {isTh ? 'Profit Factor สูงสุด' : 'Highest Profit Factor'}
                </option>
                <option value="lowest-dd">
                  {isTh ? 'Drawdown ต่ำสุด' : 'Lowest Max Drawdown'}
                </option>
                <option value="price-asc">
                  {isTh ? 'ฟรีขึ้นก่อน' : 'Open Config First'}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Grid or Empty State */}
        {filteredItems.length === 0 ? (
          <div
            data-testid="marketplace-empty-state"
            className="desk-panel p-6 text-center sm:p-12"
          >
            <p className="text-sm font-bold text-[#141618] dark:text-white">
              {isTh
                ? 'ไม่พบ Blueprint ที่ตรงกับตัวกรองของคุณ'
                : 'No blueprints match your active filters.'}
            </p>
            <p className="mt-1.5 text-xs text-[#2B2D2F] dark:text-neutral-400">
              {isTh
                ? 'ลองล้างคำค้นหรือเลือกช่องทางซิงก์อื่น'
                : 'Clear your search or choose a different sync channel.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategory('all');
                setVerificationFilter('all');
              }}
              className="mt-5 inline-flex items-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-white px-4 py-2 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isTh ? 'ล้างตัวกรองทั้งหมด' : 'Reset Filters'}</span>
            </button>
          </div>
        ) : (
          <div
            data-testid="marketplace-catalog-grid"
            className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredItems.map((item) => {
              const saved = isSaved(item.id);
              const verifLabel = VERIFICATION_LABELS[item.verificationMethod][lang];
              const isLocalDraft = item.verificationProof.ledgerHash === 'pending-desk-verification';

              return (
                <article
                  key={item.id}
                  data-testid={`desk-idea-card-${item.id}`}
                  className="desk-panel flex flex-col justify-between p-4 transition-colors hover:border-focus sm:p-5"
                >
                  <div>
                    {/* Quiet Unboxed Inline Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-[#2B2D2F] dark:text-neutral-400">
                      <span className="font-semibold text-focus">
                        {item.engineLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{verifLabel}</span>
                    </div>

                    <h2 className="mt-2.5 text-lg font-bold tracking-tight leading-snug text-[#141618] dark:text-white">
                      {item.title}
                    </h2>

                    <div className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
                      <span>{item.creatorHandle}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{item.verificationProof.brokerServer}</span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-400 line-clamp-3">
                      {isTh ? item.summaryTh : item.summary}
                    </p>

                    {/* Clean Hairline-Divided Quantitative Reference Row */}
                    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#D6D1C7] py-3.5 dark:border-[#2B2D2F]">
                      <div>
                        <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                          {isTh ? 'Max DD ตัวอย่าง' : 'Sample DD'}
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[#141618] dark:text-white">
                          {item.metrics.maxDrawdownPct.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                          Profit Factor
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-ink">
                          {item.metrics.profitFactor.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                          {isTh ? 'สถานะ' : 'Status'}
                        </div>
                        <div className="mt-0.5 font-mono text-xs font-bold text-[#141618] dark:text-white">
                          {isLocalDraft
                            ? isTh
                              ? 'ร่างโลคอล'
                              : 'Local Draft'
                            : isTh
                              ? 'Blueprint'
                              : 'Showcase'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Inspect + Save / Open in Desk */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      data-testid={`inspect-idea-${item.id}`}
                      onClick={() => setInspectedItem(item)}
                      className="h-8 rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 text-xs font-semibold text-[#141618] hover:border-focus hover:bg-white dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition whitespace-nowrap cursor-pointer"
                    >
                      {isTh ? 'ดู Spec & กติกา' : 'Inspect Spec'}
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        data-testid={`save-idea-${item.id}`}
                        onClick={() => handleSaveBlueprint(item)}
                        className={`h-8 rounded-lg border px-2.5 text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                          saved
                            ? 'border-focus bg-focus/10 text-focus'
                            : 'border-hairline bg-canvas text-ink hover:border-focus'
                        }`}
                      >
                        {saved
                          ? isTh
                            ? 'บันทึกแล้ว'
                            : 'Saved'
                          : isTh
                            ? 'บันทึก'
                            : 'Save'}
                      </button>

                      <a
                        href={buildDeskMarketplaceIdeaUrl(item.id, lang)}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`open-in-desk-${item.id}`}
                        className="desk-primary h-8 px-3 text-xs"
                      >
                        <span>{isTh ? 'เปิดใน Desk' : 'Open in Desk'}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Blueprint Spec & Provenance Modal */}
      {inspectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspected-idea-title"
          data-testid="desk-proof-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141618]/70 p-4 backdrop-blur-xs"
          onClick={() => setInspectedItem(null)}
        >
          <div
            className="desk-panel max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#D6D1C7] pb-5 dark:border-[#2B2D2F]">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#2B2D2F] dark:text-neutral-400">
                  <span className="font-semibold text-focus">
                    {inspectedItem.engineLabel}
                  </span>
                  <span>·</span>
                  <span>
                    {VERIFICATION_LABELS[inspectedItem.verificationMethod][lang]}
                  </span>
                </div>
                <h3
                  id="inspected-idea-title"
                  className="mt-1.5 text-xl font-semibold tracking-tight text-[#141618] dark:text-white"
                >
                  {inspectedItem.title}
                </h3>
                <p className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
                  {inspectedItem.creatorHandle} · {inspectedItem.creatorRole}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close blueprint inspector"
                onClick={() => setInspectedItem(null)}
                className="rounded-lg p-1.5 text-[#2B2D2F] hover:bg-[#F8F6F0] dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Non-Custodial Provenance Table */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  {isTh
                    ? 'โครงสร้างกติกาแบบอ่านอย่างเดียว — ไม่มีการคัดลอกออเดอร์อัตโนมัติ การตรวจสอบจริงทำใน TallyNX Desk'
                    : 'Read-only desk blueprint specification — zero auto copy-trading. Live verification runs inside TallyNX Desk.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-hairline [overflow-wrap:anywhere] py-4 text-xs sm:grid-cols-3 dark:border-[#2B2D2F]">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'แหล่งอ้างอิง' : 'Reference Channel'}
                  </span>
                  <span className="mt-0.5 block font-mono font-semibold text-neutral-950 dark:text-white">
                    {inspectedItem.verificationProof.accountMask}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'เซิร์ฟเวอร์ / API' : 'Server / Provider'}
                  </span>
                  <span className="mt-0.5 block font-mono font-semibold text-neutral-950 dark:text-white">
                    {inspectedItem.verificationProof.brokerServer}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'รหัสอ้างอิง Blueprint' : 'Blueprint Reference'}
                  </span>
                  <span className="mt-0.5 block font-mono font-semibold text-focus break-all">
                    {inspectedItem.verificationProof.ledgerHash}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'Win Rate ตัวอย่าง' : 'Sample Win Rate'}
                  </span>
                  <span className="mt-0.5 block font-mono font-bold tabular-nums text-[#141618] dark:text-white">
                    {inspectedItem.metrics.winRatePct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'Max DD ตัวอย่าง' : 'Sample Max DD'}
                  </span>
                  <span className="mt-0.5 block font-mono font-bold tabular-nums text-ink">
                    {inspectedItem.metrics.maxDrawdownPct.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'สถานะข้อมูล' : 'Data Status'}
                  </span>
                  <span className="mt-0.5 block font-mono font-semibold text-[#141618] dark:text-white">
                    {inspectedItem.verificationProof.lastSyncedAt}
                  </span>
                </div>
              </div>

              {/* Included Rules */}
              <div>
                <h4 className="text-xs font-semibold text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'กติกาและโครงสร้างใน Blueprint นี้'
                    : 'Included Desk Rules & Guardrails'}
                </h4>
                <ul className="mt-2.5 space-y-2 text-xs text-[#141618] dark:text-neutral-300">
                  {inspectedItem.includedRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Deal Ledger Table (only if sample deals exist — never fabricated on drafts) */}
              {inspectedItem.sampleDeals.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'ตัวอย่างรายการเทรดประกอบ Blueprint (Sample)'
                      : 'Illustrative Sample Deals'}
                  </h4>
                  <div className="mt-2.5">
                    <table className="proof-ledger w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-y border-[#D6D1C7] text-[#2B2D2F] dark:border-[#2B2D2F] dark:text-neutral-400 font-mono text-[11px]">
                          <th className="py-2 pr-3 text-left font-medium">Ticket</th>
                          <th className="py-2 px-3 text-left font-medium">Symbol</th>
                          <th className="py-2 px-3 text-left font-medium">Side</th>
                          <th className="py-2 px-3 text-right font-medium">Result (R)</th>
                          <th className="py-2 pl-3 text-right font-medium">Max DD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D6D1C7] dark:divide-[#2B2D2F]/70">
                        {inspectedItem.sampleDeals.map((deal) => (
                          <tr key={deal.ticket}>
                            <td className="py-2 pr-3 font-mono text-[#2B2D2F] dark:text-neutral-300">
                              {deal.ticket}
                            </td>
                            <td className="py-2 px-3 font-semibold text-[#141618] dark:text-white">
                              {deal.symbol}
                            </td>
                            <td className="py-2 px-3 font-mono text-[#2B2D2F] dark:text-neutral-400">
                              {deal.side}
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-mono font-semibold tabular-nums ${
                                deal.rMultiple >= 0
                                  ? 'text-positive'
                                  : 'text-negative'
                              }`}
                            >
                              {deal.rMultiple >= 0 ? '+' : ''}
                              {deal.rMultiple.toFixed(2)}R
                            </td>
                            <td className="py-2 pl-3 text-right font-mono tabular-nums text-[#2B2D2F] dark:text-neutral-400">
                              {deal.drawdownPct.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#D6D1C7] pt-5 dark:border-[#2B2D2F]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyConfig(inspectedItem)}
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-white px-3.5 py-2 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer"
                >
                  {copiedId === inspectedItem.id ? (
                    <Check className="h-3.5 w-3.5 text-muted" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {copiedId === inspectedItem.id
                      ? isTh
                        ? 'คัดลอก JSON แล้ว'
                        : 'Copied JSON'
                      : isTh
                        ? 'คัดลอก JSON Spec'
                        : 'Copy JSON Spec'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadConfig(inspectedItem)}
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-white px-3.5 py-2 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isTh ? 'ดาวน์โหลด JSON' : 'Download JSON'}</span>
                </button>
              </div>

              <a
                href={buildDeskMarketplaceIdeaUrl(inspectedItem.id, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="desk-primary px-4 py-2.5 text-xs"
              >
                <span>
                  {isTh ? 'เปิดใช้งานใน TallyNX Desk' : 'Load in TallyNX Desk'}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Saved Blueprints Drawer (Honest JSON Export & Desk Handoff — No Fake Checkout) */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Saved Desk Blueprints"
          data-testid="saved-blueprints-drawer"
          className="fixed inset-0 z-50 flex justify-end bg-[#141618]/55 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="flex h-full w-full min-w-0 max-w-md flex-col border-l border-hairline bg-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D6D1C7] px-6 py-4 dark:border-[#2B2D2F]">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-[#141618] dark:text-white">
                  {isTh ? 'Blueprint ที่บันทึกไว้' : 'Saved Blueprints'}
                </h3>
                <p className="text-xs text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'ส่งออกไฟล์ JSON หรือเปิดใช้งานต่อใน TallyNX Desk'
                    : 'Export JSON specs or open directly in TallyNX Desk'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close saved blueprints"
                onClick={() => setDrawerOpen(false)}
                className="rounded p-1.5 text-[#2B2D2F] hover:bg-[#F8F6F0] dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {savedItems.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-bold text-[#141618] dark:text-white">
                    {isTh ? 'ยังไม่มี Blueprint ที่บันทึกไว้' : 'No saved blueprints yet'}
                  </p>
                  <p className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'กดปุ่มบันทึกบนการ์ดเพื่อเก็บไว้เปรียบเทียบและส่งออก JSON'
                      : 'Save any blueprint from the showcase to export its JSON spec or load it in Desk.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-[#D6D1C7] border-y border-[#D6D1C7] dark:divide-[#2B2D2F] dark:border-[#2B2D2F]">
                    {savedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 py-4"
                      >
                        <div className="min-w-0 space-y-2">
                          <div className="text-xs font-mono font-semibold text-focus">
                            {item.engineLabel} · {item.creatorHandle}
                          </div>
                          <div className="text-sm font-bold text-[#141618] dark:text-white">
                            {item.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadConfig(item)}
                              className="inline-flex items-center space-x-1 rounded border border-[#D6D1C7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-white cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                              <span>JSON</span>
                            </button>
                            <a
                              href={buildDeskMarketplaceIdeaUrl(item.id, lang)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-focus hover:underline"
                            >
                              <span>{isTh ? 'เปิดใน Desk' : 'Open in Desk'}</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.title}`}
                          onClick={() => handleRemoveSaved(item.id)}
                          className="rounded p-1.5 text-muted hover:bg-[#F8F6F0] hover:text-ink dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <a
                    href={deskMarketplaceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="desk-primary w-full py-2.5 text-xs"
                  >
                    <span>
                      {isTh
                        ? 'ไปที่ TallyNX Desk Marketplace'
                        : 'Continue in TallyNX Desk Marketplace'}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Draft Blueprint Preview Modal */}
      {publishOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-desk-title"
          data-testid="publish-desk-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141618]/70 p-4 backdrop-blur-xs"
          onClick={() => setPublishOpen(false)}
        >
          <div
            className="desk-panel max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto overscroll-contain p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#D6D1C7] pb-4 dark:border-[#2B2D2F]">
              <div>
                <h3
                  id="publish-desk-title"
                  className="text-lg font-semibold tracking-tight text-[#141618] dark:text-white"
                >
                  {isTh
                    ? 'ร่าง Blueprint โต๊ะเทรด (พรีวิวในเครื่อง)'
                    : 'Draft a Desk Blueprint (Local Preview)'}
                </h3>
                <p className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'สร้างโครงสร้าง JSON บนหน้านี้เพื่อทดสอบรูปแบบ สำหรับการยืนยันข้อมูล MT5 และเผยแพร่จริงให้ดำเนินการใน TallyNX Desk'
                    : 'Create a local draft blueprint card to preview and export JSON. Real MT5 verification and publishing are handled inside TallyNX Desk.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close draft form"
                onClick={() => setPublishOpen(false)}
                className="rounded-lg p-1.5 text-[#2B2D2F] hover:bg-[#F8F6F0] dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDraftSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pub-title"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'ชื่อ Blueprint *' : 'Blueprint Title *'}
                  </label>
                  <input
                    id="pub-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Frankfurt DAX Open Ladder"
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pub-handle"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'ชื่อผู้สร้าง *' : 'Creator Handle *'}
                  </label>
                  <input
                    id="pub-handle"
                    type="text"
                    value={formHandle}
                    onChange={(e) => setFormHandle(e.target.value)}
                    placeholder="@trader.handle"
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pub-engine"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'สถาปัตยกรรมโต๊ะเทรด' : 'Desk Engine'}
                  </label>
                  <select
                    id="pub-engine"
                    value={formEngine}
                    onChange={(e) =>
                      setFormEngine(e.target.value as DeskEngineType)
                    }
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 text-xs text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  >
                    <option value="ghr-v32">{ENGINE_LABELS['ghr-v32']}</option>
                    <option value="custom-desk">
                      {ENGINE_LABELS['custom-desk']}
                    </option>
                    <option value="ea-guard">{ENGINE_LABELS['ea-guard']}</option>
                    <option value="macro-playbook">
                      {ENGINE_LABELS['macro-playbook']}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pub-category"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'หมวดหมู่' : 'Category'}
                  </label>
                  <select
                    id="pub-category"
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(
                        e.target.value as Exclude<DeskCategory, 'all'>
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 text-xs text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  >
                    <option value="prop-challenge">Prop Challenge</option>
                    <option value="discretionary">Discretionary</option>
                    <option value="algorithmic">Algorithmic & EA</option>
                    <option value="custom-engine">Custom Engine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="pub-verif"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'ช่องทางยืนยันใน Desk *' : 'Target Sync Channel *'}
                  </label>
                  <select
                    id="pub-verif"
                    value={formVerification}
                    onChange={(e) =>
                      setFormVerification(e.target.value as VerificationMethod)
                    }
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 text-xs text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  >
                    <option value="ea-local-bridge">Live Bridge (.ex5)</option>
                    <option value="cloud-api-sync">Official Cloud API</option>
                    <option value="xlsx-sha256">.xlsx Statement Hash</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pub-account-ref"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'รหัสอ้างอิง *' : 'Channel Reference *'}
                  </label>
                  <input
                    id="pub-account-ref"
                    type="text"
                    value={formAccountRef}
                    onChange={(e) => setFormAccountRef(e.target.value)}
                    placeholder="Bridge or API ref"
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pub-broker"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'โบรเกอร์ / ผู้ให้บริการ *' : 'Broker / Provider *'}
                  </label>
                  <input
                    id="pub-broker"
                    type="text"
                    value={formBrokerServer}
                    onChange={(e) => setFormBrokerServer(e.target.value)}
                    placeholder="e.g. FundedNext-MCP"
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="pub-dd"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    Target Max DD (%)
                  </label>
                  <input
                    id="pub-dd"
                    type="number"
                    step="0.1"
                    value={formMaxDd}
                    onChange={(e) => setFormMaxDd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pub-wr"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    Ref Win Rate (%)
                  </label>
                  <input
                    id="pub-wr"
                    type="number"
                    step="0.5"
                    value={formWinRate}
                    onChange={(e) => setFormWinRate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pub-pf"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    Ref Profit Factor
                  </label>
                  <input
                    id="pub-pf"
                    type="number"
                    step="0.05"
                    value={formProfitFactor}
                    onChange={(e) => setFormProfitFactor(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pub-summary"
                  className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                >
                  {isTh ? 'คำอธิบายกติกาและโครงสร้างโต๊ะเทรด *' : 'Desk Rules & Setup Summary *'}
                </label>
                <textarea
                  id="pub-summary"
                  rows={3}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder={
                    isTh
                      ? 'อธิบายกติกาความเสี่ยง ช่วงเวลาเทรด และเงื่อนไขการคุม Drawdown...'
                      : 'Describe the risk ceiling, trading window, and sizing ladder...'
                  }
                  className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                />
              </div>

              {publishErrors.length > 0 && (
                <div
                  data-testid="publish-validation-errors"
                  className="rounded-lg border border-hairline bg-canvas p-3 text-xs font-semibold text-ink"
                >
                  <ul className="list-disc pl-4 space-y-1">
                    {publishErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D6D1C7] pt-4 dark:border-[#2B2D2F]">
                <a
                  href={deskMarketplaceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-focus hover:underline"
                >
                  <span>{isTh ? 'ยืนยันและเผยแพร่จริงใน Desk' : 'Verify & Publish in Desk'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishOpen(false)}
                    className="rounded-lg border border-[#D6D1C7] px-4 py-2 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:text-neutral-300 cursor-pointer transition"
                  >
                    {isTh ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-publish-desk-btn"
                    className="desk-primary px-4 py-2 text-xs"
                  >
                    {isTh ? 'เพิ่มร่างพรีวิว' : 'Add Local Draft'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
