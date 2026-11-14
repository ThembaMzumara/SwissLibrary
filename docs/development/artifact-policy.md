<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Artifact Policy

This monorepo enforces a strict build artifact policy:

- Source directories (`src/`) must contain only source files (e.g., `.ts`, `.tsx`).
- Build outputs must be emitted to `dist/` via `tsconfig.json` `outDir`.
- CI and `pnpm reset` will fail if artifacts are detected in `src/`.

## Scripts

- `scripts/check-src-artifacts.mjs`: scans for stray `*.js` / `*.d.ts` in any `src/` dirs and fails if found.
- `scripts/check-tsconfig-outdir.mjs`: verifies each package `tsconfig.json` sets `compilerOptions.outDir` to `dist`.

## Remediation

1. Remove stray artifacts from `src/` (commit the deletions).
2. Ensure `tsconfig.json` has `outDir: "dist"` and no emit into `src/`.
3. Re-run the dev flow: commit → `pnpm reset` → commit generated files → push.

## Root Cause Analysis (RCA)

Common causes of stray artifacts in `src/` and how to address them:

- Editor or plugin transpiling on save
  - Disable per-project emit-on-save.
  - Ensure TypeScript plugin is not writing to `src/`.

- Running `tsc` directly without project references
  - Always use workspace scripts (`pnpm -w build`, `pnpm reset`).
  - Do not run `tsc` with `--outDir` pointing to `src/`.

- Manual debugging copies
  - Never copy compiled `.js`/`.d.ts` into `src/`.
  - Use `dist/` or temporary scratch outside the repo.

- Misconfigured `tsconfig.json`
  - Verify `compilerOptions.outDir` is `dist`.
  - Ensure `include`/`exclude` do not point to `dist` or external locations.

If artifacts are found, clean with `pnpm clean`, delete the stray files, and re-run `pnpm reset`.

See also: Public vs Internal API policy and CI `policy-checks` job.
