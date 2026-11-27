/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { SwissComponent } from '../component/component.js';
import { Signal } from './signals.js';
import type { TrackedEffect } from './types/index.js';

const contextMap = new Map<symbol, unknown>();

// Global context for tracking current effect
const currentEffect: TrackedEffect | null = null;

// Batch processing state
let inBatch = false;
const pendingSignals = new Set<Signal<unknown>>();

// Security context for capability checks
let securityContext: string[] = [];

/**
 * Run a function with security context
 */
export function withSecurityContext<T>(capabilities: string[], fn: () => T): T {
  const prevContext = securityContext;
  securityContext = [...prevContext, ...capabilities];
  try {
    return fn();
  } finally {
    securityContext = prevContext;
  }
}

/**
 * Check if current context has required capabilities
 */
export function hasCapability(capability: string): boolean {
  return securityContext.includes(capability);
}

/**
 * Start a batch update
 */
export function startBatch() {
  inBatch = true;
}

/**
 * End batch update and process changes
 */
export function endBatch() {
  if (!inBatch) return;
  
  inBatch = false;
  
  // Process all pending signals
  const signalsToProcess = new Set(pendingSignals);
  pendingSignals.clear();
  
  signalsToProcess.forEach(signal => {
    signal.notify();
  });
}

/**
 * Add signal to pending batch updates
 */
export function addToBatch(signal: Signal<unknown>) {
  if (inBatch) {
    pendingSignals.add(signal);
  } else {
    signal.notify();
  }
}

export { currentEffect };

export function createContext<T>(defaultValue: T) {
  const key = Symbol('context');
  return {
    Provider: (value: T) => {
      contextMap.set(key, value);
    },
    Consumer: () => {
      return contextMap.get(key) ?? defaultValue;
    },
    key
  };
}

export function provide<T>(context: { id: symbol }, value: T, _component: SwissComponent) {
  void _component;
  let map = contextMap.get(context.id) as Map<string, unknown> | undefined;
  if (!map) {
    map = new Map<string, unknown>();
    contextMap.set(context.id, map);
  }
  map.set(context.id.toString(), value as unknown);
}

export function consume<T>(context: { id: symbol; defaultValue: T | null }, _component: SwissComponent): T | null {
  void _component;
  const map = contextMap.get(context.id) as Map<string, unknown> | undefined;
  const contextValue = map?.get(context.id.toString());
  if (contextValue !== undefined) {
    return contextValue as T;
  }
  return context.defaultValue;
}
