<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Plugin Examples: Experimental Lifecycle and Registry

This page shows concrete snippets using the experimental lifecycle hooks and the service registry.

Note: Enable the feature flag before using the experimental lifecycle.

```bash
export SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE=1
```

## Registering Services in onRegisterServices

```ts
import type { Plugin } from "@swissjs/core/plugins/pluginInterface";
import { PluginManager } from "@swissjs/core/plugins/pluginManager";

export const examplePlugin: Plugin = {
  name: "example-plugin",
  version: "0.0.1",
  onRegisterServices(ctx) {
    const router = {
      navigate: (p: string) => {
        /* ... */
      },
    };
    // Either via PluginManager instance
    const pm = PluginManager.globalRegistry();
    pm.registerService("router", router);

    // Or via app context if provided by the host
    ctx.app?.registerService?.("router", router);
  },
};
```

## Responding to Capability Audit

```ts
export const auditAwarePlugin: Plugin = {
  name: "audit-aware",
  version: "0.0.1",
  requiredCapabilities: ["fs", "network"],
  onCapabilityAudit(audit) {
    if (!audit.ok) {
      for (const err of audit.errors) {
        console.warn(
          `[audit] missing capability for`,
          err.plugin,
          "=>",
          err.capability,
        );
      }
    }
  },
};
```

## Using onRuntimeReady

```ts
export const runtimePlugin: Plugin = {
  name: "runtime-plugin",
  version: "0.0.1",
  onRuntimeReady(ctx) {
    // initialize adapters or start background tasks when runtime is ready
    if (ctx.runtime?.type === "node") {
      // Node-specific setup
    }
  },
};
```

## Registering and Calling Hooks

```ts
export const hooky: Plugin = {
  name: "hooky",
  version: "0.0.1",
  init(ctx) {
    ctx.registerHook({
      name: "afterSomething",
      handler: () => console.log("afterSomething!"),
    });
  },
};

// Later, host code can call via the hook registry
import { PluginManager } from "@swissjs/core/plugins/pluginManager";
const pm = new PluginManager();
pm.register(hooky);
pm.getHookRegistry().callHook("afterSomething");
```

See the detailed lifecycle and registry guide in `docs/plugins/lifecycle-and-registry.md`.
