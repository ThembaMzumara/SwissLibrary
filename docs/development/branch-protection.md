<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Branch Protection Policy

This repository requires protected development branches to ensure code quality and policy compliance.

## Protected Branches

- `develop` (default)
- Mirror these rules to `main` if used for releases.

## Required Pull Request Flow

- Require a pull request before merging.
- Require at least 1 approval.
- Require review from CODEOWNERS.
- Dismiss stale approvals when new commits are pushed.
- Require all conversations to be resolved before merging.

## Status Checks (Must Pass)

Select these checks under “Require status checks to pass before merging”:

- `policy-checks` (deep import ban, public barrel checks, artifact/tsconfig checks as configured in CI)
- `test` (workspace tests)
- Optionally: `build`, `docs` if you want these to gate merges as well.
- Require branches to be up to date before merging.

## Additional Protections

- Do not allow force pushes.
- Do not allow deletions.
- Require linear history (recommended).
- Include administrators (recommended).
- Do not allow bypassing the above settings (recommended).

## Local Developer Flow (Enforced Locally & CI)

- Use the preferred flow:
  1. Make changes
  2. Adjust documentation
  3. Commit
  4. Run `pnpm reset`
  5. Commit generated files
  6. Push
- Local guard rails:
  - `pnpm reset` runs policy checks early (`check:policy`), then tests, build, artifact checks, and docs.
  - `prepush:checks` runs lint, type-check, barrel and policy checks, then tests.

## Rationale

- Avoids deep imports and wildcard exports from public barrels to maintain a stable public API.
- Ensures no stray artifacts under `src/` and correct TypeScript `outDir`.
- Guarantees reviews by CODEOWNERS for sensitive surfaces (public barrels, CI/policy scripts, policy docs).
