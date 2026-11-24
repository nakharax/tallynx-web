import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  Plus,
  X,
  Check,
  Copy,
  Download,
  ArrowUpRight,
  RotateCcw,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { Language } from '../utils/i18n';
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
  calculateLicenseBagTotal,
  createVerifiedDeskIdea,
  filterAndSortDeskIdeas,
  findDeskIdeaFromSearch,
  validateDeskSubmission,
} from '../utils/marketplaceLogic';
import { syncDocumentSeo } from '../utils/seoLogic';

interface DeskMarketplaceSectionProps {
  lang: Language;
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

  // License Bag & Checkout state
  const [bagItems, setBagItems] = useState<DeskIdeaItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerMt5Id, setBuyerMt5Id] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<{
    receiptId: string;
    buyerEmail: string;
    items: DeskIdeaItem[];
    totalUsd: number;
  } | null>(null);

  // Publish Verified Desk-Idea modal state
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
    useState<VerificationMethod>('mt5-investor-sync');
  const [formAccountRef, setFormAccountRef] = useState('');
  const [formBrokerServer, setFormBrokerServer] = useState('');
  const [formMaxDd, setFormMaxDd] = useState('2.1');
  const [formWinRate, setFormWinRate] = useState('58');
  const [formProfitFactor, setFormProfitFactor] = useState('2.15');
  const [formPrice, setFormPrice] = useState('45');
  const [formSummary, setFormSummary] = useState('');

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

  const bagSummary = useMemo(() => calculateLicenseBagTotal(bagItems), [bagItems]);

  const isInBag = (id: string) => bagItems.some((item) => item.id === id);

  const handleAddToBag = (item: DeskIdeaItem) => {
    setCompletedReceipt(null);
    if (!isInBag(item.id)) {
      setBagItems((prev) => [...prev, item]);
    }
    setBagOpen(true);
  };

  const handleRemoveFromBag = (id: string) => {
    setBagItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = buyerEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setCheckoutError(
        isTh
          ? 'กรอกอีเมลที่ถูกต้องสำหรับใบรับสิทธิ์'
          : 'Enter a valid email address for the license receipt.'
      );
      return;
    }
    if (bagItems.length === 0) {
      setCheckoutError(
        isTh ? 'ยังไม่มี Desk-Idea ในรายการ' : 'Your license bag is empty.'
      );
      return;
    }

    setCheckoutError(null);
    const receiptId = `TD-LIC-${Math.floor(100000 + Math.random() * 900000)}`;
    setCompletedReceipt({
      receiptId,
      buyerEmail: trimmedEmail,
      items: [...bagItems],
      totalUsd: bagSummary.subtotalUsd,
    });
    setBagItems([]);
  };

  const handleDownloadConfig = (item: DeskIdeaItem) => {
    const json = buildDeskConfigExport(item);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.id}-desk-config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyConfig = (item: DeskIdeaItem) => {
    navigator.clipboard.writeText(buildDeskConfigExport(item));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
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
    { id: 'all', label: isTh ? 'ทั้งหมด' : 'All Desks' },
    { id: 'prop-challenge', label: isTh ? 'สอบกองทุน Prop' : 'Prop Challenge' },
    { id: 'discretionary', label: isTh ? 'เทรดมือ / สวิง' : 'Discretionary' },
    { id: 'algorithmic', label: isTh ? 'สาย EA / ระบบ' : 'Algorithmic & EA' },
    { id: 'custom-engine', label: isTh ? 'โต๊ะเทรดอิสระ' : 'Custom Engines' },
  ];

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
                {isTh ? 'TallyNX Marketplace' : 'TallyNX Marketplace'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isTh
                  ? 'รองรับทั้ง GHR v3.2 และโครงสร้างโต๊ะเทรดอิสระ'
                  : 'GHR v3.2 & Custom Desk Setups'}
              </span>
            </div>

            <h1 className="mt-2.5 text-3xl font-semibold tracking-[-0.03em] text-[#141618] sm:text-4xl dark:text-white">
              {isTh
                ? 'เลือกดูชุดตั้งค่าโต๊ะเทรด'
                : 'Browse trading desk setups'}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#2B2D2F] dark:text-neutral-400 max-w-2xl">
              {isTh
                ? 'ตรวจแหล่งข้อมูลของแต่ละชุดได้จาก MT5 Investor Sync แบบอ่านอย่างเดียวหรือแฮชไฟล์ .xlsx ระบบไม่คัดลอกออเดอร์'
                : 'Review the risk rules, desk layout, and proof source in each listing. Proof uses read-only MT5 data or hashed broker statements. Orders are never copied.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                {isTh ? 'เพิ่ม Desk-Idea' : 'Add Desk-Idea'}
              </span>
            </button>

            <button
              type="button"
              data-testid="open-license-bag-btn"
              onClick={() => setBagOpen(true)}
              className="desk-primary min-h-9 px-4 text-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>
                {isTh ? 'รายการสั่งซื้อ' : 'License Bag'} ({bagSummary.count})
              </span>
            </button>
          </div>
        </div>

        {/* Publication confirmation notice */}
        {publishSuccessTitle && (
          <div
            data-testid="publish-success-banner"
            className="flex items-start justify-between gap-3 rounded-lg border border-hairline bg-panel px-4 py-3 text-xs text-ink"
          >
            <div className="flex items-start space-x-2">
              <FileCheck2 className="mt-0.5 h-4 w-4 text-muted shrink-0" />
              <span>
                {isTh
                  ? `เพิ่ม "${publishSuccessTitle}" ลงในรายการบนหน้านี้แล้ว`
                  : `Added "${publishSuccessTitle}" to the listings on this page.`}
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
                ? 'Desk-Idea ในรายการ'
                : 'Desk-Idea Listings'}
            </div>
          </div>
          <div className="py-5 pl-4 lg:px-6 border-b lg:border-b-0 lg:border-r border-[#D6D1C7] dark:border-[#2B2D2F]">
            <div className="font-mono tabular-nums text-2xl font-semibold text-[#141618] dark:text-white">
              100%
            </div>
            <div className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
              {isTh
                ? 'ระบุแหล่งข้อมูลที่ใช้ยืนยัน'
                : 'Listings with a Proof Source'}
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
                ? 'รองรับ GHR v3.2 และ Desk อื่นๆ'
                : 'GHR v3.2, Custom, EA & Macro'}
            </div>
          </div>
        </div>

        {/* Search, Category Filter Tabs, Verification Source & Sort Bar */}
        <div className="space-y-4">
          <div className="grid min-w-0 gap-3">
            {/* Category Segmented Tabs */}
            <div
              role="group"
              aria-label="Filter Desk-Ideas by trading discipline"
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
                      ? 'ค้นหาชื่อโต๊ะเทรด, คู่เงิน, โบรเกอร์...'
                      : 'Search title, creator, broker...'
                  }
                  aria-label="Search Desk-Ideas"
                  className="h-9 w-full rounded-lg border border-[#D6D1C7] bg-white pl-9 pr-3 text-xs text-[#141618] placeholder:text-muted focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-white"
                />
              </div>

              <select
                aria-label="Filter by verification method"
                value={verificationFilter}
                onChange={(e) =>
                  setVerificationFilter(
                    e.target.value as 'all' | VerificationMethod
                  )
                }
                className="h-9 w-full min-w-0 rounded border border-hairline bg-panel px-2 text-xs font-semibold text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-neutral-200 cursor-pointer"
              >
                <option value="all">
                  {isTh ? 'แหล่งยืนยันทั้งหมด' : 'All Proofs'}
                </option>
                <option value="mt5-investor-sync">
                  {isTh ? 'MT5 Investor Sync' : 'MT5 Investor Sync'}
                </option>
                <option value="xlsx-sha256">
                  {isTh ? '.xlsx Statement Hash' : '.xlsx Statement Hash'}
                </option>
                <option value="ea-local-bridge">
                  {isTh ? 'Local EA Bridge' : 'Local EA Bridge'}
                </option>
              </select>

              <select
                aria-label="Sort Desk-Ideas"
                value={sortKey}
                onChange={(e) =>
                  setSortKey(e.target.value as MarketplaceSortKey)
                }
                className="h-9 w-full min-w-0 rounded border border-hairline bg-panel px-2 text-xs font-semibold text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-neutral-200 cursor-pointer"
              >
                <option value="featured">
                  {isTh ? 'เรียงตามยอดนิยม' : 'Most Licensed'}
                </option>
                <option value="profit-factor">
                  {isTh ? 'Profit Factor สูงสุด' : 'Highest Profit Factor'}
                </option>
                <option value="lowest-dd">
                  {isTh ? 'Drawdown ต่ำสุด' : 'Lowest Max Drawdown'}
                </option>
                <option value="price-asc">
                  {isTh ? 'ราคาต่ำไปสูง' : 'Price: Low to High'}
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
                ? 'ไม่พบ Desk-Idea ที่ตรงกับตัวกรองของคุณ'
                : 'No verified Desk-Ideas match your active filters.'}
            </p>
            <p className="mt-1.5 text-xs text-[#2B2D2F] dark:text-neutral-400">
              {isTh
                ? 'ลองล้างคำค้นหรือเลือกแหล่งยืนยันอื่น'
                : 'Clear your search or choose a different verification method.'}
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
              const added = isInBag(item.id);
              const verifLabel = VERIFICATION_LABELS[item.verificationMethod][lang];

              return (
                <article
                  key={item.id}
                  data-testid={`desk-idea-card-${item.id}`}
                  className="desk-panel flex flex-col justify-between p-4 transition-colors hover:border-focus sm:p-5"
                >
                  <div>
                    {/* Quiet Unboxed Inline Metadata (Zero-Pill Rule) */}
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

                    {/* Clean Hairline-Divided Quantitative Telemetry Row */}
                    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#D6D1C7] py-3.5 dark:border-[#2B2D2F]">
                      <div>
                        <div className="text-[11px] text-[#2B2D2F] dark:text-neutral-400">
                          {isTh ? 'Max DD จริง' : 'Max DD'}
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
                          {isTh ? 'ดีลจริง' : 'Deals'}
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[#141618] dark:text-white">
                          {item.verificationProof.verifiedDealsCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Price + Inspect / Acquire */}
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="font-mono text-base font-semibold tabular-nums text-[#141618] dark:text-white">
                        {item.priceUsd === 0
                          ? isTh
                            ? 'ฟรี (Open Config)'
                            : 'Free'
                          : `$${item.priceUsd}`}
                      </div>
                      <div className="font-mono text-[10px] tabular-nums text-[#2B2D2F] dark:text-neutral-400">
                        {item.licensesIssued}{' '}
                        {isTh ? 'ผู้ใช้งาน' : 'licenses issued'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid={`inspect-idea-${item.id}`}
                        onClick={() => setInspectedItem(item)}
                        className="h-8 rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 text-xs font-semibold text-[#141618] hover:border-focus hover:bg-white dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition whitespace-nowrap cursor-pointer"
                      >
                        {isTh ? 'ตรวจหลักฐาน' : 'Inspect Proof'}
                      </button>

                      <button
                        type="button"
                        data-testid={`acquire-idea-${item.id}`}
                        onClick={() => handleAddToBag(item)}
                        className={`h-8 rounded-lg px-3.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                          added
                            ? 'border border-hairline bg-canvas text-ink hover:border-focus'
                            : 'desk-primary'
                        }`}
                      >
                        {added
                          ? isTh
                            ? 'อยู่ในรายการ'
                            : 'In Bag'
                          : item.priceUsd === 0
                          ? isTh
                            ? 'รับฟรี'
                            : 'Get Free'
                          : isTh
                          ? 'ซื้อสิทธิ์'
                          : 'License'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-Data Proof & Details Modal */}
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
                aria-label="Close proof inspector"
                onClick={() => setInspectedItem(null)}
                className="rounded-lg p-1.5 text-[#2B2D2F] hover:bg-[#F8F6F0] dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cryptographic & MT5 Provenance Table */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  {isTh
                    ? 'หลักฐานจากข้อมูลเทรดแบบอ่านอย่างเดียว แฮชช่วยตรวจการแก้ไขย้อนหลัง ระบบไม่คัดลอกออเดอร์'
                    : 'Read-only trade records. The hash helps check for edits. Orders are never copied.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-hairline [overflow-wrap:anywhere] py-4 text-xs sm:grid-cols-3 dark:border-[#2B2D2F]">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'พอร์ตอ้างอิง' : 'Account'}
                  </span>
                  <span className="mt-0.5 block font-mono font-semibold text-neutral-950 dark:text-white">
                    {inspectedItem.verificationProof.accountMask}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'เซิร์ฟเวอร์โบรเกอร์' : 'Broker Server'}
                  </span>
                  <span className="mt-0.5 block font-mono font-semibold text-neutral-950 dark:text-white">
                    {inspectedItem.verificationProof.brokerServer}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'แฮช Ledger' : 'Ledger Hash'}
                  </span>
                  <span className="mt-0.5 block font-mono font-semibold text-focus break-all">
                    {inspectedItem.verificationProof.ledgerHash}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    Win Rate
                  </span>
                  <span className="mt-0.5 block font-mono font-bold tabular-nums text-[#141618] dark:text-white">
                    {inspectedItem.metrics.winRatePct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    Expectancy
                  </span>
                  <span className="mt-0.5 block font-mono font-bold tabular-nums text-positive">
                    +{inspectedItem.metrics.expectancyR.toFixed(2)}R
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block">
                    {isTh ? 'ระยะเวลาเก็บสถิติ' : 'Tracking Window'}
                  </span>
                  <span className="mt-0.5 block font-mono font-bold tabular-nums text-[#141618] dark:text-white">
                    {inspectedItem.verificationProof.trackingWindowDays}d (
                    {inspectedItem.verificationProof.verifiedDealsCount} deals)
                  </span>
                </div>
              </div>

              {/* Included Rules */}
              <div>
                <h4 className="text-xs font-semibold text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'กติกาและโครงสร้างในชุด Desk-Idea นี้'
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

              {/* Sample Verified Deal Ledger Table */}
              <div>
                <h4 className="text-xs font-semibold text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'ตัวอย่างรายการเทรดจาก Ledger'
                    : 'Sample Deals from the Ledger'}
                </h4>
                <div className="mt-2.5">
                  <table className="proof-ledger w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-y border-[#D6D1C7] text-[#2B2D2F] dark:border-[#2B2D2F] dark:text-neutral-400 font-mono text-[11px]">
                        <th className="py-2 pr-3 text-left font-medium">
                          Ticket
                        </th>
                        <th className="py-2 px-3 text-left font-medium">
                          Symbol
                        </th>
                        <th className="py-2 px-3 text-left font-medium">
                          Side
                        </th>
                        <th className="py-2 px-3 text-right font-medium">
                          Result (R)
                        </th>
                        <th className="py-2 pl-3 text-right font-medium">
                          Max DD
                        </th>
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
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#D6D1C7] pt-5 dark:border-[#2B2D2F]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyConfig(inspectedItem)}
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-[#D6D1C7] bg-white px-4 py-2 text-xs font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-neutral-200 transition cursor-pointer"
                >
                  {copiedId === inspectedItem.id ? (
                    <Check className="h-3.5 w-3.5 text-muted" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {copiedId === inspectedItem.id
                      ? isTh
                        ? 'คัดลอก Config แล้ว'
                        : 'Copied Config'
                      : isTh
                      ? 'คัดลอก JSON Config'
                      : 'Copy JSON Spec'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = inspectedItem;
                  setInspectedItem(null);
                  handleAddToBag(target);
                }}
                className="desk-primary px-4 py-2.5 text-xs"
              >
                <span>
                  {inspectedItem.priceUsd === 0
                    ? isTh
                      ? 'รับ Desk Config ฟรี'
                      : 'Add Free Config to Bag'
                    : isTh
                    ? `เพิ่มลงรายการซื้อ ($${inspectedItem.priceUsd})`
                    : `License Desk-Idea ($${inspectedItem.priceUsd})`}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over License Bag & Checkout Drawer */}
      {bagOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Desk-Idea License Bag"
          data-testid="license-bag-drawer"
          className="fixed inset-0 z-50 flex justify-end bg-[#141618]/55 backdrop-blur-xs"
          onClick={() => setBagOpen(false)}
        >
          <div
            className="flex h-full w-full min-w-0 max-w-md flex-col border-l border-hairline bg-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D6D1C7] px-6 py-4 dark:border-[#2B2D2F]">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-[#141618] dark:text-white">
                  {isTh ? 'รายการสิทธิ์ Desk-Idea' : 'Desk-Idea License Bag'}
                </h3>
                <p className="text-xs text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'นำเข้ากติกาลงใน TallyNX Desk ของคุณเอง (ไม่ใช่ Copy-Trade)'
                    : 'Local Desk Configurations · Zero Auto-Execution'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close license bag"
                onClick={() => setBagOpen(false)}
                className="rounded p-1.5 text-[#2B2D2F] hover:bg-[#F8F6F0] dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {completedReceipt ? (
                <div
                  data-testid="license-checkout-receipt"
                  className="space-y-4 rounded-lg border border-hairline bg-canvas p-4 [overflow-wrap:anywhere]"
                >
                  <div className="flex items-center space-x-2 text-ink font-semibold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {isTh ? 'ออกใบอนุญาตสำเร็จ' : 'License Confirmed'} ·{' '}
                      {completedReceipt.receiptId}
                    </span>
                  </div>
                  <p className="text-xs text-[#141618] dark:text-neutral-300">
                    {isTh
                      ? `ใบรับสิทธิ์ระบุอีเมล ${completedReceipt.buyerEmail} ดาวน์โหลดไฟล์ JSON ด้านล่างเพื่อนำเข้า TallyNX Desk`
                      : `Receipt email ${completedReceipt.buyerEmail}. Download the JSON files below to import into your TallyNX workspace.`}
                  </p>
                  <div className="space-y-2 border-t border-hairline pt-3">
                    {completedReceipt.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-semibold text-[#141618] dark:text-white truncate">
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadConfig(item)}
                          className="inline-flex items-center space-x-1 rounded border border-[#D6D1C7] bg-white px-3 py-1 text-[11px] font-semibold text-[#141618] hover:border-focus dark:border-neutral-700 dark:bg-[#1B1E21] dark:text-white shrink-0 cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>JSON</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : bagItems.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-bold text-[#141618] dark:text-white">
                    {isTh ? 'ยังไม่มีรายการที่เลือก' : 'Your license bag is empty'}
                  </p>
                  <p className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
                    {isTh
                      ? 'เลือก Desk-Idea ที่ผ่านการยืนยันข้อมูลจริงเพื่อนำเข้าโต๊ะเทรดของคุณ'
                      : 'Select any real-data verified Desk-Idea to import its rulebook and sizing ladder.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-[#D6D1C7] border-y border-[#D6D1C7] dark:divide-[#2B2D2F] dark:border-[#2B2D2F]">
                    {bagItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 py-4"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-semibold text-focus">
                            {item.engineLabel} · {item.creatorHandle}
                          </div>
                          <div className="mt-0.5 text-sm font-bold text-[#141618] dark:text-white">
                            {item.title}
                          </div>
                          <div className="mt-1 font-mono text-xs tabular-nums text-[#2B2D2F] dark:text-neutral-400">
                            {item.priceUsd === 0 ? 'Free' : `$${item.priceUsd}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.title}`}
                          onClick={() => handleRemoveFromBag(item.id)}
                          className="rounded p-1.5 text-muted hover:bg-[#F8F6F0] hover:text-ink dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-3 pt-2">
                    <div>
                      <label
                        htmlFor="buyer-email-input"
                        className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                      >
                        {isTh ? 'อีเมลสำหรับใบรับสิทธิ์ *' : 'Receipt Email *'}
                      </label>
                      <input
                        id="buyer-email-input"
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="trader@example.com"
                        className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3.5 py-2 text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="buyer-mt5-input"
                        className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                      >
                        {isTh
                          ? 'เลขพอร์ต MT5 (ไม่บังคับ · ใช้ผูก License)'
                          : 'Target MT5 Account ID (Optional · License Bind)'}
                      </label>
                      <input
                        id="buyer-mt5-input"
                        type="text"
                        value={buyerMt5Id}
                        onChange={(e) => setBuyerMt5Id(e.target.value)}
                        placeholder="e.g. 88492015"
                        className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3.5 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#1B1E21] dark:text-white"
                      />
                    </div>

                    {checkoutError && (
                      <p className="text-xs font-semibold text-ink">
                        {checkoutError}
                      </p>
                    )}

                    <div className="border-t border-[#D6D1C7] pt-4 dark:border-[#2B2D2F]">
                      <div className="flex items-center justify-between text-sm font-bold text-[#141618] dark:text-white">
                        <span>{isTh ? 'ยอดรวมสุทธิ' : 'Total Due'}</span>
                        <span className="font-mono tabular-nums">
                          ${bagSummary.subtotalUsd}
                        </span>
                      </div>
                      <button
                        type="submit"
                        data-testid="confirm-license-checkout-btn"
                        className="desk-primary mt-4 w-full py-2.5 text-xs"
                      >
                        {bagSummary.subtotalUsd === 0
                          ? isTh
                            ? 'รับ Desk Config ทันที'
                            : 'Claim Free Configs'
                          : isTh
                          ? `ยืนยันรับสิทธิ์ ($${bagSummary.subtotalUsd})`
                          : `Complete License ($${bagSummary.subtotalUsd})`}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Verified Desk-Idea Modal */}
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
                    ? 'เพิ่ม Desk-Idea พร้อมแหล่งข้อมูล'
                    : 'Add Desk-Idea with a Proof Source'}
                </h3>
                <p className="mt-1 text-xs text-[#2B2D2F] dark:text-neutral-400">
                  {isTh
                    ? 'ต้องระบุเลขบัญชี MT5 Investor หรือแฮช SHA-256 ของไฟล์ .xlsx สำหรับชุดที่เพิ่ม'
                    : 'You must provide an MT5 Investor account reference or the SHA-256 hash of an .xlsx statement.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close publish form"
                onClick={() => setPublishOpen(false)}
                className="rounded-lg p-1.5 text-[#2B2D2F] hover:bg-[#F8F6F0] dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pub-title"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'ชื่อ Desk-Idea *' : 'Desk-Idea Title *'}
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
                    {isTh ? 'วิธีตรวจข้อมูลจริง *' : 'Verification Source *'}
                  </label>
                  <select
                    id="pub-verif"
                    value={formVerification}
                    onChange={(e) =>
                      setFormVerification(e.target.value as VerificationMethod)
                    }
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 text-xs text-[#141618] focus:border-focus focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  >
                    <option value="mt5-investor-sync">
                      MT5 Investor Sync
                    </option>
                    <option value="xlsx-sha256">.xlsx SHA-256 Hash</option>
                    <option value="ea-local-bridge">Local EA Bridge</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pub-account-ref"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'เลขพอร์ต / รหัสแฮช *' : 'MT5 ID or Hash *'}
                  </label>
                  <input
                    id="pub-account-ref"
                    type="text"
                    value={formAccountRef}
                    onChange={(e) => setFormAccountRef(e.target.value)}
                    placeholder="99201455"
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pub-broker"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    {isTh ? 'โบรเกอร์เซิร์ฟเวอร์ *' : 'Broker Server *'}
                  </label>
                  <input
                    id="pub-broker"
                    type="text"
                    value={formBrokerServer}
                    onChange={(e) => setFormBrokerServer(e.target.value)}
                    placeholder="RawSpread-Live02"
                    className="mt-1 w-full rounded-lg border border-[#D6D1C7] bg-[#F8F6F0] px-3 py-2 font-mono text-xs text-[#141618] focus:border-focus focus:bg-white focus:outline-none dark:border-[#2B2D2F] dark:bg-[#141618] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label
                    htmlFor="pub-dd"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    Max DD (%)
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
                    Win Rate (%)
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
                    Profit Factor
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
                <div>
                  <label
                    htmlFor="pub-price"
                    className="block text-xs font-semibold text-[#141618] dark:text-neutral-300"
                  >
                    Price (USD)
                  </label>
                  <input
                    id="pub-price"
                    type="number"
                    step="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
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

              <div className="flex items-center justify-end gap-3 border-t border-[#D6D1C7] pt-4 dark:border-[#2B2D2F]">
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
                  {isTh ? 'เพิ่มลงรายการ' : 'Add Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
