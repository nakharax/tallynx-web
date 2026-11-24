# TallyNX Web — Open-Source Launch & Security Readiness Checklist

This checklist documents the pre-public security, privacy, and repository readiness audit for **TallyNX Web** (`nakharax/tallynx-web`) and the launch configuration for public open-source operations.

---

## 1. Pre-Public Security & Hygiene Status

### A. Public Source Tree Audit
- **Secrets & Private Keys:** **0 real secrets** in tracked files (`git ls-files`). `.env*`, `.vercel/`, `*.pem`, `*.key`, `*serviceAccount*`, `*.db`, `*.zip`, and CI receipt/manifest artifacts are ignored via `.gitignore`.
- **Infrastructure & Personal Data:** **0 hardcoded VPS IP addresses**, **0 tunnel/internal domains**, and **0 personal email addresses** anywhere in the public repository tree or commit history.
- **Safe Harbor & Brand Policy Gate:** `node scripts/ci-policy-guard.mjs` passes across `src/`, `api/`, `public/`, `server.ts`, and `index.html`.
- **Resolved Pre-Public Security & Metadata Fixes:**
  1. **[RESOLVED] SSO Signing Secret Fail-Closed Hardening (`server.ts` -> `getSsoSigningConfig`):**
     - Removed any deterministic fallback secret from source code.
     - Production (`isProduction`) now fails closed with HTTP `503` when `TALLYNX_SSO_SECRET` (or `SSO_SHARED_SECRET`) is unset or shorter than 16 characters.
     - Local development (`!isProduction`) lazily generates an ephemeral per-process 32-byte CSPRNG secret (`crypto.randomBytes(32).toString('hex')`).
  2. **[RESOLVED] App Metadata Brand Alignment (`metadata.json`):**
     - Updated `"name"` to `"TallyNX Trading OS"` and aligned `"description"` with `index.html` and `public/manifest.webmanifest`.

### B. Clean Public Repository History
- Published from a clean single-commit root snapshot authored by `TallyNX <opensource@tallynx.com>` on `nakharax/tallynx-web`, ensuring zero legacy commit metadata or deleted historical snapshots appear in public git history.

---

## 2. Environment Variables & Vercel Configuration

Required / Optional Environment Variables (documented in `.env.example`):
- `GEMINI_API_KEY` — Required for `POST /api/advisor` and `POST /api/chat` (configured in Vercel Production).
- `TALLYNX_SSO_SECRET` — **Required in production** (shared HMAC-SHA256 signing secret, >= 16 chars, 32+ random bytes recommended, synchronized with `mall.tallynx.com` / `desk.tallynx.com`). Add to Vercel Production and Preview before enabling live SSO handoff.
- `SSO_SHARED_SECRET` — Optional legacy alias for `TALLYNX_SSO_SECRET`.
- `VITE_TREDYN_MALL_URL` / `VITE_TREDYN_DESK_URL` — Optional client handoff URL overrides (default `https://mall.tallynx.com/`).
- `PORT`, `NODE_ENV`, `DISABLE_HMR` — Local runtime and Vite dev options.

---

## 3. Public Repository Governance & Release Checklist (`nakharax/tallynx-web`)

1. **Vercel Production Secrets:**
   - Ensure `GEMINI_API_KEY` and a 32+ byte `TALLYNX_SSO_SECRET` are configured in Vercel (`production` and `preview` environments) for the linked project.
2. **GitHub Actions Secrets (`nakharax/tallynx-web`):**
   - Set non-secret Vercel identifiers (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
   - Set **`VERCEL_TOKEN`** (Owner action — scoped Vercel token):
     ```bash
     gh secret set VERCEL_TOKEN --env production --repo nakharax/tallynx-web
     # Optional if non-fork PR previews should also deploy:
     gh secret set VERCEL_TOKEN --repo nakharax/tallynx-web
     ```
3. **Branch Protection & Security Alerts on `nakharax/tallynx-web`:**
   - Enable Dependabot vulnerability alerts (`vulnerability-alerts`) and automated security fixes (`automated-security-fixes`).
   - Protect `master` with required pull request reviews, strict required status checks (`CI Execution Gate`, `Secret Scan (Gitleaks)`, `Safe Harbor & Brand Guard`, `Typecheck, Tests & Build`, `sentinel-ci`), linear history, and disabled force-pushes/deletions.
4. **Post-Launch Smoke Check:**
   - Verify GitHub Actions CI (`deploy-vercel.yml`, `release.yml`) passes on `master` and `GET /api/health` returns `200 OK`.
