/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import "reflect-metadata";

// Core framework exports
export {
  SwissFramework,
  SwissApp,
  framework,
  SWISS_VERSION,
} from "./framework.js";

// Plugin system
export * from "./plugins/index.js";

// Component system
export * from "./component/index.js";

// Virtual DOM
export * from "./vdom/index.js";

// Hooks system
export * from "./hooks/index.js";

// Runtime services
export { runtimeService } from "./runtime/runtime-service.js";
export { DevServerService } from "./runtime/dev-server.js";

// Renderer
export { hydrate } from "./renderer/index.js";

// Reactivity
export * from "./reactivity/index.js";

// Security
export * from "./security/index.js";
export {
  setSecurityGateway,
  getSecurityGateway,
  evaluateCapability,
  audit,
  auditPlugin,
} from "./security/gateway.js";

// Devtools
export { 
  getDevtoolsBridge,
  setDevtoolsBridge,
  isDevtoolsEnabled,
  isTelemetryEnabled,
  InMemoryBridge
} from "./devtools/bridge.js";
export type {
  DevtoolsBridge,
  GraphSnapshot,
  ComponentNodePayload,
  ComponentUpdatePayload,
  ComponentId,
  CapabilityName,
  DevtoolsEvent,
  DevtoolsEventCategory
} from "./devtools/bridge.js";

// Utils
export { html, escapeHTML, unsafe, css, classNames } from "./utils/html.js";

// Routing types
export type {
  ComponentConstructor,
  ComponentImport,
  RouteDefinition,
  RouteParams,
  RouteMeta,
  RouterContext,
} from "./types/routing.js";

// JSX runtime
export { jsx, jsxs, Fragment as JSXFragment } from "./jsx-runtime.js";
export {
  jsx as jsxDEV,
  jsxs as jsxsDEV,
  Fragment as JSXFragmentDEV,
} from "./jsx-dev-runtime.js";
