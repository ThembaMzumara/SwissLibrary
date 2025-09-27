<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Barrel Public API Report

Generated: 2025-08-10T07:23:49.450Z

## packages/cli
- Barrel: `packages/cli/src/index.ts`
- Exports: (none detected)

## packages/compiler
- Barrel: `packages/compiler/src/index.ts`
- Exports: (none detected)

## packages/core
- Barrel: `packages/core/src/index.ts`
- Exports:
  - `export { SwissFramework, SwissApp, framework, SWISS_VERSION } from './framework.js'`
  - `export { PluginManager } from './plugins/pluginManager.js'`
  - `export * from './component/index.js'`
  - `export * from './vdom/index.js'`
  - `export * from './hooks/index.js'`
  - `export { runtimeService } from './runtime/runtime-service.js'`
  - `export { DevServerService } from './runtime/dev-server.js'`
  - `export { hydrate } from './renderer/index.js'`
  - `export { computed } from './reactivity/index.js'`
  - `export * from './security/index.js'`
  - `export * from './utils/index.js'`
  - `export * from './types/routing.js'`
  - `export * from './jsx-runtime.js'`
  - `export * from './jsx-dev-runtime.js'`

## packages/devtools/fenestration_explorer
- Barrel: `packages/devtools/fenestration_explorer/src/index.ts`
- Exports: (none detected)

## packages/plugins/file-router
- Barrel: `packages/plugins/file-router/src/index.ts`
- Exports:
  - `export { fileRouterPlugin } from './core/index.js'`
  - `export { 
  pathToRoute,
  routeToPath,
  createRouteCache 
} from './utils/index.js'`
  - `export { 
  createFileWatcher,
  createDevServer 
} from './dev/index.js'`

## packages/plugins/vite-plugin-swiss
- Barrel: `packages/plugins/vite-plugin-swiss/src/index.ts`
- Exports: (none detected)

## packages/utils
- Barrel: `packages/utils/src/index.ts`
- Exports:
  - `export * from './fixDtsExtensions.js'`
