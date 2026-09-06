<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Development Workflow (Authoritative)

This document describes exactly how we develop in this repo across branches, commits, CI gates, docs, and releases. It consolidates rules from `docs/development/*`, `docs_old/development/*`, `docs/PHASE6_PLAN.md`, and root scripts in `package.json`.

- See also:
  - `docs/development/plan.md` (phase plans and standards)
  - `docs/development/conventions.md` (ESM + barrels + API discipline)
  - `docs/development/release-process.md`
  - `docs/PHASE6_PLAN.md` (Phase 6 scope and acceptance)
  - `docs/DEVELOPER_QUICKSTART.md` (cross‑platform setup)

---

## Prerequisites

- Node.js 18.19.x (use `.nvmrc`)
- pnpm 10.x
- Git 2.35+
- Optional: VS Code + SwissJS extension for `.ui`

Cross‑platform specifics are documented in `docs/DEVELOPER_QUICKSTART.md`.

---

## Branch Strategy

Long‑lived branches:

- `main`: production releases
- `release`: release preparation
- `staging`: pre‑production testing
- `develop`: feature integration

Working branches:

- `feature/<ticket-or-name>` off `develop`
- `hotfix/<desc>` off `main` for critical fixes

Merge flow:

- `develop → staging → release → main`
- `main → develop` (propagate hotfixes)

Branch protection: see `docs/development/branch-protection.md`.

---

## Commit and PR Conventions

- Commit message format: `[TICKET_ID] Brief, imperative summary`
- PR title: `[TICKET_ID] Descriptive title`
- Link PR to tracking ticket; keep PRs small and scoped (see `docs/PHASE6_PLAN.md` breakdowns)
- Reviews: ≥1 for `develop`, ≥2 for `staging`/`main`

Use Changesets for versioning when publishing packages (see below).

---

## Daily Development Loop

1. Update base and branch off

```bash
nvm use
pnpm install

git checkout develop
git pull origin develop

git checkout -b feature/<ticket-or-name>
```

1. Run the workspace

```bash
pnpm dev
```

1. Code, lint, types, tests

```bash
pnpm -w lint
pnpm -w type-check
pnpm -w test        # or: pnpm test:watch
```

1. Policy and docs checks

```bash
pnpm -w check:barrels
pnpm check:policy
pnpm -w check:ui-format

pnpm docs:api && pnpm docs:api:index
pnpm docs:build   # or: pnpm docs:dev for local preview
```

1. Commit and push

```bash
git commit -am "[TICKET_ID] concise summary"
git push -u origin feature/<ticket-or-name>
```

1. Open PR → target `develop`. Ensure all CI gates pass.

---

## The Reset Pipeline (All‑in‑One Validation)

Use the curated pipeline before a PR or when you need a clean slate. It performs a deep clean, reinstall, checks, build, tests, and docs.

```bash
pnpm reset
```

What it runs (summarized from root `package.json`):

- Clean workspaces and node_modules
- Install dependencies (frozen lockfile)
- Lint, type‑check
- TS config and src artifact checks
- Policy checks: barrels, public barrels, deep imports, UI format
- Test (CI=1)
- Build all packages
- Docs: clean generated, generate API, index, build
- Markdown lint, TSDoc coverage

If `pnpm reset` fails locally, fix issues before opening a PR.

---

## Changesets and Publishing

Use Changesets for package versioning and release notes.

Typical flow (per logical change set):

```bash
pnpm changeset            # select packages, choose bump, write summary
pnpm release:version      # apply versions + update changelogs
pnpm release:publish      # publish to registry (as configured)
```

Notes:

- Independent SemVer per package (`packages/*` and `packages/plugins/*`)
- Public API baselines must match (see `pnpm api:build` / `pnpm api:check`)
- Only publish from the release process or approved CI job

---

## CI Gates (Must Pass)

- Lint (`pnpm -w lint`)
- Type‑check (`pnpm -w type-check`)
- Tests (Vitest) – fast by default; heavy integration opt‑in
- Barrel compliance (`scripts/check-barrels.mjs`)
- Public API report build/check (`scripts/api-report-build.mjs`, `scripts/api-report-check.mjs`)
- Docs build (TypeDoc + VitePress)
- Markdown lint + TSDoc coverage
- Bundle size/budgets (as integrated)

---

## Import and Barrel Standards

- Explicit `.js` extensions for all local TS imports (including type‑only), and for barrel re‑exports
- No deep imports into `@swissjs/*/src/*` from other packages
- Public surfaces export only from package `src/index.ts`

See `docs/development/conventions.md` and `docs_old/development/esm-import-standard.md`.

---

## Release Process (Summary)

High‑level release steps (see `docs/development/release-process.md` for full detail):

- Merge `develop` → `staging` and validate
- Merge `staging` → `release`, bump versions (Changesets), finalize changelogs
- Tag and push from `release`
- Merge `release` → `main` and deploy
- Propagate back: `main` → `develop`/`staging` as needed

---

## Platform Notes

- Windows native: prefer WSL for file watching, symlinks, and avoiding NTFS filename limits; if native, enable long paths and mind CRLF
- WSL: work under Linux home (avoid `/mnt/c`); use VS Code “WSL: Reopen Folder”
- macOS/Linux: increase file watcher limits if HMR or tests miss changes

See `docs/DEVELOPER_QUICKSTART.md` for detailed cross‑platform setup.

---

## PR Checklist (Copy into PRs)

- [ ] Branch off `develop`; small, scoped changes
- [ ] Commit messages follow `[TICKET_ID] Summary`
- [ ] Lint, types, tests all pass locally
- [ ] `pnpm -w check:barrels && pnpm check:policy && pnpm -w check:ui-format`
- [ ] API report checked (or baselines updated intentionally)
- [ ] Docs updated (API + guides); `pnpm docs:build` passes
- [ ] Changeset added if publishing packages

---

## Troubleshooting

- Node mismatch: run `nvm use`
- Slow/unstable HMR: prefer WSL on Windows; avoid `/mnt/c`; increase watchers on Linux
- Barrel or deep import failures: fix exports and imports; re‑run `pnpm -w check:barrels` and `pnpm check:policy`
- API drift: confirm intent; run `pnpm api:build` to refresh baselines
- Docs nondeterminism: run `pnpm docs:clean:generated && pnpm docs:api && pnpm docs:api:index && pnpm docs:build`
