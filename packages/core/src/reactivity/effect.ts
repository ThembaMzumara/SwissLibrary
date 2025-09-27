/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Signal } from './signals.js';
import { EffectStage } from './types/index.js';

// Global context for tracking current effect
let _currentEffect: Effect | null = null;

export function getCurrentEffect(): Effect | null {
  return _currentEffect;
}
export function setCurrentEffect(eff: Effect | null) {
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

    // Run cleanup from previous execution
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    // Clear previous dependencies
    this.clearDependencies();

    // Set as current effect
    const prevEffect = _currentEffect;
    setCurrentEffect(this);
    this.stage = EffectStage.ACTIVE;

    try {
      // Execute effect function
      const result = this.fn();

      // Store cleanup function if returned
      if (typeof result === 'function') {
        this.cleanup = result;
      }
    } catch (error) {
      // Handle errors during execution
      console.error('Effect execution error:', error);
    } finally {
      // Restore previous effect context
      setCurrentEffect(prevEffect);
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
  if (curr) {
    curr.dependencies.add(signal as unknown as Signal<unknown>);
    signal.subscribe(curr.execute);
  }
}

// No direct export of currentEffect; use getter/setter