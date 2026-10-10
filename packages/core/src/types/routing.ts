/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Re-export routing types from the core types barrel.
// This preserves existing deep imports while enforcing type centralization.
export type {
  ComponentConstructor,
  ComponentImport,
  RouteDefinition,
  RouteParams,
  RouteMeta,
  RouterContext,
} from './index.js';
