/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import 'reflect-metadata';

// Core framework exports
export { SwissFramework, SwissApp, framework, SWISS_VERSION } from './framework.js';

// Plugin system (export types without component dependencies to avoid circular dependencies)
export type { Plugin, PluginContext, DirectiveContext, DirectiveBinding } from './plugins/plugin-types.js';
export { PluginManager } from './plugins/pluginManager.js';

// Component system (curated public surface)
export { SwissComponent } from './component/component.js';
export { component, onMount, onUpdate, onDestroy } from './component/decorators.js';
export type { SwissComponentOptions, SwissErrorInfo, ComponentHook } from './component/types/index.js';

// Virtual DOM (only the runtime used by compiler-injected imports)
export { createElement, Fragment } from './vdom/index.js';

// Hooks system (curated)
export { HookRegistry } from './hooks/hookRegistry.js';
export { initializeDefaultHooks, DEFAULT_HOOKS } from './hooks/defaultHooks.js';
export type { HookEvent } from './hooks/defaultHooks.js';
export type {
  ComponentRenderContext,
  ComponentMountContext,
  RouteResolveContext,
  RouteChangeContext,
  SSRContext,
  DataFetchContext,
  CapabilityCheckContext,
  SecurityErrorContext,
  PluginLifecycleContext,
  FrameworkLifecycleContext,
  HookRegistration,
} from './hooks/hookContextTypes.js';

// Runtime services (export runtimeService directly to avoid circular dependencies)
export { runtimeService } from './runtime/runtime-service.js';
export { DevServerService } from './runtime/dev-server.js';

// Renderer
export { hydrate } from './renderer/index.js';

// Reactivity
export { computed } from './reactivity/index.js';

// Security (curated)
export { checkCapabilities, validateDirectiveCapability, CAPABILITIES } from './security/index.js';
export type { Capability } from './security/index.js';
export { setSecurityGateway, getSecurityGateway, evaluateCapability, audit, auditPlugin } from './security/gateway.js';

// Devtools (dev-only, behind flag)
export { getDevtoolsBridge } from './devtools/bridge.js';
export type { DevtoolsBridge, GraphSnapshot, ComponentNodePayload, ComponentUpdatePayload, ComponentId } from './devtools/bridge.js';

// Utils (curated)
export { html, escapeHTML, unsafe, css, classNames } from './utils/html.js';

// Routing types (curated)
export type {
  ComponentConstructor,
  ComponentImport,
  RouteDefinition,
  RouteParams,
  RouteMeta,
  RouterContext,
} from './types/routing.js';

// JSX runtime
export { jsx, jsxs, Fragment as JSXFragment } from './jsx-runtime.js';
export { jsx as jsxDEV, jsxs as jsxsDEV, Fragment as JSXFragmentDEV } from './jsx-dev-runtime.js';