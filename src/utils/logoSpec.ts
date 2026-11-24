import type { Language } from './i18n';

export type LogoVariant = 'lockup' | 'mark' | 'stacked';
export type LogoTheme = 'light' | 'dark' | 'mono';

export interface BrandColorToken {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  roleEn: string;
  roleTh: string;
}

export interface LogoPrinciple {
  code: string;
  titleEn: string;
  titleTh: string;
  descEn: string;
  descTh: string;
}

export interface LogoPalette {
  bg: string;
  primary: string;
  accent: string;
  descriptor: string;
  border: string;
  wordmark: string;
  subtitle: string;
}

export const BRAND_COLOR_TOKENS: BrandColorToken[] = [
  {
    id: 'crimson',
    name: 'TALLYNX Crimson',
    hex: '#7A1C24',
    rgb: '122, 28, 36',
    roleEn: 'Primary Roman Serif wordmark, tapered Datum Line & constrained "T" seal',
    roleTh: 'สีหลักของตัวอักษร TALLYNX, เส้น Datum Line และตราตัว "T" ขนาดเล็ก',
  },
  {
    id: 'charcoal',
    name: 'Logic Charcoal',
    hex: '#2B2D2F',
    rgb: '43, 45, 47',
    roleEn: 'Clean Sans-Serif TECHNOLOGIES descriptor & primary editorial body ink',
    roleTh: 'สีคำกำกับ TECHNOLOGIES และเนื้อหาเชิงเทคนิคบนพื้นสว่าง',
  },
  {
    id: 'cream',
    name: 'Archival Cream',
    hex: '#F8F6F0',
    rgb: '248, 246, 240',
    roleEn: 'Primary archival canvas, reversed wordmark ink & constrained mark surface',
    roleTh: 'พื้นหลังกระดาษสถาบัน, ตัวอักษรในโหมดมืด และพื้นหลังไอคอน',
  },
  {
    id: 'white',
    name: 'Pure Stark White',
    hex: '#FFFFFF',
    rgb: '255, 255, 255',
    roleEn: 'Digital clean surface, legal print ground & reversed Datum Line',
    roleTh: 'พื้นหลังสีขาวบริสุทธิ์ และเส้น Datum Line ในโหมดพื้นมืด',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Slate',
    hex: '#141618',
    rgb: '20, 22, 24',
    roleEn: 'Reversed dark canvas & 100% single-ink monochrome legal lockup',
    roleTh: 'พื้นหลังโหมดมืด และสีหมึกเดี่ยวสำหรับเอกสารทางกฎหมาย',
  },
  {
    id: 'datumGray',
    name: 'Datum Rule Gray',
    hex: '#D6D1C7',
    rgb: '214, 209, 199',
    roleEn: '1px structural grid rules, borders & quiet institutional hairlines',
    roleTh: 'เส้นกรอบโครงสร้างและเส้นคั่นบางระดับสถาบัน',
  },
];

export const LOGO_DESIGN_PRINCIPLES: LogoPrinciple[] = [
  {
    code: '01',
    titleEn: 'TALLY — Empirical Measurement',
    titleTh: 'TALLY — การวัดผลเชิงประจักษ์',
    descEn:
      'Rooted in rigorous empirical tallying: isolating true risk signals from market noise through verifiable read-only telemetry without guesswork.',
    descTh:
      'รากฐานจากการนับและตรวจวัดเชิงประจักษ์: แยกแยะสัญญาณความเสี่ยงที่แท้จริงออกจากความผันผวนด้วยข้อมูลอ่านอย่างเดียวที่ตรวจสอบย้อนหลังได้',
  },
  {
    code: '02',
    titleEn: 'LYNX / LINKS — Vision & Connectivity',
    titleTh: 'LYNX / LINKS — วิสัยทัศน์และการเชื่อมโยง',
    descEn:
      'Acute institutional clarity paired with deterministic connectivity across brokerage feeds, risk ledgers, and quantitative checkpoints.',
    descTh:
      'ความเฉียบคมในการมองเห็นข้อมูลและการเชื่อมโยงที่เที่ยงตรงระหว่างฟีดโบรกเกอร์ สมุดบันทึกความเสี่ยง และจุดตรวจวัดเชิงปริมาณ',
  },
  {
    code: '03',
    titleEn: 'X — The Mathematical Variable',
    titleTh: 'X — ตัวแปรทางคณิตศาสตร์',
    descEn:
      'Represents the unknown exposure variable solved by disciplined sizing formulas and non-custodial mathematical guardrails.',
    descTh:
      'แทนตัวแปรความเสี่ยงที่ถูกคำนวณและควบคุมอย่างมีแบบแผนด้วยสมการขนาดสถานะและกรอบวินัยเชิงคณิตศาสตร์',
  },
  {
    code: '04',
    titleEn: 'DATUM LINE — Baseline of Rigor',
    titleTh: 'DATUM LINE — เส้นฐานแห่งความเที่ยงตรง',
    descEn:
      'The tapered crimson horizontal datum rule anchors the Roman Serif wordmark—establishing an invariant baseline of quiet precision with zero decorative clutter.',
    descTh:
      'เส้นฐานปลายเรียวแหลมทำหน้าที่ตรึงคำว่า TALLYNX บนระนาบแห่งความเที่ยงตรง สะท้อนความสงบและแม่นยำโดยปราศจากสัญลักษณ์ฟุ่มเฟือย',
  },
];

