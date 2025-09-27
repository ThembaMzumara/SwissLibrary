/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Re-export hooks types from the hooks/types barrel.
// This preserves existing import paths while enforcing the global barrel rule.
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
} from './types/index.js';