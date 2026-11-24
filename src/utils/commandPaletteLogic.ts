import { type Language, getDictionary } from './i18n.ts';
import { type AppRoutePath, getNavCategories, type NavDropdownItem } from './navLogic.ts';

export type CommandActionId =
  | 'toggle-theme'
  | 'toggle-lang'
  | 'open-advisor'
  | 'launch-desk';

export type CommandPaletteItem = {
  id: string;
  title: string;
  description: string;
  groupLabel: string;
  badge: string;
  iconKey: NavDropdownItem['iconKey'] | 'sun' | 'globe' | 'sparkles';
  keywords: string;
} & (
  | { kind: 'route'; href: AppRoutePath }
  | { kind: 'action'; actionId: CommandActionId }
);

export function buildCommandPaletteItems(
  lang: Language,
  isDark: boolean
): CommandPaletteItem[] {
  const isTh = lang === 'th';
  const categories = getNavCategories(lang);

  const routeItems = categories.flatMap(({ label, items }) =>
    items.filter((item) => item.external !== true).map<CommandPaletteItem>((item) => ({
      id: `route-${item.id}`,
      kind: 'route',
      title: item.title,
      description: item.description,
      groupLabel: label,
      badge: item.href,
      href: item.href,
      iconKey: item.iconKey,
      keywords: item.href === '/' ? 'home landing index หน้าหลัก risk shield statement autopsy' : '',
    }))
  );

  const groupLabel = isTh ? 'คำสั่งด่วน' : 'Quick Actions';
  const quickActions: CommandPaletteItem[] = [
    {
      id: 'action-launch-desk',
      kind: 'action',
      actionId: 'launch-desk',
      title: getDictionary(lang).nav.openDesk,
      description: isTh
        ? 'เปิดโต๊ะเทรดพร้อมภาษา ธีม และค่าจาก Sandbox ที่ตั้งไว้'
        : 'Open Desk with your language, theme, and sandbox settings',
      groupLabel,
      badge: 'Desk',
      iconKey: 'rocket',
      keywords: 'launch desk open app terminal tallynx เปิดโต๊ะเทรด',
    },
    {
      id: 'action-open-advisor',
      kind: 'action',
      actionId: 'open-advisor',
      title: isTh ? 'เปิดผู้ช่วยวิเคราะห์ความเสี่ยง (TallyNX AI Advisor)' : 'Open TallyNX AI Advisor',
      description: isTh
        ? 'วิเคราะห์ 12-Gate Risk Guardrails, 40% Rule และสูตรคำนวณ Lot'
        : 'Inspect deterministic 12-Gate Guardrails, 40% cap rules & sizing specs',
      groupLabel,
      badge: 'AI',
      iconKey: 'sparkles',
      keywords: 'ai advisor chat assistant risk guardrail ผู้ช่วย ถามตอบ',
    },
    {
      id: 'action-toggle-theme',
      kind: 'action',
      actionId: 'toggle-theme',
      title: isDark
        ? isTh
          ? 'สลับเป็นโหมดสว่าง (Light Mode)'
          : 'Switch to Light Mode'
        : isTh
        ? 'สลับเป็นโหมดมืด (Dark Mode)'
        : 'Switch to Dark Mode',
      description: isTh
        ? 'สลับระหว่างธีมสว่างและธีมมืด'
        : 'Switch between light and dark themes',
      groupLabel,
      badge: isDark ? (isTh ? 'สว่าง' : 'Light') : (isTh ? 'มืด' : 'Dark'),
      iconKey: 'sun',
      keywords: 'theme dark light mode appearance ธีม สว่าง มืด',
    },
    {
      id: 'action-toggle-lang',
      kind: 'action',
      actionId: 'toggle-lang',
      title: isTh ? 'Switch Language to English (EN)' : 'เปลี่ยนภาษาเป็นภาษาไทย (TH)',
      description: isTh
        ? 'สลับภาษาการแสดงผลทั้งเว็บไซต์ระหว่าง EN และ TH'
        : 'Toggle full bilingual interface between Thai and English',
      groupLabel,
      badge: isTh ? 'EN' : 'TH',
      iconKey: 'globe',
      keywords: 'language english thai th en translate ภาษา ไทย อังกฤษ',
    },
  ];

  return [...quickActions, ...routeItems];
}

export function filterCommandPaletteItems(
  items: CommandPaletteItem[],
  query: string
): CommandPaletteItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  const terms = normalized.split(/\s+/).filter(Boolean);
  const scored: { item: CommandPaletteItem; score: number; originalIdx: number }[] = [];

  items.forEach((item, originalIdx) => {
    const titleLower = item.title.toLowerCase();
    const badgeLower = item.badge.toLowerCase();
    const descLower = item.description.toLowerCase();
    const keywordsLower = item.keywords.toLowerCase();
    const groupLower = item.groupLabel.toLowerCase();

    const haystack = `${titleLower} ${descLower} ${badgeLower} ${groupLower} ${keywordsLower}`;
    if (!terms.every((term) => haystack.includes(term))) {
      return;
    }

    let score = 0;
    if (badgeLower === normalized || badgeLower === `/${normalized}` || titleLower === normalized) {
      score += 100;
    }
    terms.forEach((term) => {
      if (titleLower.startsWith(term) || badgeLower === `/${term}`) {
        score += 40;
      } else if (titleLower.includes(term) || badgeLower.includes(term)) {
        score += 20;
      } else if (keywordsLower.includes(term)) {
        score += 8;
      } else {
        score += 2;
      }
    });

    scored.push({ item, score, originalIdx });
  });

  scored.sort((a, b) => b.score - a.score || a.originalIdx - b.originalIdx);
  return scored.map((entry) => entry.item);
}
