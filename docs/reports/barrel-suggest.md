<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Barrel Suggestions

Non-destructive suggestions to help complete barrels.

## packages/cli

- Barrel: `packages/cli/src/index.ts` (exists)

```ts
export * from "./__tests__/cli.test.js";
export * from "./commands/build.js";
export * from "./commands/compile.js";
export * from "./commands/create-plugin.js";
export * from "./commands/create.js";
export * from "./commands/dev.js";
export * from "./commands/forge.js";
export * from "./commands/init.js";
export * from "./commands/serve.js";
export * from "./forge/dependency-manager.js";
export * from "./forge/file-generator.js";
export * from "./forge/prompt-engine.js";
export * from "./forge/registry.js";
export * from "./forge/template-engine.js";
export * from "./main.js";
export * from "./types/ambient.d.js";
export * from "./types/index.js";
export * from "./types/template.types.js";
export * from "./utils/compileUiFiles.js";
```

## packages/cli/templates/component/files

- Barrel: `packages/cli/templates/component/files/src/index.ts` (missing)
  _No suggestions_

## packages/cli/templates/library/files

- Barrel: `packages/cli/templates/library/files/src/index.ts` (missing)
  _No suggestions_

## packages/cli/templates/library/files/test

- Barrel: `packages/cli/templates/library/files/test/src/index.ts` (missing)
  _No suggestions_

## packages/cli/templates/plugin/files/example

- Barrel: `packages/cli/templates/plugin/files/example/src/index.ts` (missing)
  _No suggestions_

## packages/cli/templates/plugin/files

- Barrel: `packages/cli/templates/plugin/files/src/index.ts` (missing)
  _No suggestions_

## packages/compiler

- Barrel: `packages/compiler/src/index.ts` (exists)

```ts
export * from "./index.test.js";
export * from "./optimizer.js";
export * from "./template-parser.js";
export * from "./transformers/capability-annot.js";
export * from "./transformers/capability-def-annot.js";
export * from "./transformers/component-decorators.js";
export * from "./transformers/diagnostics.js";
export * from "./transformers/index.js";
export * from "./transformers/lifecycle-render-decorators.js";
export * from "./transformers/plugin-service-decorators.js";
export * from "./transformers/provides-annot.js";
export * from "./transformers/utils.js";
```

## packages/components

- Barrel: `packages/components/src/index.ts` (missing)

```ts
export * from "./ui-modules.d.js";
```

## packages/core

- Barrel: `packages/core/src/index.ts` (exists)

```ts
export * from "./__tests__/capability-manager.test.js";
export * from "./__tests__/context.test.js";
export * from "./__tests__/core.test.js";
export * from "./__tests__/hooks-multi-plugin.test.js";
export * from "./__tests__/hooks-ordering.test.js";
export * from "./__tests__/plugin-manager.test.js";
export * from "./__tests__/security-gateway.test.js";
export * from "./component/ComponentRegistry.js";
export * from "./component/base-component.js";
export * from "./component/component.js";
export * from "./component/context.js";
export * from "./component/decorators.js";
export * from "./component/error-boundary.js";
export * from "./component/event-system.js";
export * from "./component/index.js";
export * from "./component/lifecycle.js";
export * from "./component/portals.js";
export * from "./component/ssr.js";
export * from "./component/types.js";
export * from "./component/types/CapabilitySet.js";
export * from "./component/types/ComponentHook.js";
export * from "./component/types/index.js";
export * from "./devtools/bridge.js";
export * from "./directives/coreDirectives.js";
export * from "./directives/index.js";
export * from "./directives/types/index.js";
export * from "./error/remediation.js";
export * from "./example-usage.js";
export * from "./fenestration/index.js";
export * from "./fenestration/registry.js";
export * from "./fenestration/types/index.js";
export * from "./framework.js";
export * from "./global.d.js";
export * from "./hooks/defaultHooks.js";
export * from "./hooks/hookContextTypes.js";
export * from "./hooks/hookRegistry.js";
export * from "./hooks/index.js";
export * from "./hooks/types/index.js";
export * from "./jsx-dev-runtime.js";
export * from "./jsx-runtime.js";
export * from "./plugins/index.js";
export * from "./plugins/plugin-types.js";
export * from "./plugins/pluginInterface.js";
export * from "./plugins/pluginManager.js";
export * from "./plugins/types/hooks-contract.js";
export * from "./plugins/types/index.js";
export * from "./reactivity/batch.js";
export * from "./reactivity/context.js";
export * from "./reactivity/effect.js";
export * from "./reactivity/index.js";
export * from "./reactivity/integration.js";
export * from "./reactivity/reactive.js";
export * from "./reactivity/signals.js";
export * from "./reactivity/store.js";
export * from "./reactivity/types/index.js";
export * from "./renderer/index.js";
export * from "./renderer/renderer.js";
export * from "./renderer/unified-renderer.js";
export * from "./runtime/adapters/bun-adapter.js";
export * from "./runtime/adapters/node-adapter.js";
export * from "./runtime/dev-server.js";
export * from "./runtime/index.js";
export * from "./runtime/runtime-adapter.js";
export * from "./runtime/runtime-detector.js";
export * from "./runtime/runtime-service.js";
export * from "./runtime/types/index.js";
export * from "./security/capabilities.js";
export * from "./security/capability-manager.js";
export * from "./security/gateway.js";
export * from "./security/index.js";
export * from "./security/types/index.js";
export * from "./types/index.js";
export * from "./types/routing.js";
export * from "./utils/deepMerge.js";
export * from "./utils/generateSSRId.js";
export * from "./utils/html.js";
export * from "./utils/index.js";
export * from "./vdom/diffing.js";
export * from "./vdom/index.js";
export * from "./vdom/types/index.js";
export * from "./vdom/vdom.js";
```

