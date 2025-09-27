<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Contributing Guide (SwissJS)

This document defines the required checks and workflow for contributing to the SwissJS monorepo.

## Contributor License Agreement (CLA)

**IMPORTANT**: By submitting a pull request or contributing code to this repository, you agree to the following terms:

1. **Copyright Assignment**: You grant **Themba Mzumara** a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute your contributions and such derivative works.

2. **Attribution Requirements**: All contributions must include proper attribution and maintain existing copyright notices.

3. **Sign-off Requirement**: All commits must include a sign-off line:
   ```
   Signed-off-by: Your Name <your@email.com>
   ```
   This certifies that you have the right to submit the contribution under the project's license.

4. **Original Work**: You certify that your contribution is your original work or you have the necessary rights to submit it.

5. **License Compliance**: Your contribution will be licensed under the same MIT License as the project.

### How to Sign Off Commits
```bash
git commit -s -m "Your commit message"
```

Or add manually to your commit message:
```
Your commit message

Signed-off-by: Your Name <your@email.com>
```

## Branching and PRs

- Base all work off `develop`.
- Use feature branches named by purpose: `feature/<name>`, `fix/<name>`, `chore/<name>`.
- All PRs must target `develop` and pass required checks.

## Required Status Checks (develop)

The `develop` branch is protected. PRs must be green on these checks before merge:

- Build & Test:
  - `pnpm -w build`
  - `CI=1 pnpm -w test`
- Type Checking:
  - `pnpm -w type-check`
- Lint:
  - `pnpm -w lint`
- Policy Gates:
  - Barrel checks: `pnpm -w check:barrels`
  - Policy checks: `pnpm check:policy` (includes promotion filter)
  - UI format checks: `pnpm -w check:ui-format`
- Security:
  - CodeQL (existing)
  - SAST ESLint (`.github/workflows/sast-eslint.yml`)
  - Dependency Audit (`.github/workflows/deps-audit.yml`)
  - Secrets Scan with Gitleaks (`.github/workflows/gitleaks.yml`)
  - Semgrep (`.github/workflows/semgrep.yml`)
- Documentation:
  - Docs CI (`.github/workflows/docs.yml`) — env matrix (develop/staging/release), redaction enforced for staging/release

> Maintainers: Configure GitHub branch protection for `develop` to require the above workflows and disallow bypass/force push. Require at least 1–2 reviews.

## Commit Policy

- Commit messages must include a ticket code in brackets, e.g. `[SWS-CORE-101]`, `[SWS-RESET]`.
- Husky enforces commit message format and pre-push checks.

## Imports and Barrels

- Use `@swissjs/<package>` barrels. Deep imports into `@swissjs/*/src/*` are forbidden.
- Barrels (`src/index.ts`) must use explicit `.js` extensions in re-exports.
- No default exports in `src` files.

## Documentation

- All docs under `docs/`; API docs generated under `docs/api/`.
- Internal or dev-only notes must not leak to staging/release docs. The redactor checks run in CI for staging/release builds.

## Promotion Filter

- The promotion filter reports potential sensitive files during PRs.
- It is enforced automatically on staging/release refs and when `PROMOTION_ENFORCE=1` is set.

## Local Full Reset

```
pnpm reset
```

Runs install, lint, type-check, tests, build, policy checks, generates docs/api, and validates barrels and API reports.
