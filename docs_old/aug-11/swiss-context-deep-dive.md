<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissContext Deep Dive (Aug 11)

Sources:
- `packages/core/src/component/context.ts` (factory)
- `packages/core/src/component/component.ts` (`provideContext`, `useContext`)
- `packages/core/src/reactivity/*` (signals/effects)

## Current Behavior

- Provider/Consumer factory:
  - `SwissContext.create<T>()` => `{ Provider(value), Consumer() }`
  - `Provider(value)(component)` stores value with a unique Symbol in `component.context` via `provideContext()`.
  - `Consumer()(component)` reads via `useContext()`.
- Storage & lookup:
  - `SwissComponent.provideContext(key, value)` stores on instance.
  - `SwissComponent.useContext(key)` checks own map, then traverses `_parent` chain.
- Reactivity:
  - No built-in subscriptions to context updates. Effects exist (`reactivity/effect.ts`), but context reads are not tracked.

## What Works

- Scoped, symbol-based context isolation (no collisions).
- O(depth) parent traversal for nearest provider.
- Zero VDOM overhead; minimal runtime footprint.

## Partially Supported

- Manual re-render on provider change (caller can call `scheduleUpdate()` or mutate signals triggering `effect()` that calls `performUpdate()`). Not automatic from context alone.

## Not Yet Supported

- Automatic re-render of consumers when provider value changes.
- Default values on `create()`.
- Dev warnings for missing provider.
- Selectors/memoization for partial reads.
- Versioning to avoid redundant updates.

## Robustness Parity Plan (Additive)

- Default values: `create<T>(defaultValue?: T)`; `useContext()` returns default when not provided.
- Dev warnings (dev-only): warn when resolving to default in absence of Provider.
- Subscriptions (opt-in):
  - Maintain a small `ContextChannel` per key: `{ version: number, subscribers: Set<SwissComponent> }`.
  - `Provider(value)` updates `channel.version` and notifies subscribers.
  - `Consumer(select?)` registers current component in subscribers on first read.
  - Components, upon notification, `scheduleUpdate()`; selector/equality prevents unnecessary updates.
- Selectors and equality:
  - `Consumer<S>(select?: (v:T)=>S, equals?: (a:S,b:S)=>boolean)` caches last selected value per component+key.
- Versioning & memo:
  - Increment per-key version on Provider updates; consumers compare and recompute select only when version changes.
- Feature flags:
  - `SWISS_CONTEXT_SUBSCRIBE=1` enables subscriptions.
  - Dev-only warnings behind `process.env.NODE_ENV !== 'production'`.

## Integration Points

- `SwissComponent`:
  - Add per-instance map `__ctxSelections` for last selected values and versions.
  - On `dispose/unmount`, unsubscribe from channels.
- `context.ts`:
  - Keep current API; extend factory to wire into channels when flag is on.
- Reactivity synergy:
  - Context changes can set a `signal` under the hood; consumer `effect()` triggers `scheduleUpdate()`.

## Migration & Back-Compat

- Default behavior unchanged (no subs). Opt-in flags keep baseline cost minimal.
- Upgrade path: enable flag, adopt selectors where needed.
