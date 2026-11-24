# Scheduled Tasks (Background Ops — TallyNX Web)

ชุด Scheduled Tasks มาตรฐานสำหรับรันในเบื้องหลังเพื่อทำหน้าที่แทนทีม Ops/QA โดยกำหนดสิทธิ์ชัดเจนว่างานไหนเป็น Read-Only และงานไหนเปิดเป็น Draft PR เพื่อให้ Founder รีวิวก่อนเสมอ

| Task Name | ความถี่ (Cron) | สิทธิ์ (Permission) | เป้าหมายหลัก | Prompt File |
|---|---|---|---|---|
| Daily Health & Error Triage | ทุกวัน 08:00 (`0 8 * * *`) | Read-Only + Report | คัดกรอง Error หนักในรอบ 24 ชม. ก่อนเริ่มงาน | [daily-health-triage.md](./daily-health-triage.md) |
| Weekly Security & Deps Audit | ทุกวันจันทร์ 09:00 (`0 9 * * 1`) | Draft PR (Patch only) | ตรวจช่องโหว่ (CVE), แพ็กเกจล้าสมัย และ Policy/Secret Drift | [weekly-security-deps-audit.md](./weekly-security-deps-audit.md) |
| Weekly Tech Debt & Test Gap | ทุกวันศุกร์ 17:00 (`0 17 * * 5`) | Read-Only + Report | เก็บกวาดโค้ดและหาจุดที่ขาด Test ในรอบสัปดาห์ | [weekly-tech-debt-test-gap.md](./weekly-tech-debt-test-gap.md) |
