<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Plugin Development (Phase 4)

This page defines the stable plugin contract, lifecycle, service registry, and capability audit for Phase 4. The new lifecycle path is feature-flagged and OFF by default.

- Feature flag: `SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE=1`
- When OFF: legacy behavior (`init` → `onLoad` → `onUnload`) is preserved and required capabilities are enforced at registration time.
- When ON: lifecycle orchestration, aggregated capability audit, runtime-ready emission, and duplicate-service detection are enabled.

## Plugin Identity and Kinds

- `name: PluginName` (required)
- `id?: PluginId`
- `kind?: PluginKind` — `runtime | routing | data | ssr | security | devtools | utility | other`

## Capability Surface

- `announcedCapabilities?: string[]`
- `requiredCapabilities?: string[]`
- `grantedBy?: string[]`

With the flag ON, missing `requiredCapabilities` are reported in the aggregated audit; with the flag OFF, registration throws immediately.

## Lifecycle Hooks

- Legacy hooks (always supported): `init(context)`, `onLoad(context)`, `onUnload(context)`
- Phase 4 additions (optional):
  - `onRegisterServices(context)` — register services via `context.app?.registerService(name, service)` or `PluginManager.registerService(name, service)`.
  - `onRuntimeReady(context)` — called when runtime context is available.
  - `onCapabilityAudit(audit)` — receives aggregated capability audit results.
  - `onCompile?(code, id)` — optional transform hook for compiler/Vite integrations.

## Hook Events (Default)

- Component: `beforeComponentMount`, `afterComponentMount`, `beforeComponentRender`, `afterComponentRender`, `beforeComponentUnmount`
- Routing: `beforeRouteResolve`, `afterRouteResolve`, `routeChange`
- SSR: `beforeSSR`, `afterSSR`, `beforeHydration`, `afterHydration`
- Data: `beforeDataFetch`, `afterDataFetch`, `dataFetchError`
- Security: `capabilityCheck`, `securityError`
- Plugin lifecycle & audit: `pluginActivate`, `pluginDeactivate`, `onCapabilityAudit`, `runtimeReady`
- Directives: `processDirective`

## Context Surface (summary)

- `hooks`, `registerHook(h)`, `capabilities: Set<string>`
- `logger: { info|warn|error }` — plugin-scoped logging
- `app?`: `registerRoute`, `registerMiddleware`, `registerService`
- `dev?`: `isDevMode`, `hotReload`, `watchFiles(paths, cb)`, `compileOnChange`
- `runtime?`: `type`, `adapter`, `capabilities`

## Service Registry

- Preferred: register in `onRegisterServices()` using `context.app?.registerService()` or `PluginManager.registerService()`.
- Duplicate detection: first registration wins; subsequent attempts log a warning.
- Legacy fallback: `providesService()` + `getService()` remains supported.

## Aggregated Capability Audit

- `PluginManager.runCapabilityAudit()` collects all `announcedCapabilities` and validates `requiredCapabilities`.
- Emits `onCapabilityAudit` and stores result retrievable via `PluginManager.getAudit()`.

## Experimental Lifecycle Behavior (flag ON)

- Registration: `init → onLoad → onRegisterServices → pluginActivate`
- Failure handling: rollback via `pluginDeactivate`, `onUnload()`, remove hooks and plugin entry.
- Runtime: `setRuntimeContext()` emits `runtimeReady` and calls `onRuntimeReady(context)` on all plugins.

## Migration Checklist

- Use new hooks where applicable; keep legacy hooks for back-compat.
- Register services in `onRegisterServices`.
- Announce capabilities if providing; declare `requiredCapabilities` if consuming.
- Use `context.logger` for plugin-scoped logs.
