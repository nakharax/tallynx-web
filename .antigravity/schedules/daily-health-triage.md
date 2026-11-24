---
name: Daily Health & Error Triage
cron: "0 8 * * *"
permission: Read-Only + Report
target_branch: master
---

# Daily Health & Error Triage (TallyNX Web)

ตรวจสอบ Error Log และสถานะระบบย้อนหลัง 24 ชั่วโมง (Read-Only ห้ามแก้โค้ดหรือรันคำสั่งบน Production):

1. ตรวจสอบสถานะ `/api/health`, Vercel Serverless SSR Logs (`api/index.ts`, `server.ts`), ความสมบูรณ์ของ `robots.txt` / `sitemap.xml`, และ Error จาก Desk Handoff / Risk Sandbox / AI Behavioral Advisor
2. จัดกลุ่ม Error ตาม Root Cause และเรียงตามความถี่/ผลกระทบ:
   - **P0:** กระทบหน้าแรก SSR, Desk Handoff (`desk.tallynx.com`), Risk Sandbox Calculation, หรือ 5xx Server Error
   - **P1:** ฟีเจอร์รอง (เช่น AI Behavioral Advisor, Metadata/OG tags, i18n/Theme toggle)
   - **P2:** Noise / Bot 404s / Transient Warnings
3. สำหรับ P0 และ P1 ให้ไล่หาไฟล์และบรรทัดที่น่าจะเป็นต้นเหตุ พร้อมร่างแผนการแก้ไขสั้น ๆ
4. ส่งสรุปเป็นตารางไม่เกิน 10 บรรทัด ถ้าไม่มี Error ระดับ P0/P1 ให้รายงานสั้น ๆ ว่า `"All Green"`
