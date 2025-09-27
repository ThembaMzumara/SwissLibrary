<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS (.ui) Monorepo

![Mirror to Public Repo](https://github.com/ThembaMzumara/SWISS/actions/workflows/mirror-to-public.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/license/ThembaMzumara/SWISS)](https://github.com/ThembaMzumara/SWISS/blob/main/LICENSE)

This repository hosts the SwissJS (.ui) framework, compiler, CLI, plugins, and docs.

## Ownership and Licensing

**SwissJS Framework** is owned and copyrighted by **Themba Mzumara** © 2024.

Licensed under the [MIT License](LICENSE). See the [LICENSE](LICENSE) file for details.

All algorithms, code, documentation, and intellectual property in this repository are proprietary to the owner unless otherwise stated. Unauthorized use without attribution violates the license terms.

### Copyright Notice
All source files in this repository contain copyright headers asserting ownership. When using, modifying, or distributing this software, you must:
- Include the copyright notice and license in all copies
- Provide attribution to the original author
- Comply with the MIT License terms

### Intellectual Property Protection
- **Framework Architecture**: Proprietary capability-based security model
- **Compiler Pipeline**: Custom AST transformers and .ui file processing
- **Plugin System**: Unique context-aware registration and lifecycle management
- **VSCode Extension**: Complete Language Server Protocol implementation
- **Security Engine**: Capability validation and enforcement system

## Plan & Roadmap

Follow the authoritative plan (no improvisation):

- `docs/development/plan.md` — SwissJS Development Plan (authoritative)

## Documentation

- `docs/README.md` — Internal architecture documentation
- `docs/api/` — Per-package API docs (generated)
- `docs/development/` — Development standards and guides
- `docs/development/conventions.md` — ESM imports, barrels, API report, CI gates, commit flow

## Packages

- packages/core — Core runtime
- packages/compiler — Compiler transformers and pipeline
- packages/cli — CLI toolchain
- packages/plugins — First-party plugins
- packages/utils — Shared utilities

## Contributing

- Prereq: Node pinned via `.nvmrc` (v18.19.0). Ensure your Node matches.
- Use named exports and barrel files with explicit `.js` extensions for ESM compliance.
- Follow the plan in `docs/development/plan.md`; changes must be additive and backward compatible.
- Keep tests up-to-date; do not remove tests after validation.

### Developer Tools (Phase 5)

- Deterministic docs runner: `pnpm docs:api` (isolated, pinned TypeDoc/TS)
- Barrel compliance: `pnpm -w check:barrels`
- Public API reports:
  - Build/update baselines: `pnpm api:build` (writes `etc/api/*.json`)
  - Check drift vs baselines: `pnpm api:check`

### Preferred Commit Flow

1. Make code changes and update docs
2. `git add -A && git commit -m "chore: update code/docs"`
3. Run full reset to regenerate artifacts:
   - `pnpm reset`
4. `git add -A && git commit -m "chore: regenerate docs/api and reports"`
5. `git push`
