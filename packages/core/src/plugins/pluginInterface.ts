/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { SwissComponent } from '../component/component.js';
import type {
  PluginContext as BasePluginContext,
  DirectiveContext as BaseDirectiveContext,
  Plugin as BasePlugin,
} from './plugin-types.js';
import type { HookRegistrySurface, HookRegistration } from './types/hooks-contract.js';

// Extend the base interfaces with component-specific parts
export interface PluginContext extends BasePluginContext {
  hooks: HookRegistrySurface;
  registerHook: (hook: HookRegistration) => void;
}

export interface DirectiveContext extends BaseDirectiveContext {
  component: SwissComponent;
}

// Canonical Plugin interface with typed getService
export interface Plugin extends BasePlugin {
  getService?: <T = unknown>(name: string) => T;
}