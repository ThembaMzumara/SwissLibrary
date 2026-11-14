/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export * from './pluginManager.js';

// Export the enhanced interfaces from pluginInterface as primary
export type { PluginContext, DirectiveContext, Plugin } from './pluginInterface.js';

// Export base types for advanced usage
export type {
  Plugin as BasePlugin,
  PluginContext as BasePluginContext,
  DirectiveContext as BaseDirectiveContext,
  DirectiveBinding,
} from './plugin-types.js';
