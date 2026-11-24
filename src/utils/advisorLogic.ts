import type { Language } from './i18n';

export interface AdvisorInlineSegment {
  text: string;
  bold: boolean;
}

export type AdvisorContentBlock =
  | { type: 'paragraph'; segments: AdvisorInlineSegment[] }
  | { type: 'bullet'; segments: AdvisorInlineSegment[] };

export interface AdvisorCopy {
  launcherLabel: string;
  launcherAria: string;
  headerTitle: string;
  headerSubtitle: string;
  runtimeBadgeLeft: string;
  runtimeBadgeRight: string;
  assistantLabel: string;
  suggestedTitle: string;
  inputPlaceholder: string;
  footerNote: string;
  resetAria: string;
  closeAria: string;
  sendAria: string;
  thinkingText: string;
  greeting: string;
  suggestions: string[];
}

/**
 * Splits text containing **bold** markers into clean structured segments without raw asterisks.
 */
export function parseInlineBold(text: string): AdvisorInlineSegment[] {
  const segments: AdvisorInlineSegment[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text, bold: false }];
}

/**
 * Parses advisor markdown-lite replies into clean paragraph and bullet blocks.
 */
export function parseAdvisorBlocks(content: string): AdvisorContentBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: AdvisorContentBlock[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (/^[-*•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*•]\s+/, '');
      blocks.push({
        type: 'bullet',
        segments: parseInlineBold(itemText),
      });
    } else {
      blocks.push({
        type: 'paragraph',
        segments: parseInlineBold(trimmed),
      });
    }
  }

  return blocks;
}

const ADVISOR_COPY: Record<Language, AdvisorCopy> = {
  en: {
    launcherLabel: 'Ask TallyNX Advisor',
    launcherAria: 'Open TallyNX AI Advisor',
    headerTitle: 'TallyNX Advisor',
    headerSubtitle: 'Real-Time Trading OS & Risk Coach Guide',
    runtimeBadgeLeft: 'Non-Custodial',
    runtimeBadgeRight: 'Orders stay in MT5',
    assistantLabel: 'TallyNX Advisor',
    suggestedTitle: 'Quick questions',
    inputPlaceholder: 'Ask about TallyNX OS v4.0, Sandbox, or Marketplace...',
    footerNote: 'Read-only guidance · Orders stay in MT5',
    resetAria: 'Reset conversation',
    closeAria: 'Close TallyNX Advisor',
    sendAria: 'Send message',
    thinkingText: 'Thinking...',
    greeting:
      'Hi — ask me anything about **TallyNX OS v4.0**, the **Live Sandbox**, **MT5 read-only sync**, or how the **TallyNX Marketplace** verifies real trader data.',
    suggestions: [
      'How can I rehearse a 15-minute cooldown?',
      'How do I safely connect MT5 to Desk?',
      'What can I check in the MT5 statement audit?',
    ],
  },
  th: {
    launcherLabel: 'ถาม TallyNX Advisor',
    launcherAria: 'เปิดผู้ช่วย TallyNX AI Advisor',
    headerTitle: 'TallyNX Advisor',
    headerSubtitle: 'ผู้ช่วยระบบ TallyNX OS v4.0 และ AI Risk Coach',
    runtimeBadgeLeft: 'ไร้ตัวกลาง',
    runtimeBadgeRight: 'คำสั่งอยู่ใน MT5',
    assistantLabel: 'TallyNX Advisor',
    suggestedTitle: 'คำถามแนะนำ',
    inputPlaceholder: 'ถามเกี่ยวกับ TallyNX OS v4.0, Sandbox หรือ Marketplace...',
    footerNote: 'คำแนะนำเท่านั้น · คำสั่งเทรดอยู่ใน MT5',
    resetAria: 'เริ่มบทสนทนาใหม่',
    closeAria: 'ปิดหน้าต่าง TallyNX Advisor',
    sendAria: 'ส่งข้อความ',
    thinkingText: 'กำลังประมวลผล...',
    greeting:
      'สวัสดีครับ สอบถามเรื่อง **TallyNX Trading OS v4.0**, **Live Sandbox**, **การซิงก์ MT5 แบบอ่านอย่างเดียว** หรือวิธีที่ **TallyNX Marketplace** ยืนยันผลงานจริงได้เลย',
    suggestions: [
      'ทดลองช่วงพักเทรด 15 นาทีได้อย่างไร?',
      'เชื่อม MT5 เข้ากับโต๊ะเทรดอย่างปลอดภัยได้อย่างไร?',
      'ตรวจอะไรได้บ้างจากรายงานการเทรด MT5?',
    ],
  },
};

export function getAdvisorCopy(lang: Language): AdvisorCopy {
  return ADVISOR_COPY[lang] || ADVISOR_COPY.en;
}
