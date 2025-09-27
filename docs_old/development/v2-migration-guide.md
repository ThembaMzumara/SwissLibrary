<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS V2: Migration Guide

This document provides a comprehensive, phased roadmap for migrating the SwissJS codebase from its current V1-like state to the official V2 architecture.

## Migration Analysis: The Gap

The primary architectural shift from V1 to V2 is moving from a monolithic `core` package to a decoupled, multi-package system with clear boundaries for the UI Engine and Security System.

| Feature Area | Current State (V1-ish) | Target State (V2) | **Migration Gap & Rationale** |
| :--- | :--- | :--- | :--- |
| **Packages** | `core` is a large "god package" containing runtime, UI, security, and components. | `core` is a slim orchestrator. `ui-engine` and `security` are separate, first-class packages. | **HUGE GAP.** The primary task is to break up `core` into specialized packages to enforce separation of concerns and improve maintainability. |
| **Runtime System** | `runtime-service` exists but is initialized eagerly and lacks a factory. | Runtime uses a lazy-loaded factory pattern (`adapter-factory.ts`). | **MEDIUM GAP.** The foundation is there, but it needs refactoring for performance (lazy-loading) and cleaner design (factory). |
| **Security** | Security logic is implicitly mixed within `PluginManager` and `core`. No explicit gateway exists. | A dedicated `security` package contains the engine, and `core` exposes a safe `PolicyGateway`. | **HUGE GAP.** Security must be extracted into its own robust, isolated system to prevent plugin overreach and provide clear audit trails. |
| **UI & Rendering**| VDOM, renderer, reactivity, hooks, and directives all live inside `packages/core`. | These are all consolidated into a new, dedicated `packages/ui-engine` package. | **HUGE GAP.** Extracting the UI engine decouples the core framework from the rendering implementation, allowing them to evolve independently. |
| **Plugin System** | `PluginManager` exists but lacks a formal capability registry or strict containment. | `PluginManager` interacts with the `SecurityEngine` via a `CapabilityRegistry`. | **MEDIUM GAP.** The system needs to be hardened by integrating it with the new security package and providing stricter sandboxing for plugins. |
| **Documentation** | Documentation is manual and static. | A mix of manual guides and an `api-generator` produces auto-generated API docs. | **LARGE GAP.** The current docs will quickly become stale. An automated system is required for long-term accuracy. |

---

## Migration Roadmap

This migration is broken down into five distinct phases. Each phase builds upon the last and includes specific, actionable tasks.

### **Phase 1: Core Restructuring & Runtime Refinement**

*Goal: Establish the new package structure and refine the runtime system to match the V2 design.*

