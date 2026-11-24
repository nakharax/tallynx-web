export type Language = 'en' | 'th';

export function toggleLanguage(current: Language): Language {
  return current === 'en' ? 'th' : 'en';
}

export interface TranslationDictionary {
  langCode: Language;
  switchTooltip: string;
  nav: {
    openDesk: string;
    openMall: string;
  };
  hero: {
    headlineLine1: string;
    headlineAccent: string;
    subheadline: string;
    exploreCta: string;
    auditCta: string;
  };
  infrastructure: {
    kicker1: string;
    kicker2: string;
    title: string;
    subtitle: string;
    description: string;
    tabComparison: string;
    tabBridge: string;
    riskyTitle: string;
    riskyBadge: string;
    riskyBullets: string[];
    safeTitle: string;
    safeBadge: string;
    safeBullets: Array<{ bold: string; text: string }>;
  };
  workspace: {
    eyebrow: string;
    visitLink: string;
    titleLine1: string;
    titleAccent: string;
    subtitle: string;
    viewsLabel: string;
    playPreview: string;
    pausePreview: string;
    inspectZoom: string;
  };
  deskV32: {
    title: string;
    features: Array<{
      code: string;
      title: string;
      metricBadge: string;
      description: string;
      specFooter: string;
    }>;
  };
  ctaSection: {
    title: string;
    subtitle: string;
    sandboxCta: string;
  };
  footer: {
    rights: string;
    legalTitle: string;
    legalText: string;
  };
}

