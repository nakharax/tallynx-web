# Feature Spec: [ชื่อฟีเจอร์]

> ใช้ไฟล์นี้เป็นต้นทางก่อนพิมพ์คำสั่ง `/plan` ใน Antigravity 2.0 เพื่อบังคับให้ Scope แคบและชัดตั้งแต่นาทีแรก

## 1. Problem & Goal
- **ปัญหาที่แก้:** [อธิบายใน 1-2 ประโยค]
- **เป้าหมาย / ตัววัดผลสำเร็จ:** [เช่น เพิ่มอัตรา Handoff จาก Sandbox ไป TallyNX Desk / ลด LCP < 1.5s]

## 2. Scope
- **In-Scope (ไม่เกิน 3 ข้อ):**
  1. [ฟีเจอร์หลักที่ต้องมี]
  2. [ฟีเจอร์ประกอบที่ขาดไม่ได้]
- **Out-of-Scope (ยังไม่ทำในรอบนี้):**
  - [ตัดสิ่งที่ไม่จำเป็นออกให้ชัด เพื่อกัน Agent คิดเผื่อเอง]

## 3. Data & Interface Changes
- **State / Handoff / SEO Metadata:** [มี URL Query/Payload ส่งต่อไป TallyNX Desk หรือการแก้ SSR Metadata/Sitemap ไหม]
- **API / UI Flow:** [จุดเริ่มต้น -> การทำงาน (`server.ts` / `api/index.ts` / `src/`) -> ผลลัพธ์ (รองรับ EN/TH และ Paper/Obsidian)]

## 4. Critical Path & Acceptance Criteria
- [ ] **Happy Path:** [เงื่อนไขที่ต้องทำงานได้สมบูรณ์ และผ่าน `npm test`]
- [ ] **Edge Case / Failure Mode:** [เมื่อ Input ผิด, ไม่มี API Key สำหรับ AI Advisor, หรือเข้าผ่าน Mobile Viewport ต้องจัดการอย่างไร]
- [ ] **Security / Safe Harbor / SEO:** [ตรวจสอบ Security Headers, Non-Custodial boundary และผ่าน `node scripts/ci-policy-guard.mjs`]
