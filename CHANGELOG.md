# Changelog

All notable changes to **TallyNX Web** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Industry-standard Open-Source Governance suite (`LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`).
- GitHub automation and contribution templates: `CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md`, structured YAML Issue Forms, and throttled grouped `dependabot.yml`.
- Conventional Commit PR title validation and sensitive-path / diff-size guardrails (`.github/workflows/pr-hygiene.yml`).
- Automated Semantic Release workflow (`.github/workflows/release.yml`) with categorized release notes and build checksum metadata.

### Security
- Scoped Vercel deployment secrets strictly to trusted `deploy-preview` and `deploy-production` jobs in `.github/workflows/deploy-vercel.yml`, keeping all external fork PR CI gates strictly read-only with zero secret exposure.
- Added `.git` metadata isolation during prebuilt Vercel CLI uploads so external open-source contributor commits deploy cleanly under the maintainer's `VERCEL_TOKEN`.
- Added `ignoreCommand` in `vercel.json` to skip redundant Vercel preview builds on `dependabot/*` branches.

---

## [5.0.0] - 2026-11-24

### Added
- **TallyNX Web Open-Source Baseline:** Public portal, interactive risk sandbox, and SSR/SEO edge shell for TallyNX.
- **SSR & Edge Caching:** Express + Vercel serverless shell (`api/index.ts`, `api/ssr-shell.html`) with localized metadata, `robots.txt`, `sitemap.xml`, and security headers.
- **Stateless Desk Handoff:** Seamless parameter handoff into TallyNX Desk (`desk.tallynx.com`) without custodial credentials.
- **Fail-Closed Sentinel CI:** Deterministic verification pipeline covering Gitleaks secret scanning, Safe Harbor & brand policy auditing, TypeScript type-checking, unit tests, production build, and live `/api/health` checks.

[Unreleased]: https://github.com/nakharax/tallynx-web/compare/v5.0.0...HEAD
[5.0.0]: https://github.com/nakharax/tallynx-web/releases/tag/v5.0.0
