/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Effect, trackEffect, getCurrentEffect, setCurrentEffect } from './effect.js';
import type { SignalOptions } from './types/index.js';
export type { SignalOptions } from './types/index.js';

const defaultEquals = <T>(a: T, b: T) => a === b;

// Simple batch system for signal updates
const batchedSignals = new Set<Signal<unknown>>();
let isBatching = false;

function addToBatch<T>(signal: Signal<T>) {
  if (isBatching) {
    batchedSignals.add(signal as unknown as Signal<unknown>);
  }
}

function flushBatch() {
  if (batchedSignals.size > 0) {
    const signals = Array.from(batchedSignals);
    batchedSignals.clear();
    signals.forEach(signal => signal.notify());
  }
}

// Simple security context system
let currentCapabilities = new Set<string>();

function hasCapability(capability: string): boolean {
  return currentCapabilities.has(capability);
}

function withSecurityContext(capabilities: string[], fn: () => void) {
  const prevCapabilities = new Set(currentCapabilities);
  capabilities.forEach(cap => currentCapabilities.add(cap));
  try {
    fn();
  } finally {
    currentCapabilities = prevCapabilities;
  }
}

/**
 * Signal class for standalone reactive values
 */
export class Signal<T> {
  protected _value: T;
  protected subscribers = new Set<() => void>();
  private equals: (a: T, b: T) => boolean;
  private capability?: string;
  public readonly name?: string;

  constructor(initialValue: T, options: SignalOptions<T> = {}) {
    this._value = initialValue;
    this.equals = options.equals || defaultEquals;
    this.capability = options.capability;
    this.name = options.name;
  }

  get value(): T {
    // Track effect dependency if in effect context
    trackEffect(this);
    if (getCurrentEffect()) {
      // Security check
      if (this.capability && !hasCapability(this.capability)) {
        throw new Error(`Access denied to signal '${this.name}'. Missing capability: ${this.capability}`);
      }
    }
    return this._value;
  }

  set value(newValue: T) {
    if (this.equals(this._value, newValue)) return;
    // Security check for writes
    if (this.capability && !hasCapability(this.capability)) {
      throw new Error(`Write access denied to signal '${this.name}'. Missing capability: ${this.capability}`);
    }
    this._value = newValue;
    addToBatch(this);
    if (!isBatching) {
      this.notify();
    }
  }

  /**
   * Update value using a function
   */
  update(updater: (value: T) => T) {
    this.value = updater(this.value);
  }

  /**
   * Subscribe to value changes
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.unsubscribe(callback);
  }

  /**
   * Unsubscribe from changes
   */
  unsubscribe(callback: () => void) {
    this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of changes
   */
  notify() {
    this.subscribers.forEach(sub => sub());
  }

  // Security-enhanced access
  withCapability(capability: string, fn: (value: T) => void) {
    withSecurityContext([capability], () => fn(this.value));
  }
}

/**
 * ComputedSignal class for derived reactive values
 */
export class ComputedSignal<T> extends Signal<T> {
  private computeFn: () => T;
  private dirty = true;
  private dependencies = new Set<Signal<unknown>>();
  private effect: Effect;

  constructor(computeFn: () => T, options?: SignalOptions<T>) {
    super(undefined as unknown as T, options);
    this.computeFn = computeFn;
    
    // Create a proper Effect using the actual Effect class
    this.effect = new Effect(() => {
      this.dirty = true;
      this.notify();
    });
    
    this.updateValue();
  }

  get value(): T {
    if (this.dirty) {
      this.updateValue();
    }
    return super.value;
  }

  private updateValue() {
    // Clear previous dependencies
    this.dependencies.forEach(dep => {
      dep.unsubscribe(() => this.effect.execute());
    });
    this.dependencies.clear();
    
    // Compute new value with dependency tracking
    const prevCurrentEffect = getCurrentEffect();
    
    try {
      // Set current effect to track dependencies
      setCurrentEffect(this.effect);
      
      this._value = this.computeFn();
      this.dirty = false;
      
      // Store new dependencies
      this.effect.dependencies.forEach(dep => {
        this.dependencies.add(dep);
        dep.subscribe(() => this.effect.execute());
      });
      
    } catch (error) {
      console.error('Error computing signal value:', error);
      this.dirty = false;
    } finally {
      // Restore previous effect context
      setCurrentEffect(prevCurrentEffect);
    }
  }

  dispose() {
    this.effect.dispose();
    this.dependencies.clear();
  }
}

// Factory functions with enhanced options
export function signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T> {
  return new Signal(initialValue, options);
}

export function computed<T>(computeFn: () => T, options?: SignalOptions<T>): Signal<T> {
  return new ComputedSignal(computeFn, options);
}

/**
 * Create a signal bound to DOM element property
 */
export function bindToElement(
  element: HTMLElement, 
  property: string, 
  sig: Signal<unknown>,
  options: { twoWay?: boolean } = {}
) {
  // Type-safe element access
  const el = element as unknown as Record<string, unknown>;
  
  // Initial sync
  el[property] = sig.value as unknown;
  
  // Element -> Signal
  if (options.twoWay && typeof el[property] !== 'undefined') {
    element.addEventListener('input', () => {
      sig.value = el[property] as unknown;
    });
  }
  
  // Signal -> Element
  sig.subscribe(() => {
    el[property] = sig.value as unknown;
  });
}

/**
 * Batch multiple signal updates
 */
export function batch(fn: () => void) {
  if (isBatching) {
    fn();
    return;
  }
  
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = false;
    flushBatch();
  }
}

/**
 * Serialize signal state for SSR
 */
export function serializeSignalState(component: unknown): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  
  // Capture all signal values from component
  const comp = component as unknown as { _signals?: Record<string, Signal<unknown>>; _computed?: Record<string, Signal<unknown>> };
  if (comp._signals) {
    for (const [key, signal] of Object.entries(comp._signals as Record<string, Signal<unknown>>)) {
      state[key] = signal.value as unknown;
    }
  }
  
  // Capture computed values
  if (comp._computed) {
    for (const [key, computed] of Object.entries(comp._computed as Record<string, Signal<unknown>>)) {
      state[key] = computed.value as unknown;
    }
  }
  
  return state;
}

/**
 * Deserialize signal state for hydration
 */
export function deserializeSignalState(root: unknown, serialized: Record<string, unknown>): void {
  if (!root || !serialized) return;
  
  // Find all signals in the component tree and update their values
  const walk = (node: unknown) => {
    const n = node as { _signals?: Record<string, Signal<unknown>>; _computed?: Record<string, Signal<unknown>>; children?: unknown[] };
    if (n._signals) {
      for (const [key, signal] of Object.entries(n._signals as Record<string, Signal<unknown>>)) {
        if (key in serialized) {
          signal.value = serialized[key] as unknown;
        }
      }
    }
    
    if (n._computed) {
      for (const [key, computed] of Object.entries(n._computed as Record<string, Signal<unknown>>)) {
        if (key in serialized) {
          computed.value = serialized[key] as unknown;
        }
      }
    }
    
    if (n.children) {
      n.children.forEach(walk);
    }
  };
  
  walk(root as unknown);
}