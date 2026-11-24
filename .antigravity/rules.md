# Project Rules & Engineering Standards (TallyNX Web)

## 1. Operating Mode (Solo Founder Lean SDLC)
- **Plan Before Build:** สำหรับงานที่กระทบมากกว่า 2 ไฟล์ หรือเปลี่ยน SSR Routing / API Contract / Desk Handoff Schema ต้องสร้าง Implementation Plan ให้ Approve ก่อนลงมือแก้โค้ดทุกครั้ง
- **Keep It Simple:** เลือกทางออกที่เรียบง่ายและดูแลต่อได้คนเดียว ห้ามทำ Over-engineering, ห้ามเพิ่ม Abstraction Layer หรือ Microservice โดยไม่จำเป็น
- **Vertical Slice:** สร้างฟีเจอร์ให้จบครบวงจรทีละชิ้น (Logic -> SSR/API -> UI -> Critical Test) แทนการสร้างโครงสร้างเผื่ออนาคตที่ยังไม่ได้ใช้

## 2. Tech Stack & Conventions
- **Stack:** React 19 + TypeScript 7 + Vite 8 + Tailwind CSS 4 (SPA + SSR/SEO Edge Shell), Express + `tsx` (`server.ts`), Vercel Serverless SSR (`api/index.ts` + generated `api/ssr-shell.html` ผ่าน `scripts/prepare-ssr-shell.mjs`), Recharts + Motion, Gemini AI behavioral helper (`@google/genai`), และ Bilingual EN/TH UX
- **Architecture:** Modular Monolith — แยก Pure Business Logic, Risk Sandbox Calculations, SEO, และ i18n ไว้ใน `src/utils/` แยกออกจาก UI Components ใน `src/components/`, Custom Hooks ใน `src/hooks/` และ SSR/API Route Handler ใน `server.ts` / `api/index.ts`
- **Code Style:**
  - ใช้ Strict Typing ห้ามใช้ `any` หรือปิด Type/Lint rule เพื่อให้บิลด์ผ่าน
  - แยก Environment Config ไว้ที่ไฟล์ `.env.example` เสมอเมื่อเพิ่มตัวแปรใหม่ (ระวังไม่เผลอ commit secret หรือไฟล์ `.env.local`)
  - เขียน Comment เฉพาะจุดที่เป็น Business Logic ซับซ้อนหรือ SEO/SSR Contract (อธิบาย "ทำไม" ไม่ใช่ "ทำอะไร")
  - รักษาความสอดคล้องของ Bilingual EN/TH (`src/utils/i18n.ts`) และ High-Contrast Paper & Obsidian themes

## 3. Hard Constraints (ห้ามทำเด็ดขาด)
- ห้ามอ่าน แก้ไข หรือพิมพ์ค่าจริงจากไฟล์ `.env`, `.env.*` (ยกเว้น `.env.example`), `*.key`, `*.pem`, `*serviceAccount*` หรือไฟล์ Credentials ลงใน Log/Chat
- ห้ามแก้ Production Config, SSR Rewrites/Cache Headers (`vercel.json`) หรือ Deploy ขึ้น Production (`vercel --prod`) โดยไม่ได้รับการอนุมัติ
- ห้ามละเมิด **Non-Custodial & Legal Safe Harbor Policy** (ห้ามใส่คำรับรองผลตอบแทนหรือการผ่านสอบกองทุน, ห้ามให้คำแนะนำการลงทุนหรือสัญญาณซื้อขาย) และห้ามนำชื่อแบรนด์เก่ากลับมาใช้ (ตรวจผ่าน `node scripts/ci-policy-guard.mjs`)
- ห้ามลบหรือ Skip เทสต์เดิมใน `src/utils/*.test.ts` เพื่อให้ CI/Test ผ่าน ต้องแก้ที่ต้นเหตุหรือรายงานก่อน
- ห้ามลง Dependency/Package ใหม่โดยไม่อธิบายเหตุผลและเปรียบเทียบกับการใช้ของเดิมที่มีอยู่แล้ว

## 4. Verification Gate (เงื่อนไขก่อนปิดงาน)
ก่อนรายงานว่างานเสร็จ Agent ต้องตรวจสอบครบทุกข้อ (ตรงกับ Sentinel CI):
1. รัน Static Typecheck (`npm run lint`) ผ่านโดยไม่มี Error
2. รัน Automated Unit Tests ในส่วน Critical Path (`npm test`) ผ่านทั้งหมด
3. รัน Policy Guard (`node scripts/ci-policy-guard.mjs`) ผ่านโดยไม่มี Violation
4. รัน Production Build & SSR Shell (`npm run build`) ผ่านโดยไม่มี Error
5. หากมีการแก้ UI หรือ SEO/SSR ให้ตรวจสอบหน้าจอจริงผ่าน `/browser` (ทั้ง EN/TH และ Paper/Obsidian theme) พร้อมแนบ Screenshot ยืนยัน
6. สรุปรายการไฟล์ที่แก้, ผลเทสต์ และความเสี่ยง/จุดที่ต้องเช็กเพิ่ม (ไม่เกิน 5 บรรทัด)

## 5. Git & Worktree Hygiene
- Default branch ของโปรเจกต์คือ `master`
- แยก Branch/Worktree ตามประเภทงาน: `feat/<name>`, `fix/<name>`, `perf/<name>`, `docs/<name>`, `chore/<name>`
- ทำ Commit ย่อยและตั้งชื่อ PR ตาม Conventional Commits (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`, `build:`, `style:`, `revert:`) เพื่อให้ผ่าน `pr-hygiene` CI
- ห้าม Force Push หรือแก้ประวัติ Commit บน `master`
