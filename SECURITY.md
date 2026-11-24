# Security Policy

TallyNX Web is engineered around a **strictly non-custodial, least-privilege security model**. We appreciate the security community's help in keeping our users and contributors safe.

---

## Supported Versions

| Version | Supported |
| :--- | :---: |
| `5.x` (current `master`) | Yes |
| `< 5.0` | No |

---

## Non-Custodial Threat Model

TallyNX Web is a Pure SaaS analytical portal and interactive risk sandbox:

1. **Zero Custody & Zero Order Execution**
   - TallyNX Web never holds user funds, never requests broker passwords, and never executes live trades.
   - Handoff links to TallyNX Desk carry only non-sensitive sandbox parameters (e.g., symbol, risk percentage, stop distance, language, theme).
2. **HTTP & SSR Edge Hardening**
   - Production responses enforce `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` via `vercel.json`.
   - Server-side API routes keep optional third-party keys (such as `GEMINI_API_KEY`) strictly server-side and never bundle secrets into client assets.
3. **CI/CD & Supply-Chain Hardening**
   - Every commit and PR is scanned with a SHA-256 checksum-verified Gitleaks binary (`secret-scan`).
   - External fork Pull Requests run CI strictly with `contents: read` and **zero access to deployment secrets**.
   - Production deployments are gated behind a fail-closed `sentinel-ci` receipt and `CODEOWNERS` review.

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please report them privately using one of the following channels:

1. **GitHub Private Vulnerability Reporting (Preferred):**  
   Navigate to the repository's **Security → Advisories → Report a vulnerability** page at:  
   `https://github.com/nakharax/tallynx-web/security/advisories/new`
2. **Direct Maintainer Contact:**  
   If you cannot use GitHub Security Advisories, contact the repository maintainers via the contact channel listed on `@nakharax`.

### What to Include
- Affected file(s), SSR route(s), or API endpoint(s)
- Clear step-by-step reproduction instructions or proof-of-concept payload
- Estimated security impact (e.g., XSS, SSRF, secret exposure, header bypass)
- Suggested remediation (optional)

### Response Timeline
- **Acknowledgement:** Within **48 hours**
- **Initial Triage & Severity Assessment:** Within **7 calendar days**
- **Remediation & Coordinated Disclosure:** We will coordinate a fix timeline and credit you in the release notes (unless you prefer to remain anonymous).

---

## Strictly Out-of-Scope Claims

The following categories are **out of scope** for security vulnerability reports:

- Trading losses, prop-firm evaluation failures, or user risk-sizing decisions
- Third-party broker or prop-firm platform outages and latency
- Findings requiring physical access to an unlocked user device or compromised local OS
- Self-XSS or social engineering / phishing attacks targeting users or maintainers
- Volumetric denial-of-service (DDoS) or brute-force attempts against managed infrastructure (Vercel, GitHub) without a concrete application-level bypass
- Reports generated purely by automated scanners without verified exploitability or impact
