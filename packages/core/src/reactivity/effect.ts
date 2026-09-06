/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Signal } from './signals.js';
import { EffectStage } from './types/index.js';

// Global context for tracking current effect
const moduleId = Math.random().toString(36).slice(2);
console.log('[Effect] Module initialized, ID:', moduleId);

let _currentEffect: Effect | null = null;

export function getCurrentEffect(): Effect | null {
  console.log('[Effect] getCurrentEffect returning', _currentEffect, 'Module ID:', moduleId);
  return _currentEffect;
}
export function setCurrentEffect(eff: Effect | null) {
  console.log('[Effect] setCurrentEffect setting to', eff, 'Module ID:', moduleId);
  _currentEffect = eff;
}

// Effect lifecycle stages are defined in the reactivity types barrel

/**
 * Effect class for reactive side effects
 */
export class Effect {
  private fn: () => (() => void) | void;
  private stage = EffectStage.INITIAL;
  cleanup: (() => void) | null = null;
  dependencies = new Set<Signal<unknown>>();

  constructor(fn: () => (() => void) | void) {
    this.fn = fn;
    this.execute = this.execute.bind(this);
    this.execute();
  }

  execute() {
    if (this.stage === EffectStage.DISPOSED) return;
    console.log('[Effect] >>> START execute()');

    // Run cleanup from previous execution
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    // Clear previous dependencies
    this.clearDependencies();

    // Set as current effect
    const prevEffect = _currentEffect;
    console.log('[Effect] >>> BEFORE setCurrentEffect, prevEffect:', prevEffect);
    setCurrentEffect(this);
    console.log('[Effect] >>> AFTER setCurrentEffect, _currentEffect should be:', this);
    this.stage = EffectStage.ACTIVE;

    try {
      console.log('[Effect] >>> CALLING this.fn()');
      // Execute effect function
      const result = this.fn();
      console.log('[Effect] >>> RETURNED from this.fn()');

      // Store cleanup function if returned
      if (typeof result === 'function') {
        this.cleanup = result;
      }
    } catch (error) {
      // Handle errors during execution
      console.error('Effect execution error:', error);
    } finally {
      // Restore previous effect context
      console.log('[Effect] >>> FINALLY block, restoring to prevEffect:', prevEffect);
      setCurrentEffect(prevEffect);
      console.log('[Effect] >>> END execute()');
    }
  }

  /**
   * Clear all dependencies and unsubscribe
   */
  private clearDependencies() {
    for (const dep of this.dependencies) {
      dep.unsubscribe(this.execute);
    }
    this.dependencies.clear();
  }

  /**
   * Dispose of the effect and clean up resources
   */
  dispose() {
    if (this.stage === EffectStage.DISPOSED) return;

    this.stage = EffectStage.DISPOSED;
    this.clearDependencies();

    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}

/**
 * Create a reactive effect
 * 
 * @param fn - The effect function to run
 * @returns Disposal function to stop the effect
 */
export function effect(fn: () => (() => void) | void): () => void {
  const eff = new Effect(fn);
  return () => eff.dispose();
}

/**
 * Register a cleanup function to run when dependencies change
 * 
 * @param fn - Cleanup function
 */
export function onCleanup(fn: () => void) {
  const curr = getCurrentEffect();
  if (!curr) throw new Error('onCleanup must be called within an effect');
  const prevCleanup = curr.cleanup;
  curr.cleanup = () => {
    if (prevCleanup) prevCleanup();
    fn();
  };
}

/**
 * Track effect dependencies for signals
 */
export function trackEffect<T>(signal: Signal<T>) {
  const curr = getCurrentEffect();
  console.log('[Effect] trackEffect called for signal', signal, 'Current effect:', curr);
  if (curr) {
    curr.dependencies.add(signal as unknown as Signal<unknown>);
    signal.subscribe(curr.execute);
    console.log('[Effect] Dependency added');
  }
}

/**
 * Run a function without tracking dependencies
 * 
 * @param fn - Function to run
 * @returns Result of the function
 */
export function untrack<T>(fn: () => T): T {
  const prevEffect = getCurrentEffect();
  setCurrentEffect(null);
  try {
    return fn();
  } finally {
    setCurrentEffect(prevEffect);
  }
}