1.  **Create New Packages:**
    *   In the `packages/` directory, create two new directories: `ui-engine` and `security`.
    *   In each new directory, run `pnpm init` (or your package manager's equivalent) to create `package.json` files.
    *   Create a `tsconfig.json` in each, extending the root `tsconfig.base.json`.

2.  **Refactor the Runtime System (in `packages/core`):**
    *   **Create `runtime/adapter-factory.ts`:** This file will export a function like `createAdapter(runtimeType)` that returns a `new NodeAdapter()` or `new BunAdapter()`. This centralizes the creation logic.
    *   **Update `runtime/runtime-service.ts`:**
        *   Remove the internal `switch` statement for adapter creation. Instead, call the `AdapterFactory` to get the adapter instance.
        *   Implement lazy-loading: The adapter should only be created on the *first* call to a runtime method (e.g., `readFile`), not in the `RuntimeService` constructor. Check if `this.adapter` is null before creating it.

3.  **Establish the Security Gateway:**
    *   In `packages/core/src/security/`, create a `gateway.ts` file.
    *   This file will export placeholder functions like `export async function auditPlugin(plugin) {}` and `export async function requestCapability(capability) {}`. This defines the public-facing API that the rest of the framework will use.

4.  **Create the Capability Registry:**
    *   In `packages/core/src/plugins/`, create a `capability-registry.ts` file.
    *   Implement a simple class (e.g., `CapabilityRegistry`) that can `grant`, `revoke`, and `check` capabilities, likely using a `Map` internally for storage.
    *   Update `pluginManager.ts` to instantiate and use this registry when a plugin is initialized.

---

### **Phase 2: UI Engine Extraction**

*Goal: Decouple all rendering and UI logic from the core framework into its own dedicated package.*

1.  **Move UI/Rendering Source Code:**
    *   Physically move the following directories from `packages/core/src` to the new `packages/ui-engine/src` directory:
        *   `vdom/`
        *   `renderer/`
        *   `directives/`
        *   `hooks/`
        *   `reactivity/`

2.  **Update Monorepo Dependencies:**
    *   In `packages/core/package.json`, add `"@swissjs/ui-engine": "workspace:*"` to its `dependencies`.
    *   Do the same for any other package (like `compiler`) that will now depend directly on the UI engine.

3.  **Fix Imports Across the Monorepo:**
    *   This is the most time-consuming step. Perform a global search for any import path that includes the moved directories.
    *   Update all such imports. For example:
        *   `import { VNode } from '@swissjs/core/vdom'` becomes `import { VNode } from '@swissjs/ui-engine'`.
        *   `import { reactive } from '../reactivity/index.js'` becomes `import { reactive } from '@swissjs/ui-engine'`.

4.  **Update Barrel Files:**
    *   Edit `packages/core/src/index.ts` and remove all exports related to VDOM, rendering, reactivity, hooks, etc.
    *   Create a new `packages/ui-engine/src/index.ts` barrel file that exports the public API of the new UI engine.

---

### **Phase 3: Security System Implementation**

*Goal: Build out the dedicated security package and wire it into the core framework via the gateway.*

1.  **Build the Security Engine:**
    *   In the `packages/security/src` directory, create and implement the core logic:
        *   `engine.ts`: The main class or functions for auditing plugins and evaluating policies.
        *   `validator.ts`: Logic to validate a plugin's requested capabilities against defined security policies.
        *   `capabilities.ts`: An enum or constant set defining all available capabilities in the system (e.g., `filesystem`, `network`).

2.  **Connect the Gateway to the Engine:**
    *   Update `packages/core/src/security/gateway.ts`.
    *   Import the `SecurityEngine` from the `@swissjs/security` package.
    *   Implement the placeholder gateway functions to now call the actual engine methods. This ensures the `core` package doesn't contain the security *logic*, only the *interface* to it.

3.  **Integrate with Plugin Manager:**
    *   Update `packages/core/src/plugins/manager.ts`.
    *   In the `registerPlugin` method, before initialization, add a call to `await securityGateway.auditPlugin(plugin)`.
    *   If the audit fails, throw an error and prevent the plugin from being loaded.

---

### **Phase 4: Developer Experience & Tooling**

*Goal: Improve the developer workflow by scaffolding tools for documentation and project management.*

1.  **Create Dev Tools Scaffolding:**
    *   Create a new root-level `dev/` directory.
    *   Add placeholder directories inside: `tests/`, `lint/`, `bundle/`, and `api-generator/`.

2.  **Plan API Documentation Generation:**
    *   In `dev/api-generator/`, add a `README.md` file. Outline the plan to use a tool like **TypeDoc** to scan the public APIs of all `packages/*/src` directories and output Markdown files to `docs/api/`.

3.  **Create V2 Documentation Structure:**
    *   In the main `docs/` directory, create the new subdirectories: `api/`, `plugins/`, and `security/`.
    *   Move any existing relevant docs into these folders and add placeholder `README.md` files for the new guides that need to be written.

---

### **Phase 5: Final Optimizations**

*Goal: Implement the final performance enhancements outlined in the V2 architecture.*

1.  **Implement Production Preloading:**
    *   In the `packages/cli/src/commands/serve.ts` (or the equivalent entry point for production mode), add logic to detect production environments (e.g., via `process.env.NODE_ENV`).
    *   If in production, call a new method like `runtimeService.preloadAdapter()` to initialize the runtime eagerly. This avoids the lazy-loading cost on the first user request.

2.  **Integrate Bundle Analysis:**
    *   In the `dev/bundle/` directory, add a configuration file for a tool like `rollup-plugin-visualizer` or `webpack-bundle-analyzer`.
    *   Update the `package.json` build script to run this analysis and output a report, helping to identify large dependencies or code-splitting opportunities. 