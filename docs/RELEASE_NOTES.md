<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Release Notes

## 2025-09-18 – Windows-based release (Phase 6 wrap-up, VSCode extension deferred)

- This release was built and validated on Windows (Git Bash) using Node 18.20.5 and pnpm 10.12.4.
- The monorepo successfully installs, lints, type-checks, builds, and generates documentation deterministically.
- API docs are generated via a deterministic TypeDoc JS API runner at `tools/docs-runner/generate.mjs`.
- Policy checks are green (barrels, deep imports, UI format). Markdownlint MD029 issues fixed.
- Known caveat: the VSCode extension package at `packages/devtools/vscode_extension/` is intentionally excluded in this release because the source is on a Linux machine and was previously ignored by `.gitignore`.
  - `.gitignore` has been updated to whitelist the extension path.
  - The submodule entry was removed and replaced with a normal directory with a `.gitkeep` placeholder to allow committing the extension in a follow-up release.

### What’s next

- Import the VSCode extension sources from Linux into `packages/devtools/vscode_extension/` and cut a follow-up release.
- Optional: introduce a pre-release (RC/canary) channel using Changesets pre mode and npm dist-tags for wider manual testing.
