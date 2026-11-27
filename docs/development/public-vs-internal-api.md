<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Public vs. Internal API

This page defines what is considered the stable, supported public API versus internal/private code paths.

- Public APIs are exported via top-level barrels and documented in `docs/api/`.
- Internal APIs are subject to change without notice and should not be imported by consumers.

## Core (`@swissjs/core`)

Public surface (examples):

- Components: `SwissComponent`, decorators: `component`, `onMount`, `onUpdate`, `onDestroy`
- VDOM runtime (compiler-injected): `createElement`, `Fragment`
- Plugin system: `PluginManager`, types: `Plugin`, `PluginContext`
- Security helpers: documented exports under `packages/core/src/security/index.ts`

Non-public examples:

- Deep module paths like `@swissjs/core/component/lifecycle` or `@swissjs/core/vdom/vnode`.
- Any symbol not re-exported by `packages/core/src/index.ts`.

## Policy

- Do not wildcard-export entire subtrees; re-export only curated public symbols.
- Codeowners should review PRs for accidental public exports.
- Breaking changes to public surface require a semver-impact note and docs update.

## How to consume

Always `import { ... } from '@swissjs/core'`.
Avoid importing from nested paths, which are internal and may change.