export function getLogoPalette(theme: LogoTheme): LogoPalette {
  if (theme === 'dark') {
    return {
      bg: '#141618',
      primary: '#F8F6F0',
      accent: '#FFFFFF',
      descriptor: '#C4C0B8',
      border: '#2B2D2F',
      wordmark: '#F8F6F0',
      subtitle: '#C4C0B8',
    };
  }
  if (theme === 'mono') {
    return {
      bg: '#FFFFFF',
      primary: '#141618',
      accent: '#141618',
      descriptor: '#141618',
      border: '#D6D1C7',
      wordmark: '#141618',
      subtitle: '#141618',
    };
  }
  return {
    bg: '#F8F6F0',
    primary: '#7A1C24',
    accent: '#7A1C24',
    descriptor: '#2B2D2F',
    border: '#D6D1C7',
    wordmark: '#7A1C24',
    subtitle: '#2B2D2F',
  };
}

/**
 * Generates clean, self-contained standalone SVG markup strictly following
 * the TALLYNX TECHNOLOGIES Brand Identity v1.0 specification (Pure Roman Serif
 * Wordmark + Tapered Datum Line, zero gradients/shadows/extra icons).
 */
export function exportLogoSvg(variant: LogoVariant, theme: LogoTheme): string {
  const p = getLogoPalette(theme);

  if (variant === 'mark') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512" fill="none">
  <rect width="64" height="64" rx="10" fill="${p.bg}" stroke="${p.border}" stroke-width="1.5"/>
  <path d="M16 15 H48 L49 23 H46.5 C45.8 19.2 44.2 18 40.5 18 H35 V41 C35 43.8 36.2 44.6 39.5 44.6 V46.5 H24.5 V44.6 C27.8 44.6 29 43.8 29 41 V18 H23.5 C19.8 18 18.2 19.2 17.5 23 H15 L16 15 Z" fill="${p.primary}"/>
  <polygon points="14,52 32,50.8 50,52 32,53.2" fill="${p.accent}"/>
</svg>`;
  }

  if (variant === 'stacked') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="560" height="240" fill="none">
  <rect width="280" height="120" fill="${p.bg}"/>
  <text x="140" y="54" text-anchor="middle" font-family="Georgia, 'Times New Roman', Times, serif" font-size="28" font-weight="700" letter-spacing="4.2" fill="${p.wordmark}">TALLYNX</text>
  <polygon points="48,68 140,66.6 232,68 140,69.4" fill="${p.accent}"/>
  <text x="140" y="90" text-anchor="middle" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="10" font-weight="600" letter-spacing="5.5" fill="${p.descriptor}">TECHNOLOGIES</text>
</svg>`;
  }

  // Horizontal archival lockup
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 72" width="640" height="144" fill="none">
  <rect width="320" height="72" fill="${p.bg}"/>
  <text x="160" y="30" text-anchor="middle" font-family="Georgia, 'Times New Roman', Times, serif" font-size="24" font-weight="700" letter-spacing="4.2" fill="${p.wordmark}">TALLYNX</text>
  <polygon points="62,40 160,38.8 258,40 160,41.2" fill="${p.accent}"/>
  <text x="160" y="57" text-anchor="middle" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="9" font-weight="600" letter-spacing="5.5" fill="${p.descriptor}">TECHNOLOGIES</text>
