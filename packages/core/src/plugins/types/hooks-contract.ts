/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Stable plugin hooks and registry surface (types only)

export type HookName =
  | 'beforePluginRegister'
  | 'afterPluginRegister'
  | 'beforePluginUnregister'
  | 'afterPluginUnregister'
  | 'pluginActivate'
  | 'pluginDeactivate'
  | 'securityError'
  // Routing and component lifecycle hooks (used by plugins)
  | 'beforeRouteResolve'
  | 'afterRouteResolve'
  | 'beforeComponentMount'
  | 'afterComponentMount'
  | 'onCapabilityAudit'
  | 'runtimeReady';

export interface HookPayloads {
  beforePluginRegister: { plugin: { name: string } };
  afterPluginRegister: { plugin: { name: string } };
  beforePluginUnregister: { plugin: { name: string } };
  afterPluginUnregister: { plugin: { name: string } };
  pluginActivate: { plugin: { name: string } };
  pluginDeactivate: { plugin: { name: string } };
  securityError: { plugin?: { name: string }; reasons?: string[]; context?: Record<string, unknown> };
  // Route path string for compatibility with file-router plugin
  beforeRouteResolve: string;
  afterRouteResolve: { path: string; resolved: unknown };
  // Be permissive to avoid cross-package type coupling
  beforeComponentMount: unknown;
  afterComponentMount: unknown;
  onCapabilityAudit: import('./index.js').AuditResult;
  runtimeReady: { version?: string };
}

export type HookHandler<K extends HookName = HookName> = (payload: HookPayloads[K]) => unknown;

export type HookRegistration = {
  [K in HookName]: {
    name: K;
    handler: HookHandler<K>;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  }
}[HookName];

export interface HookRegistrySurface {
  addHook<K extends HookName>(name: K, handler: HookHandler<K>, owner?: string, priority?: HookRegistration['priority']): void;
  removeHooks(owner: string): void;
  callHook<K extends HookName>(name: K, payload: HookPayloads[K]): void;
}
