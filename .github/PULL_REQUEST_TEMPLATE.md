## Summary

<!-- Briefly describe what this PR changes and why. -->

- **Related Issue:** Closes #

## Type of Change

<!-- PR title must follow Conventional Commits: feat|fix|perf|refactor|docs|test|chore|ci|build|style|revert -->

- [ ] `feat:` New feature (non-breaking)
- [ ] `fix:` Bug fix (non-breaking)
- [ ] `perf:` Performance / caching improvement
- [ ] `refactor:` Internal code refactor (no behavior change)
- [ ] `docs:` Documentation / governance update
- [ ] `test:` Unit test updates
- [ ] `chore:` / `ci:` / `build:` Tooling, dependencies, or workflow updates
- [ ] Breaking change (`!` in title + `BREAKING CHANGE:` note below)

## Testing Evidence

<!-- Confirm all mandatory local quality gates passed before pushing. -->

- [ ] `npm run lint` (`tsc --noEmit`) passed with 0 errors
- [ ] `npm test` (`tsx --test src/utils/*.test.ts`) passed
- [ ] `node scripts/ci-policy-guard.mjs` passed (Safe Harbor & brand hygiene)
- [ ] `npm run build` (`vite build && node scripts/prepare-ssr-shell.mjs`) passed

<details>
<summary>Command Output / Notes (optional)</summary>

```text
Paste relevant test output or verification notes here.
```

</details>

## Safe Harbor & Zero-Secrets Check

- [ ] Strictly **Non-Custodial**: does not request broker credentials, custody funds, or execute live trades.
- [ ] Strictly **Pure SaaS Analytics**: contains zero trade signals, buy/sell recommendations, or promises of trading outcomes.
- [ ] **Zero Secrets**: no API keys, tokens, `.env.local`, or private credentials included.

## Responsive & SSR / SEO Check

- [ ] Verified desktop (`1440px`), tablet (`768px`), and mobile (`390px`) layouts without horizontal overflow (or N/A — non-UI change).
- [ ] Preserved SSR metadata, `robots.txt`, `sitemap.xml`, and `vercel.json` cache/security headers.
