/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Hooks types barrel
// All hook-related interfaces moved here per monorepo rule

export interface ComponentRenderContext {
  component: unknown;
}

export interface ComponentMountContext {
  component: unknown;
  element: HTMLElement;
}

// Routing Hooks
export interface RouteResolveContext {
  url: URL;
  route?: unknown;
  params?: Record<string, string>;
}

export interface RouteChangeContext {
  from: string;
  to: string;
}

// SSR Hooks
export interface SSRContext {
  url: URL;
  html?: string;
  error?: Error;
}

// Data Hooks
export interface DataFetchContext {
  url: string;
  options: unknown;
  data?: unknown;
  error?: Error;
}

// Security Hooks
export interface CapabilityCheckContext {
  capability: string;
  context: unknown;
  result?: boolean;
}

export interface SecurityErrorContext {
  error: Error;
  context: unknown;
}

// Plugin Hooks
export interface PluginLifecycleContext {
  plugin: unknown;
}

// Framework Hooks
export interface FrameworkLifecycleContext {
  timestamp: number;
  version?: string;
  reason?: string;
}

export interface HookRegistration {
  name: string;
  handler: (...args: unknown[]) => unknown;
  priority?: string;
}