export const DICTIONARIES: Record<Language, TranslationDictionary> = {
  en: {
    langCode: 'en',
    switchTooltip: 'Switch language to Thai (ภาษาไทย)',
    nav: {
      openDesk: 'Launch TallyNX Desk',
      openMall: 'Launch TallyNX Mall',
    },
    hero: {
      headlineLine1: 'One daily DD breach',
      headlineAccent: 'can end your challenge',
      subheadline:
        'Check your lot size against the daily loss limit in 10s. Audit MT5 in 30s for trades placed within 15 minutes of a stop-loss and the 40% best-day threshold that can hold up a payout. No login.',
      exploreCta: 'Check Your Risk in 10s',
      auditCta: 'Audit MT5 Statement (30s)',
    },
    infrastructure: {
      kicker1: 'MT5 INFRASTRUCTURE',
      kicker2: 'NO CUSTODY OF FUNDS',
      title: 'Read-only connections to MetaTrader 5',
      subtitle: 'Read-only synchronization through local bridge, official Cloud API, or statement import.',
      description:
        'TallyNX only reads account data to monitor risk. Orders execute in your MT5 terminal only.',
      tabComparison: 'Structural Comparison',
      tabBridge: 'Direct MT5 Bridge Flow',
      riskyTitle: 'Typical Cloud Bots & Copy-Trade Services',
      riskyBadge: 'HIGH CUSTODIAL RISK',
      riskyBullets: [
        'Broker master passwords stored on remote servers vulnerable to leaks.',
        'Hidden automated execution can trigger unwanted liquidations.',
        'Shared IPs can breach a prop firm’s rules and put the account at risk.',
      ],
      safeTitle: 'TallyNX Non-Custodial Direct MT5 Link',
      safeBadge: '0 EXECUTION AUTHORITY',
      safeBullets: [
        {
          bold: 'Read-only access:',
          text: 'Sync via read-only Investor Password or .xlsx statement import.',
        },
        {
          bold: 'No order access:',
          text: 'No signals sold, no automatic trade modifications.',
        },
        {
          bold: 'Local order execution:',
          text: 'Orders originate exclusively from your own local IP address.',
        },
      ],
    },
    workspace: {
      eyebrow: 'WORKSPACE · TALLYNX TRADING OS v4.0',
      visitLink: 'Launch TallyNX Mall',
      titleLine1: 'Track drawdown',
      titleAccent: 'and plan position size',
      subtitle: 'Multi-TP Ladder Math, 40% Consistency Rule, AI Risk Coach Guardrails, and Read-Only MT5 Sync.',
      viewsLabel: 'WORKSPACE VIEWS',
      playPreview: 'Play preview',
      pausePreview: 'Pause preview',
      inspectZoom: 'Inspect Zoom',
    },
    deskV32: {
      title: '5 Core Engines of the TallyNX Trading OS',
      features: [
        {
          code: '01. Ladder Math',
          title: 'Multi-TP Ladder Calculator & Risk Sizer',
          metricBadge: '5-State Math',
          description:
            'Computes exact entry sizing, stop-loss risk, and multi-target profit splits (3-TP & 4-TP ladders) with deterministic 5-State transition math before placing any order.',
          specFooter: 'Entry · SL · TP1–TP4 Split · Breakeven Shift',
        },
        {
          code: '02. Prop Compliance',
          title: 'Consistency Rule 40% & Prop/Personal Switcher',
          metricBadge: '40% Cap Audit',
          description:
            'Switch between Prop Evaluation and Personal modes. Check the 40% best-day consistency cap and review 7-day or monthly P&L.',
          specFooter: 'Prop / Personal Mode · 7-Day & Monthly Calendar',
        },
        {
          code: '03. AI Guardrails',
          title: 'Behavioral AI Coach Guardrail & Live Desk',
          metricBadge: '15m SL Cooldown',
          description:
            'Mandatory 12-Gate pre-trade discipline checklist that fails closed on over-lot or tilt patterns, paired with an automatic 15-minute cooldown lock after any Stop-Loss hit.',
          specFooter: '12 Pre-Trade Gates · 15-Min Anti-Tilt Lockout',
        },
        {
          code: '04. Zero-Custody Sync',
          title: 'MT5 Read-Only Auto-Sync & Chart Snapshots',
          metricBadge: '100% Read-Only',
          description:
            'Synchronize live deals and chart snapshots using our outbound Live Bridge (.ex5), Official Cloud APIs (FundedNext MCP / Myfxbook / ProjectX), or import broker statements via .xlsx.',
          specFooter: 'Live Bridge (.ex5) · Cloud API · .xlsx Parser',
        },
        {
          code: '05. Cloud & SSO',
          title: 'Offline-First PWA + Real-Time Streams & Cross-Subdomain SSO',
          metricBadge: 'tallynx.com ↔ mall',
          description:
            'Installable offline-first PWA with encrypted real-time cloud streams, cross-subdomain SSO (tallynx.com ↔ mall.tallynx.com), and the 3-model AI Risk Coach.',
          specFooter: 'Offline PWA · Cross-Subdomain SSO · 3-Model AI Coach',
        },
      ],
    },
    ctaSection: {
      title: 'Take your risk settings into TallyNX Desk',
      subtitle: 'Carry your lot-sizing inputs into Desk or rehearse a drawdown and cooldown scenario in the Sandbox.',
      sandboxCta: 'Try Live Sandbox',
    },
    footer: {
      rights: '© 2026 TALLYNX TECHNOLOGIES. All rights reserved.',
      legalTitle: 'Legal Safe Harbor',
      legalText:
        'TallyNX provides read-only risk analysis and tools for reviewing trade setups. It does not operate as a broker or proprietary trading firm, hold funds, provide investment advice or signals, or copy trades. Orders execute in your local MT5 terminal.',
    },
  },
  th: {
    langCode: 'th',
    switchTooltip: 'สลับภาษาเป็นภาษาอังกฤษ (Switch to English)',
    nav: {
      openDesk: 'เปิดโต๊ะเทรด TallyNX Desk',
      openMall: 'เปิด TallyNX Mall',
    },
    hero: {
      headlineLine1: 'ชนเพดานขาดทุนรายวัน',
      headlineAccent: 'ครั้งเดียวก็อาจจบชาเลนจ์',
      subheadline:
        'เช็ก Lot เทียบเพดานขาดทุนรายวันใน 10 วิ แล้ววิเคราะห์ประวัติ MT5 ใน 30 วิ เพื่อหาไม้แก้มือภายใน 15 นาทีหลังชน SL และเช็กเกณฑ์กำไรวันสูงสุด 40% ที่อาจทำให้การจ่ายเงินถูกระงับ ไม่ต้องล็อกอิน',
      exploreCta: 'เช็กความเสี่ยงพอร์ตฟรี (10 วิ)',
      auditCta: 'ผ่า Statement 30 วิ',
    },
    infrastructure: {
      kicker1: 'การเชื่อมต่อ MT5',
      kicker2: 'ไม่ถือเงินของเทรดเดอร์',
      title: 'เชื่อมต่อ MetaTrader 5 แบบอ่านอย่างเดียว',
      subtitle: 'ซิงก์ข้อมูลแบบอ่านอย่างเดียวผ่าน Local Bridge, Cloud API หรือไฟล์รายงานจากโบรกเกอร์',
      description:
        'TallyNX อ่านข้อมูลผ่าน Live Bridge (.ex5), Cloud API ทางการ หรือไฟล์ .xlsx เท่านั้น คุณตัดสินใจเองและส่งคำสั่งซื้อขายผ่าน MT5 เท่านั้น',
      tabComparison: 'เปรียบเทียบโครงสร้างความปลอดภัย',
      tabBridge: 'การทำงานของ Direct MT5 Bridge',
      riskyTitle: 'บอทคลาวด์และบริการ Copy-Trade ทั่วไป',
      riskyBadge: 'ความเสี่ยงสูงต่อพอร์ต',
      riskyBullets: [
        'เก็บรหัสผ่าน Master Password ไว้บนเซิร์ฟเวอร์ภายนอก เสี่ยงต่อการรั่วไหล',
        'มีการแทรกแซงเปิด/ปิดออเดอร์อัตโนมัติ อาจทำให้พอร์ตเสียหายโดยไม่ตั้งใจ',
        'การใช้ IP ร่วมกันอาจผิดกฎของ Prop Firm และทำให้เสียบัญชีได้',
      ],
      safeTitle: 'การเชื่อมต่อ MT5 แบบไร้ตัวกลางของ TallyNX',
      safeBadge: 'ไม่แทรกแซงออเดอร์ (0 AUTHORITY)',
      safeBullets: [
        {
          bold: 'ช่องทางอ่านข้อมูล:',
          text: 'รองรับ Live Bridge (.ex5) บนเครื่อง/Private VPS, Cloud API ทางการ (FundedNext MCP / Myfxbook / ProjectX) และไฟล์ .xlsx',
        },
        {
          bold: 'ไม่แทรกแซงการเทรด:',
          text: 'ไม่ขายซิกแนล และไม่มีการแก้ไขออเดอร์อัตโนมัติ',
        },
        {
          bold: 'ส่งคำสั่งจากเครื่องของคุณ:',
          text: 'คำสั่งซื้อขายออกจาก IP เครื่องของคุณเท่านั้น',
        },
      ],
    },
    workspace: {
      eyebrow: 'โต๊ะเทรด · TALLYNX TRADING OS v4.0',
      visitLink: 'เปิด TallyNX Mall',
      titleLine1: 'ติดตาม Drawdown',
      titleAccent: 'และวางแผนขนาดสถานะ',
      subtitle: 'คำนวณขนาดสถานะแบบ Multi-TP เช็กกฎ Consistency 40% ดูคำเตือนจากโค้ช AI และซิงก์ MT5 แบบอ่านอย่างเดียว',
      viewsLabel: 'มุมมองการใช้งาน',
      playPreview: 'เล่นอัตโนมัติ',
      pausePreview: 'หยุดชั่วคราว',
      inspectZoom: 'ขยายภาพเต็ม',
    },
    deskV32: {
      title: '5 ฟีเจอร์หลักของ TallyNX Trading OS',
      features: [
        {
          code: '01. Ladder Math',
          title: 'Multi-TP Ladder Calculator & Risk Sizer',
          metricBadge: '5-State Math',
          description:
            'คำนวณจุดเข้า ระยะ Stop Loss และการแบ่งไม้ทำกำไร 3-TP และ 4-TP ด้วยสมการ 5-State Math อย่างแม่นยำก่อนส่งคำสั่งจริงใน MT5',
          specFooter: 'คำนวณจุดเข้า · แบ่งเป้ากำไร TP1–TP4 · จุดเลื่อนหน้าทุน',
        },
        {
          code: '02. Prop Compliance',
          title: 'Consistency Rule 40% & Prop/Personal Switcher',
          metricBadge: 'เช็กกฎ 40%',
          description:
            'สลับโหมดพอร์ตสอบกองทุน (Prop) และพอร์ตส่วนตัว (Personal) ได้ทันที พร้อมตรวจสอบกฎกำไรรายวันไม่เกิน 40% และปฏิทินสรุปผล 7 วัน/รายเดือน',
          specFooter: 'สลับโหมด Prop/Personal · ปฏิทินกำไรขาดทุน 7 วัน & รายเดือน',
        },
        {
          code: '03. AI Guardrails',
          title: 'Behavioral AI Coach Guardrail & Live Desk',
          metricBadge: 'Cooldown 15 นาที',
          description:
            'ด่านตรวจวินัย 12 ข้อแบบ Fail-Closed พร้อมโค้ช AI ตรวจจับพฤติกรรมเสี่ยงและล็อกพักเทรด Cooldown 15 นาทีอัตโนมัติหลังชน SL',
          specFooter: 'ด่านตรวจวินัย 12 ข้อ · ล็อกพักใจ 15 นาทีหลังชน SL',
        },
        {
          code: '04. Zero-Custody Sync',
          title: 'MT5 Read-Only Auto-Sync & Chart Snapshots',
          metricBadge: 'อ่านอย่างเดียว 100%',
          description:
            'ซิงก์รายการเทรดและภาพกราฟอัตโนมัติผ่าน Live Bridge (.ex5), Cloud API ทางการ (FundedNext MCP / Myfxbook / ProjectX) หรือนำเข้าประวัติการเทรดจากไฟล์ .xlsx ได้ทันที',
          specFooter: 'Live Bridge (.ex5) · Cloud API · ไฟล์ .xlsx',
        },
        {
          code: '05. Cloud & SSO',
          title: 'Offline-First PWA + Real-Time Streams & Cross-Subdomain SSO',
          metricBadge: 'tallynx.com ↔ mall',
          description:
            'ติดตั้งแบบ Offline-First PWA พร้อมสตรีมข้อมูลเรียลไทม์ ระบบ Cross-Subdomain SSO (tallynx.com ↔ mall.tallynx.com) และโค้ช AI 3 โมเดล',
          specFooter: 'Offline PWA · Cross-Subdomain SSO · โค้ช AI 3 โมเดล',
        },
      ],
    },
    ctaSection: {
      title: 'นำค่าความเสี่ยงที่ตั้งไว้ไปใช้ใน TallyNX Desk',
      subtitle: 'ส่งค่าคำนวณขนาด Lot ไปที่โต๊ะเทรด หรือลองจำลอง Drawdown และช่วงพักเทรดใน Sandbox',
      sandboxCta: 'ทดลอง Live Sandbox',
    },
    footer: {
      rights: '© 2026 TALLYNX TECHNOLOGIES สงวนลิขสิทธิ์',
      legalTitle: 'ข้อกำหนดและขอบเขตการใช้งาน',
      legalText:
        'TallyNX เป็นซอฟต์แวร์วิเคราะห์ความเสี่ยงแบบอ่านอย่างเดียวและช่วยทบทวนแผนเทรด ไม่ใช่นายหน้าหรือบริษัทเทรดกองทุน ไม่ถือเงิน ไม่ให้คำแนะนำการลงทุนหรือสัญญาณเทรด และไม่คัดลอกออเดอร์ คำสั่งซื้อขายดำเนินการใน MT5 บนเครื่องของคุณ',
    },
  },
};

export function getDictionary(lang: Language): TranslationDictionary {
  return DICTIONARIES[lang] || DICTIONARIES.en;
}
