/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { LifecyclePhase, ComponentHook } from './types/index.js';

export class LifecycleManager {
  private hooks: Record<LifecyclePhase, ComponentHook[]> = {};

  public on(
    phase: LifecyclePhase,
    callback: (...args: unknown[]) => void,
    options: { once?: boolean; priority?: number; capability?: string } = {}
  ) {
    if (!this.hooks[phase]) this.hooks[phase] = [];
    this.hooks[phase].push({
      phase,
      callback,
      once: options.once ?? false,
      priority: options.priority ?? 0,
      capability: options.capability
    });
    this.hooks[phase].sort((a, b) => b.priority - a.priority);
  }

  public async executeHookPhase(
    phase: LifecyclePhase,
    context: { hasCapability?: (capability: string) => boolean; captureError?: (err: unknown, phase: LifecyclePhase) => void } | unknown,
    error?: unknown
  ): Promise<void> {
    const hooks = this.hooks[phase] || [];
    const hooksToExecute = hooks.filter(hook => {
      if (!hook.capability) return true;
      if (typeof context === 'object' && context && 'hasCapability' in context) {
        const hc = (context as { hasCapability?: (c: string) => boolean }).hasCapability;
        return typeof hc === 'function' ? hc(hook.capability) : false;
      }
      return false;
    });
    for (let i = 0; i < hooksToExecute.length; i++) {
      const hook = hooksToExecute[i];
      try {
        if (phase === 'error' && error) {
          await hook.callback.call(context as unknown as object, error);
        } else {
          await hook.callback.call(context as unknown as object);
        }
        if (hook.once) {
          const index = hooks.indexOf(hook);
          if (index !== -1) hooks.splice(index, 1);
        }
      } catch (hookError: unknown) {
        if (
          phase !== 'error' &&
          typeof context === 'object' &&
          context &&
          'captureError' in context &&
          typeof (context as { captureError?: (e: unknown, p: LifecyclePhase) => void }).captureError === 'function'
        ) {
          (context as { captureError?: (e: unknown, p: LifecyclePhase) => void }).captureError!(hookError, phase);
        } else {
          console.error('[Swiss] Error during error handling hook:', hookError);
        }
      }
    }
  }

  public getHooks() {
    return this.hooks;
  }
} 