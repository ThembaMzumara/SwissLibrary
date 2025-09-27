/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Plugins types barrel
// All plugin-related types that do not depend on the component system

import type { ViteDevServer } from 'vite';
import type { HookRegistrySurface, HookRegistration } from './hooks-contract.js';

export type RouteHandler = (...args: unknown[]) => unknown;

// Phase 4: Stable identifiers and lifecycle
export type PluginName = string;
export type PluginId = string;
export type PluginKind = 'runtime' | 'routing' | 'data' | 'ssr' | 'security' | 'devtools' | 'utility' | 'other';
export type PluginLifecycle = 'init' | 'load' | 'activate' | 'deactivate' | 'dispose';

export interface AuditIssue {
  plugin: PluginName;
  capability: string;
  message: string;
  level: 'warning' | 'error';
}

export interface AuditResult {
  ok: boolean;
  warnings: AuditIssue[];
  errors: AuditIssue[];
  summary: string;
}

export interface PluginLogger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

export interface PluginContext {
  hooks: HookRegistrySurface;
  registerHook: (hook: HookRegistration) => void;
  capabilities: Set<string>;
  logger: PluginLogger;
  // Enhanced context with routing and development capabilities
  app?: {
    name: string;
    registerRoute: (path: string, handler: RouteHandler) => void;
    registerMiddleware: (middleware: RouteHandler) => void;
    registerService: (name: string, service: unknown) => void;
  };
  dev?: {
    isDevMode: boolean;
    hotReload: boolean;
    watchFiles: (paths: string[], callback: (event: string, file: string) => void) => void;
    compileOnChange: boolean;
  };
  runtime?: {
    type: 'node' | 'bun' | 'unknown';
    adapter: unknown;
    capabilities: { [key: string]: boolean };
  };
}

export interface DirectiveBinding {
  value: unknown;
  expression: string;
  modifier?: string | string[];
}

// Minimal interface to avoid circular dependency with SwissComponent
export interface ComponentLike {
  element: HTMLElement;
  props: object;
}

export interface DirectiveContext {
  element: HTMLElement;
  directive: string;
  binding: DirectiveBinding;
  component: ComponentLike;
}

export interface Plugin {
  // Identity
  name: PluginName;
  id?: PluginId;
  kind?: PluginKind;
  version?: string;
  // Capabilities surface
  announcedCapabilities?: string[];
  requiredCapabilities?: string[];
  grantedBy?: string[];
  // Service surface (legacy pattern)
  providesService?: (name: string) => boolean;
  getService?: (name: string) => unknown;
  // Lifecycle (legacy + Phase 4 additions)
  init?: (context: PluginContext) => void;
  onLoad?: (context: PluginContext) => void;
  // Phase 4 lifecycle extensions (optional)
  onRegisterServices?: (context: PluginContext) => void;
  onRuntimeReady?: (context: PluginContext) => void;
  onCapabilityAudit?: (audit: AuditResult) => void;
  // Compiler hook (optional)
  onCompile?: (code: string, id: string) => string | Promise<string>;
  // Shutdown
  onUnload?: (context: PluginContext) => void;
  // Directives
  processDirective?: (ctx: DirectiveContext) => void;
  // Dev server
  onRouteRegister?: (context: PluginContext, route: Record<string, unknown>) => void;
  onDevServerStart?: (context: PluginContext, server: ViteDevServer) => void;
  onDevServerStop?: (context: PluginContext) => void;
}
