<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Plugin Migration for Phase 4

Phase 4 stabilizes the plugin lifecycle and security auditing flow. This page summarizes required updates for plugin authors.

## Lifecycle and Hooks

- Stable hooks include (examples):
  - `beforeRouteResolve`
  - `beforeComponentMount`
  - `securityError` (emitted on security violations)
- Hook ordering: `critical` > `high` > `normal` > `low`.
- Insertion order is preserved for the same priority.
- First thrown error aborts subsequent handlers for that hook call.

## Registration

- Use `PluginManager` to register/unregister plugins.
- Provide a stable `id` for deterministic ordering and auditing.
- Avoid deep imports from core; import types and APIs from `@swissjs/core` barrel only.

## Security Auditing

- Core delegates to the Security Gateway for plugin audits.
- On violation, core emits `securityError` hook to allow observability.
- Plugins should avoid side effects during audit hooks and should be idempotent.

## Breaking Changes to Note

- Curated public APIs: only symbols re-exported from `@swissjs/core` barrels are public.
- Wildcard exports removed from public barrels; import explicitly re-exported symbols.
- TypeScript is pinned (5.8.2) and test configs are unified.

## Testing Guidance

- Write tests that assert hook ordering by priority and insertion order.
- Add negative tests that simulate a thrown error; verify remaining handlers do not run.
- If observing `securityError`, ensure it triggers only once per violation with expected payload.
