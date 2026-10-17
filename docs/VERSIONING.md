<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Docs Versioning Strategy (Minimal)

We start with a simple approach: publish two versions of the documentation at any time.

- latest: The current development version (main branch)
- vX.Y: The last released version (previous stable)

## Structure

- latest is built from the `main` branch into `/` (root)
- previous stable is built from the last release tag into `/vX.Y/`

Example URLs:

- https://docs.swissjs.dev/ (latest)
- https://docs.swissjs.dev/v0.1/ (previous stable)

## Build/Publish Flow

1. On every merge to `main`:
   - Build VitePress site for latest
   - Upload artifact and deploy to production
2. On release (tag `vX.Y.Z`):
   - Build VitePress site from the tag
   - Publish to `/vX.Y/` subdirectory

## TypeDoc/API Docs

- API docs are generated per build and included under `docs/api/`
- For versioned builds, API docs are generated from the same code at that tag
- Keep the `/api/` sidebar static, scoped to each version's build

## Version Switcher

- Start without an in-page version switcher (keep it minimal)
- Add a simple "Versions" page with links to latest and previous
- If/when more versions are needed, add a switcher in the nav

## Content Guidelines

- Avoid deep-link breakage between versions; use stable headings and anchors
- When renaming or removing pages, add a short stub that links forward
- Keep landing pages consistent across versions to reduce confusion

## Clean-up Policy

- Maintain only two versions: `latest` and the previous release `vX.Y`
- When a new release is cut:
  - Promote previous `latest` to `/vX.Y/`
  - Remove the older `/vW.Z/` folder (keep changelogs in repo)

## CI Notes

- CI should accept an optional `DOCS_VERSION_PREFIX` env var
  - empty for latest (root)
  - `vX.Y` for previous (subdir)
- Deployment provider (e.g., Netlify/Vercel) must support subdirectory deploys or redirects

---

## Package Versioning (Changesets + npm)

- Each package under `packages/*` and `packages/plugins/*` follows independent SemVer.
- Changesets authoring:
  - `pnpm changeset` to select affected packages and bump type (patch/minor/major)
  - Commit the generated file under `.changeset/`
- Applying versions & changelogs:
  - `pnpm release:version` updates package versions and CHANGELOGs
- Publishing:
  - CI publishes on annotated tag push `vX.Y.Z` using `NPM_TOKEN`.

### Internal Dependency Bumps

- Keep internal dependency ranges conservative; default to `patch` bumps for cross‑package alignment unless an API change requires minor/major.
- CI policy checks ensure public barrels remain stable.

### Pre‑Releases (RC/Canary)

- Use Changesets pre mode for candidates:
  - `pnpm changeset pre enter rc` (or `canary`)
  - `pnpm release:version` to create pre versions
  - Publish with npm dist‑tag (e.g., `next`) via Changesets publish workflow
  - Exit pre mode before final release: `pnpm changeset pre exit`
