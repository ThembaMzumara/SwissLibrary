/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Re-export plugin types from the plugins/types barrel.
// This preserves existing import paths while enforcing the global barrel rule.
export type {
  RouteHandler,
  PluginContext,
  DirectiveBinding,
  ComponentLike,
  DirectiveContext,
  Plugin,
} from './types/index.js';