</svg>`;
}

export function getLogoStudioCopy(lang: Language) {
  if (lang === 'th') {
    return {
      kicker: 'อัตลักษณ์แบรนด์อย่างเป็นทางการ · เวอร์ชัน 1.0',
      kickerSub: 'PURE ROMAN SERIF WORDMARK & DATUM LINE',
      title: 'TALLYNX TECHNOLOGIES — Quiet Precision & Institutional Rigor',
      subtitle: 'ระบบ Wordmark อักษร Roman Serif, เส้นฐาน Datum Line และตราตัว "T" ขนาดเล็ก',
      description:
        'ออกแบบตามแนวทาง Quiet Precision · Institutional Rigor ใช้ตัวพิมพ์ใหญ่ Roman Serif (TALLYNX) คู่กับคำกำกับ Sans-Serif เว้นช่องไฟกว้าง (TECHNOLOGIES) และเส้นฐาน Datum Line ปลายเรียวแหลม ปราศจากเงา เกรเดียนต์ หรือไอคอนประกอบเกินจำเป็น',
      showGrid: 'แสดงขอบเขต Clearspace (1.5X)',
      hideGrid: 'ซ่อนขอบเขต Clearspace',
      themeLight: 'Primary Archival (สว่าง)',
      themeDark: 'Reversed Dark (มืด)',
      themeMono: 'Monochrome (กฎหมาย/สิ่งพิมพ์)',
      variantLockup: 'Lockup หลัก',
      variantMark: 'ตราตัว "T" (< 48px)',
      variantStacked: 'แผ่นป้ายมาตรฐาน (Plate)',
      downloadSvg: 'ดาวน์โหลด SVG',
      downloadPng: 'ดาวน์โหลด PNG (1024px)',
      copySvg: 'คัดลอกโค้ด SVG',
      copiedSvg: 'คัดลอก SVG แล้ว',
      copySvgError: 'คัดลอก SVG ไม่สำเร็จ กรุณาใช้ปุ่มดาวน์โหลด SVG',
      scaleTestTitle: 'ทดสอบขนาดขั้นต่ำ (Digital 140px & Square Mark < 48px)',
      paletteTitle: 'ชุดสีสถาบัน 6 เฉด (Institutional Color Palette)',
      principlesTitle: 'หลักการความหมายและโครงสร้าง (Semantic Pillars)',
    };
  }
  return {
    kicker: 'OFFICIAL BRAND IDENTITY · VERSION 1.0',
    kickerSub: 'PURE ROMAN SERIF WORDMARK & DATUM LINE',
    title: 'TALLYNX TECHNOLOGIES — Quiet Precision & Institutional Rigor',
    subtitle: 'Pure Roman Serif Wordmark, Tapered Datum Line & Constrained Square Seal',
    description:
      'Engineered under Quiet Precision & Institutional Rigor: three inseparable typographic elements—Roman Serif TALLYNX, Tapered Datum Line, and wide-tracked Sans-Serif TECHNOLOGIES—rendered cleanly with zero gradients, drop shadows, or ornamental mascots.',
    showGrid: 'Show Clearspace Guides (1.5X)',
    hideGrid: 'Hide Clearspace Guides',
    themeLight: 'Primary Archival (Light)',
    themeDark: 'Reversed Dark',
    themeMono: 'Monochrome & Legal Print',
    variantLockup: 'Primary Lockup',
    variantMark: 'Square Mark (< 48px "T")',
    variantStacked: 'Archival Plate',
    downloadSvg: 'Download SVG',
    downloadPng: 'Download PNG (1024px)',
    copySvg: 'Copy SVG Markup',
    copiedSvg: 'Copied SVG',
    copySvgError: 'Couldn’t copy the markup. Use Download SVG to save the file.',
    scaleTestTitle: 'Minimum Width & Square Seal Scale Check',
    paletteTitle: 'Institutional Color Palette (6 Tokens)',
    principlesTitle: 'Semantic Pillars & Datum Line Rationale',
  };
}
