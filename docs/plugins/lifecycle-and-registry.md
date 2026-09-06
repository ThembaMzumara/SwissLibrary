<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Plugin Lifecycle, Registry, and Audit

This page documents the plugin lifecycle orchestration, service registry improvements, capability audit, and plugin-scoped logging.

- Feature flag: `SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE=1`
- Status: Feature-flagged. Non-breaking when flag is off.
- Location: `packages/core/src/plugins/pluginManager.ts`

## Feature Flag

- Set `SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE=1` to enable the new lifecycle orchestration.
- When the flag is off, legacy behavior is preserved and the new hooks are not invoked.

## Lifecycle Hooks

When the flag is enabled, `PluginManager.registerPlugin()` invokes these additional hooks (if implemented):

- `onRegisterServices(ctx)`
  - Time to register services via `ctx.app?.registerService(name, service)` or `PluginManager.registerService(name, service)`.
- `onCapabilityAudit(audit)`
  - Receives the last audit result after registration. Use for diagnostics.
- `onRuntimeReady(ctx)`
  - Called once core runtime contexts are available.

Optional hooks are safely defaulted via `withDefaultPlugin()`.

## Capability Audit

- After registration, `PluginManager` builds an audit of required capabilities across plugins.
- `PluginManager.getAudit()` returns the last `AuditResult`:
  - `ok: boolean`
  - `warnings: AuditIssue[]`
  - `errors: AuditIssue[]`
  - `summary: string`

## Service Registry

- `PluginManager.registerService(name, service)` adds a service with duplicate detection. First registration wins; duplicates log a warning.
- `PluginManager.getService(name)` resolves from the local registry or queries registered plugins that implement `providesService()` and `getService()`.
- `PluginManager.hasService(name)` checks for an existing or resolvable service.

## Plugin-Scoped Logging

- Use `PluginManager`'s plugin-scoped logger (internally) for consistent logs tagged with the plugin name.
- Example log format: `[plugin:my-plugin] message`.

## Usage Example

```ts
import { PluginManager } from "@swissjs/core/plugins/pluginManager";

const pm = new PluginManager();
process.env.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE = "1";

pm.register({
  name: "example",
  version: "0.0.1",
  onRegisterServices(ctx) {
    pm.registerService("router", {
      navigate: (p: string) => {
        /* ... */
      },
    });
  },
  onCapabilityAudit(audit) {
    if (!audit.ok) console.warn("Capability issues:", audit.summary);
  },
  onRuntimeReady(ctx) {
    // runtime is ready
  },
});

const audit = pm.getAudit();
```

## Backward Compatibility

- The new lifecycle is fully gated by `SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE`.
- Without the flag, the system behaves as before. Existing plugins continue to work.
