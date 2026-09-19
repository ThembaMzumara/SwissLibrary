<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Developer Quickstart (Cross‑Platform)

This guide gets you productive on SwissJS across Windows, macOS, and Linux. It complements the architecture docs in `docs/README.md` and the authoritative Phase 6 plan in `docs/PHASE6_PLAN.md`.

- Core architecture: see `docs/README.md`
- Phase 6 work plan: see `docs/PHASE6_PLAN.md`
- Versioning approach: see `docs/VERSIONING.md`
- Legacy workflow and rules (historical context): see `docs_old/development/`

## Prerequisites

- Node.js: 18.19.x (see `.nvmrc` and `package.json > engines`)
- pnpm: 10.x
- Git: 2.35+
- Optional: VS Code and the SwissJS VSCode extension (for `.ui` grammar + LSP)

### Install: Linux

- Node: `nvm install 18.19 && nvm use 18.19`
- pnpm: `corepack enable && corepack prepare pnpm@latest --activate` or `npm i -g pnpm@10`
- Git: `apt/yum/pacman` package manager per distro

### Install: macOS

- Node: `brew install nvm && nvm install 18.19 && nvm use 18.19`
- pnpm: `corepack enable && corepack prepare pnpm@latest --activate` or `brew install pnpm`
- Git: `brew install git`

### Install: Windows (two supported setups)

- Recommended: WSL (Ubuntu/Debian)
  - Install WSL: `wsl --install` (PowerShell, once)
  - Inside WSL: follow Linux steps (use your Linux home dir, e.g., `~/work`, not `/mnt/c`)
  - Why: ext4 avoids NTFS filename limits and symlink friction; Node tooling is faster off `/mnt/*`

- Native Windows (Git Bash/PowerShell) — works, with caveats
  - Install Node 18.19 via nvm‑windows or the Node MSI
  - Install pnpm via `npm i -g pnpm@10`
  - Set long paths: `git config --global core.longpaths true`
  - CRLF: recommended `git config --global core.autocrlf input` (or rely on `.gitattributes`)
  - Symlinks: enable Windows Developer Mode or run terminals as Admin for symlink creation in some packages

## Clone and Install

```bash
# Linux/macOS (Terminal) or Windows (WSL):
mkdir -p ~/work && cd ~/work

git clone https://github.com/ThembaMzumara/SWISS.git
cd SWISS

# Use Node 18.19
nvm use

# Install workspace deps
pnpm install
```

On native Windows (Git Bash/PowerShell), the same commands apply. Prefer WSL if you expect unusual filenames or heavy symlink usage.

## Monorepo Commands (top‑level `package.json`)

- Install deps: `pnpm install`
- Build all: `pnpm build`
- Dev (workspace graph): `pnpm dev`
- Tests: `pnpm -w test` (watch: `pnpm test:watch`)
- Lint: `pnpm -w lint`
- Types: `pnpm -w type-check`
- Policy checks: `pnpm -w check:barrels && pnpm check:policy && pnpm -w check:ui-format`
- Docs (API + site): `pnpm docs` or `pnpm docs:rebuild`
- Full validation/reset pipeline: `pnpm reset`

Docs generation details:

- API docs: `pnpm docs:api` then `pnpm docs:api:index` (writes to `docs/api/`)
- VitePress site: `pnpm docs:build` (serve locally via `pnpm docs:dev`)

## Daily Development Flow

1. Sync your branch

```bash
git checkout develop
git pull origin develop
# Start a feature branch
git checkout -b feature/<short-name>
```

1. Run the workspace

```bash
nvm use
pnpm install
pnpm dev
```

1. Code, lint, and test

```bash
pnpm -w lint
pnpm -w type-check
pnpm -w test
```

1. Commit and push

```bash
git commit -am "[TICKET] concise summary"
git push -u origin feature/<short-name>
```

1. Open a PR to `develop` and ensure CI is green

For package version bumps (when publishing packages), use Changesets:

```bash
pnpm changeset                    # author a changeset
pnpm release:version              # apply version bumps
pnpm release:publish              # publish to registry (as configured)
```

## Branching Model (summary)

- Long‑lived branches: `main`, `release`, `staging`, `develop`
- Feature branches: `feature/...` off `develop`
- Flow: `develop → staging → release → main`
- Hotfixes: from `main` (and then merge back to `develop`/`staging`)
- See `docs_old/development/workflow.md` for the minimal workflow reference

## Platform Notes and Gotchas

### Windows (Native)

- Prefer WSL for best compatibility and performance (especially for Node file watching and symlinks)
- If staying on NTFS:
  - Set `git config --global core.longpaths true`
  - CRLF: `git config --global core.autocrlf input` (keeps LF in repo)
  - Symlinks may require Developer Mode or Admin shells
  - Path/file constraints: Windows forbids `| < > : " ? *` in filenames; if such files appear on a remote branch created on Linux, checkout will fail on NTFS. Workarounds:
    - Fix on the remote (rename/delete offending files via PR)
    - Use WSL/ext4 for the checkout and to author the fix
    - Sparse‑checkout and worktrees can help in some cases, but Git still validates paths on checkout

### WSL

- Work in your Linux home (e.g., `~/work`), not under `/mnt/c` to avoid perf penalties
- VS Code: use the “WSL: Reopen Folder” flow for best experience

### Linux/macOS

- If file watching limits are low (HMR not updating): increase inotify/macOS watcher limits
  - Linux: e.g., `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`

## Docs and API Discipline

- Public APIs and major features should be documented under `docs/`
- Keep API docs deterministic: `pnpm docs:api && pnpm docs:api:index`
- Build and preview docs locally: `pnpm docs:dev`
- Versioning strategy for site: see `docs/VERSIONING.md` (latest + previous stable)

## Phase 6 Focus (What We’re Building Now)

- Capability Explorer, Runtime Inspector, Template Debugging, Production Telemetry
- PDK (Plugin Development Kit) and Template Component Library
- For exact scope and acceptance: see `docs/PHASE6_PLAN.md`

## Troubleshooting

- Node version mismatch: run `nvm use` (the repo has `.nvmrc`)
- Slow/unstable file watching (Windows): prefer WSL; avoid `/mnt/c` for Node projects
- CI fails on policy checks: run locally
  - `pnpm -w check:barrels && pnpm check:policy && pnpm -w check:ui-format`
- ESM import errors: ensure local TS imports include `.js` extension (see `docs_old/development/esm-import-standard.md`)
- VSCode extension tests temporarily skipped in CI (see `docs/TECH_DEBT.md`); follow the fix plan there

---

If anything here becomes outdated, submit a PR updating this page and, if needed, the Phase 6 plan. This page should remain minimal, practical, and cross‑platform.
