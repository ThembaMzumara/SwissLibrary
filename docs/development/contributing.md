<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Contributing

This project enforces a strict development flow and CI policy.

## Dev Flow (enforced)

1. Make code/docs changes.
2. Update documentation accordingly.
3. Commit with a ticketed message, e.g., `[SWS-CORE-123] Your message`.
4. Run `pnpm reset` at repo root (this runs policy checks, builds, and docs generation).
5. Commit generated outputs: `[SWS-RESET] ...`.
6. Push.

## Commit messages

- Must start with a ticket ID in brackets.
- Examples:
  - `[SWS-RESET] Make reset fully non-interactive and green`
  - `[SWS-DOCS-API_FIX] Fix API docs routes`

## CI gates

- `policy-checks`: no src artifacts, tsconfig outDir=dist, ban deep imports, ban wildcard exports in public barrels
- `docs-api`: API docs generation must succeed
- Tests and Lint must pass
- Extension build job (when applicable) must pass

## Public API policy

- Import only from package barrels (e.g., `@swissjs/core`), not deep paths.
- Avoid wildcard exports in public barrels; export a curated surface explicitly.
