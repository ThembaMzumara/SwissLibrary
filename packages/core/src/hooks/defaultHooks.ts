/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { HookRegistry } from './hookRegistry.js';

// Define hook event types
export type HookEvent = 
  | 'beforeComponentMount'
  | 'afterComponentMount'
  | 'beforeComponentRender'
  | 'afterComponentRender'
  | 'beforeComponentUnmount'
  | 'beforeRouteResolve'
  | 'afterRouteResolve'
  | 'routeChange'
  | 'beforeSSR'
  | 'afterSSR'
  | 'beforeHydration'
  | 'afterHydration'
  | 'beforeDataFetch'
  | 'afterDataFetch'
  | 'dataFetchError'
  | 'capabilityCheck'
  | 'securityError'
  | 'pluginActivate'
  | 'pluginDeactivate'
  | 'onCapabilityAudit'
  | 'runtimeReady'
  | 'processDirective';

// Pre-defined framework hooks
export const DEFAULT_HOOKS: HookEvent[] = [
  // Component lifecycle
  'beforeComponentMount',
  'afterComponentMount',
  'beforeComponentRender',
  'afterComponentRender',
  'beforeComponentUnmount',
  // Routing
  'beforeRouteResolve',
  'afterRouteResolve',
  'routeChange',
  // SSR
  'beforeSSR',
  'afterSSR',
  'beforeHydration',
  'afterHydration',
  // Data
  'beforeDataFetch',
  'afterDataFetch',
  'dataFetchError',
  // Security
  'capabilityCheck',
  'securityError',
  // Plugin lifecycle and audit
  'pluginActivate',
  'pluginDeactivate',
  'onCapabilityAudit',
  'runtimeReady',
  // Directives
  'processDirective'
];

/**
 * Initialize default hooks in the registry
 */
export function initializeDefaultHooks(registry: HookRegistry) {
  for (const hook of DEFAULT_HOOKS) {
    registry.addHook(
      hook,
      () => {}, // Default no-op handler
      'swiss-core',
      'critical'
    );
  }
}