## packages/devtools/capability-explorer

- Barrel: `packages/devtools/capability-explorer/src/index.ts` (exists)

```ts
export * from "./services/DataService.js";
```

## packages/devtools/pdk_harness

- Barrel: `packages/devtools/pdk_harness/src/index.ts` (exists)

```ts
export * from "./harness.js";
```

## packages/devtools/runtime_inspector

- Barrel: `packages/devtools/runtime_inspector/src/index.ts` (exists)

```ts
export * from "./services/DataService.js";
```

## packages/devtools/swiss_extension

- Barrel: `packages/devtools/swiss_extension/src/index.ts` (exists)

```ts
export * from "./background.js";
export * from "./content.js";
export * from "./injected.js";
export * from "./panel.js";
```

## packages/devtools/template_debugger

- Barrel: `packages/devtools/template_debugger/src/index.ts` (exists)

```ts
export * from "./services/PreviewService.js";
```

## packages/devtools/vscode_extension/server

- Barrel: `packages/devtools/vscode_extension/server/src/index.ts` (exists)

```ts
export * from "./placeholder.js";
```

## packages/devtools/vscode_extension

- Barrel: `packages/devtools/vscode_extension/src/index.ts` (exists)

```ts
export * from "./client/commands/index.js";
export * from "./client/extension.js";
export * from "./client/index.js";
export * from "./client/providers/completionProvider.js";
export * from "./client/providers/definitionProvider.js";
export * from "./client/providers/documentSymbolProvider.js";
export * from "./client/providers/hoverProvider.js";
export * from "./client/providers/index.js";
export * from "./server/astTypes.js";
export * from "./server/index.js";
export * from "./server/language/codeActions.js";
export * from "./server/language/completions.js";
export * from "./server/language/definitions.js";
export * from "./server/language/diagnostics.js";
export * from "./server/language/formatting.js";
export * from "./server/language/hover.js";
export * from "./server/language/index.js";
export * from "./server/language/symbols.js";
export * from "./server/parser/index.js";
export * from "./server/parser/nodeAtPosition.js";
export * from "./server/parser/swissParser.js";
export * from "./server/server.js";
export * from "./server/shared/index.js";
export * from "./server/shared/logUtils.js";
export * from "./server/shared/rangeUtils.js";
export * from "./server/shared/registry.js";
export * from "./server/shared/stringUtils.js";
export * from "./server/shared/templateUtils.js";
export * from "./shared/index.js";
export * from "./shared/types.js";
export * from "./shared/utils.js";
```

## packages/plugins/file-router

- Barrel: `packages/plugins/file-router/src/index.ts` (exists)

```ts
export * from "./__tests__/plugin.test.js";
export * from "./core/index.js";
export * from "./core/matcher.js";
export * from "./core/plugin.js";
export * from "./core/scanner.js";
export * from "./core/transformer.js";
export * from "./core/utils.js";
export * from "./dev/index.js";
export * from "./dev/server.js";
export * from "./dev/watcher.js";
export * from "./types/config.js";
export * from "./types/dev.js";
export * from "./types/index.js";
export * from "./types/route.js";
export * from "./utils/cache.js";
export * from "./utils/index.js";
export * from "./utils/path.js";
export * from "./utils/route.js";
```

## packages/plugins/vite-plugin-swiss

- Barrel: `packages/plugins/vite-plugin-swiss/src/index.ts` (exists)

```ts
export * from "./__tests__/vite-plugin-swiss.test.js";
```

## packages/plugins/web-storage

- Barrel: `packages/plugins/web-storage/src/index.ts` (exists)

```ts
export * from "./__tests__/plugin.test.js";
export * from "./plugin.js";
export * from "./public/capabilities.js";
export * from "./public/services.js";
export * from "./public/types.js";
export * from "./runtime/env.js";
export * from "./runtime/indexed.js";
export * from "./runtime/local.js";
export * from "./runtime/session.js";
```

## packages/security

- Barrel: `packages/security/src/index.ts` (exists)

```ts
export * from "./__tests__/engine.test.js";
export * from "./engine.js";
export * from "./types.js";
export * from "./validator.js";
```

## packages/utils

- Barrel: `packages/utils/src/index.ts` (exists)

```ts
export * from "./fixDtsExtensions.js";
```
