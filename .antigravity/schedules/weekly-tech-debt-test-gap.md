---
name: Weekly Tech Debt & Test Gap
cron: "0 17 * * 5"
permission: Read-Only + Report
target_branch: master
---

# Weekly Tech Debt & Test Gap (TallyNX Web)

สแกน Commit ที่ Merge เข้า `master` ในรอบ 7 วันที่ผ่านมา (Read-Only):

1. หาไฟล์ Core Business Logic (`src/utils/`, `server.ts`, `api/index.ts`) ที่ถูกแก้แต่ยังไม่มี Automated Test ใน `src/utils/*.test.ts` ครอบคลุม
2. รวบรวมคอมเมนต์ `TODO` / `FIXME` ใหม่ที่ถูกเพิ่มเข้ามาและยังค้างอยู่
3. ระบุโค้ดที่ซ้ำซ้อนหรือไฟล์ที่เริ่มใหญ่เกินไปจนเสี่ยงดูแลยาก (เช่น การพอกพูนของ `src/App.tsx` หรือ `server.ts`) รวมถึงจุดที่ EN/TH copy อาจไม่ตรงกัน
4. สรุป Top 3 งาน Refactor/Test ที่คุ้มค่าที่สุดสำหรับสัปดาห์หน้า (เรียงตามความเสี่ยงและผลกระทบต่อ Conversion / SEO / Desk Handoff)
