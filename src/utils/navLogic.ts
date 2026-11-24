import { getDictionary, type Language } from './i18n';

export const VALID_APP_ROUTES = [
  '/',
  '/sandbox',
  '/workspace',
  '/analytics',
  '/infrastructure',
  '/marketplace',
  '/onboarding',
] as const;

export type AppRoutePath = typeof VALID_APP_ROUTES[number];
export type NavCategoryId = 'tools' | 'platform';

export type NavDropdownItem = {
  id: string;
  title: string;
  description: string;
  iconKey: 'shield' | 'layers' | 'layout' | 'store' | 'external' | 'barChart' | 'sandbox' | 'rocket';
} & (
  | { href: AppRoutePath; external?: false }
  | { href: string; external: true }
);

export interface NavCategory {
  id: NavCategoryId;
  label: string;
  items: NavDropdownItem[];
}

export function toggleCategoryDropdown(
  currentOpen: NavCategoryId | null,
  clickedCategory: NavCategoryId
): NavCategoryId | null {
  return currentOpen === clickedCategory ? null : clickedCategory;
}

export function normalizeRoutePath(rawPathname: string): AppRoutePath {
  const cleaned = rawPathname.replace(/\/+$/, '');
  return VALID_APP_ROUTES.find((path) => path === cleaned) ?? '/';
}

export function isCategoryActive(
  category: NavCategory,
  currentPath: AppRoutePath
): boolean {
  return category.items.some((item) => !item.external && item.href === currentPath);
}

export function getRouteNavigationContext(
  currentPath: AppRoutePath,
  lang: Language
): {
  category: NavCategory;
  currentItem: NavDropdownItem;
  prevItem: NavDropdownItem;
  nextItem: NavDropdownItem;
} {
  const internalItems = getNavCategories(lang).flatMap((category) =>
    category.items.filter((item) => !item.external).map((item) => ({ category, item }))
  );
  const index = internalItems.findIndex(({ item }) => item.href === currentPath);
  const current = Math.max(0, index);
  const count = internalItems.length;

  return {
    category: internalItems[current].category,
    currentItem: internalItems[current].item,
    prevItem: internalItems[(current - 1 + count) % count].item,
    nextItem: internalItems[(current + 1) % count].item,
  };
}

export const TREDYN_MALL_URL: string =
  import.meta.env?.VITE_TREDYN_MALL_URL ||
  import.meta.env?.VITE_TREDYN_DESK_URL ||
  'https://mall.tallynx.com/';
export const TREDYN_DESK_URL = TREDYN_MALL_URL;
export const TREDYN_MALL_CHAT_URL = 'https://mall.tallynx.com/?page=mall';
export const TALLYNX_DESK_APP_URL = 'https://desk.tallynx.com/';

