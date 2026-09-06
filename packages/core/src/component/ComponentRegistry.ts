/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { HookRegistry } from '../hooks/hookRegistry.js';
import { SwissComponent } from './component.js';

export class ComponentRegistry {
  private readonly hooks: HookRegistry;
  private readonly registry = new Map<string, typeof SwissComponent>();

  constructor(hooks: HookRegistry) {
    this.hooks = hooks;
  }

  register(name: string, component: typeof SwissComponent) {
    this.registry.set(name, component);
    // Optionally, we could expose a hook in the future, referencing hooks ensures no-unused-vars
    void this.hooks;
  }

  get(name: string): typeof SwissComponent | undefined {
    return this.registry.get(name);
  }
}