export function resolveWebTheme(search: string): 'light' | 'dark' | undefined {
  const theme = new URLSearchParams(search).get('theme')?.trim().toLowerCase();
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

export function shouldForceSkeletonFromSearch(search: string): boolean {
  const value = new URLSearchParams(search).get('skeleton');
  return value === '1' || value === 'true';
}

const SKELETON_VARIANT_BY_ROUTE = {
  '/': 'hero-split',
  '/sandbox': 'live-sandbox',
  '/workspace': 'workspace-showcase',
  '/analytics': 'analytics-dashboard',
  '/infrastructure': 'comparison-split',
  '/marketplace': 'marketplace-grid',
  '/onboarding': 'onboarding-funnel',
} as const satisfies Record<AppRoutePath, string>;

export function getRouteSkeletonConfig(routePath: AppRoutePath, lang: Language) {
  const normalized = normalizeRoutePath(routePath);
  const { currentItem } = getRouteNavigationContext(normalized, lang);

  return {
    routePath: normalized,
    variant: SKELETON_VARIANT_BY_ROUTE[normalized],
    statusLabel: lang === 'th' ? `กำลังโหลด · ${normalized}` : `Loading · ${normalized}`,
    moduleTitle: currentItem.title,
  };
}

const NAV_CATEGORIES_BY_LANG: Record<Language, NavCategory[]> = {
  en: [
    {
      id: 'tools',
      label: 'Risk Tools',
      items: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Check your lot size and audit an MT5 statement',
          href: '/',
          iconKey: 'shield',
        },
        {
          id: 'sandbox',
          title: 'Live Sandbox',
          description: 'Simulate drawdown and a 15-minute cooldown without signing in',
          href: '/sandbox',
          iconKey: 'sandbox',
        },
        {
          id: 'workspace-showcase',
          title: 'Desk Workspace',
          description: 'Walk through the lot calculator, trade review, and risk rules',
          href: '/workspace',
          iconKey: 'layout',
        },
        {
          id: 'analytics',
          title: 'Drawdown Audit',
          description: 'Review a sample MT5 deal ledger, drawdown, and session stats',
          href: '/analytics',
          iconKey: 'barChart',
        },
      ],
    },
    {
      id: 'platform',
      label: 'Bridge & Setup',
      items: [
        {
          id: 'architecture',
          title: 'MT5 Bridge Safety',
          description: 'Compare the read-only local bridge with cloud copy-bots',
          href: '/infrastructure',
          iconKey: 'layers',
        },
        {
          id: 'marketplace',
          title: 'Marketplace',
          description: 'Browse verified community setups and tools',
          href: '/marketplace',
          iconKey: 'store',
        },
        {
          id: 'onboarding',
          title: '5-Step Onboarding',
          description: 'Configure your risk limits and carry them into Desk',
          href: '/onboarding',
          iconKey: 'rocket',
        },
        {
          id: 'launch-desk',
          title: getDictionary('en').nav.openDesk,
          description: 'Open the Desk app with your current settings',
          href: TALLYNX_DESK_APP_URL,
          external: true,
          iconKey: 'external',
        },
      ],
    },
  ],
  th: [
    {
      id: 'tools',
      label: 'เครื่องมือคุมความเสี่ยง',
      items: [
        {
          id: 'overview',
          title: 'ภาพรวม',
          description: 'เช็กขนาด Lot และตรวจรายงานการเทรด MT5',
          href: '/',
          iconKey: 'shield',
        },
        {
          id: 'sandbox',
          title: 'ทดลอง Live Sandbox',
          description: 'จำลอง Drawdown และช่วงพัก 15 นาทีโดยไม่ต้องล็อกอิน',
          href: '/sandbox',
          iconKey: 'sandbox',
        },
        {
          id: 'workspace-showcase',
          title: 'เครื่องมือในโต๊ะเทรด',
          description: 'ดูวิธีคำนวณ Lot ทบทวนออเดอร์ และตรวจเงื่อนไขความเสี่ยง',
          href: '/workspace',
          iconKey: 'layout',
        },
        {
          id: 'analytics',
          title: 'ตรวจสอบ Drawdown',
          description: 'ดูสมุดเทรด MT5 ตัวอย่าง พร้อม Drawdown และสถิติรายเซสชัน',
          href: '/analytics',
          iconKey: 'barChart',
        },
      ],
    },
    {
      id: 'platform',
      label: 'การเชื่อมต่อและตั้งค่า',
      items: [
        {
          id: 'architecture',
          title: 'ความปลอดภัยของ MT5 Bridge',
          description: 'เปรียบเทียบการอ่านข้อมูลผ่าน Local Bridge กับบอทคัดลอกออเดอร์บนคลาวด์',
          href: '/infrastructure',
          iconKey: 'layers',
        },
        {
          id: 'marketplace',
          title: 'ตลาดเซ็ตอัปและเครื่องมือ',
          description: 'เลือกดูเซ็ตอัปและเครื่องมือของชุมชนที่ผ่านการตรวจสอบ',
          href: '/marketplace',
          iconKey: 'store',
        },
        {
          id: 'onboarding',
          title: 'เริ่มต้นใช้งาน 5 ขั้นตอน',
          description: 'กำหนดเพดานความเสี่ยงแล้วนำค่าที่ตั้งไว้ไปใช้ในโต๊ะเทรด',
          href: '/onboarding',
          iconKey: 'rocket',
        },
        {
          id: 'launch-desk',
          title: getDictionary('th').nav.openDesk,
          description: 'เปิดโต๊ะเทรดพร้อมค่าที่ตั้งไว้',
          href: TALLYNX_DESK_APP_URL,
          external: true,
          iconKey: 'external',
        },
      ],
    },
  ],
};

export function getNavCategories(lang: Language, deskLaunchUrl?: string): NavCategory[] {
  const categories = NAV_CATEGORIES_BY_LANG[lang];
  if (!deskLaunchUrl) return categories;

  return categories.map((category) => category.id === 'platform'
    ? {
        ...category,
        items: category.items.map((item) =>
          item.external ? { ...item, href: deskLaunchUrl } : item
        ),
      }
    : category
  );
}
