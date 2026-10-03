/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { signal, computed, type Signal, type SignalOptions } from './signals.js';
import type { StoreObject, StoreUpdate } from './types/index.js';
import { batch } from './batch.js';

// Types moved to reactivity/types barrel

/**
 * Create a reactive store
 */
export function createStore<T extends StoreObject>(
  initialState: T,
  options?: {
    capabilities?: Record<keyof T, string>;
    name?: string;
  }
) {
  // Create signals for each property with precise types
  const signals = {} as { [K in keyof T]: Signal<T[K]> };
  for (const key of Object.keys(initialState) as (keyof T)[]) {
    const capability = options?.capabilities?.[key];
    signals[key] = signal(initialState[key], {
      name: options?.name ? `${options.name}.${String(key)}` : String(key),
      capability
    });
  }
  // Computed state
  const state = new Proxy({} as T, {
    get(_, prop: string | symbol) {
      return signals[prop as keyof T]?.value;
    }
  });
  // Update function
  function update(updateFn: StoreUpdate<T>) {
    batch(() => {
      const updateObj = typeof updateFn === 'function'
        ? updateFn(state)
        : updateFn;
      Object.entries(updateObj).forEach(([key, value]) => {
        if (key in signals) {
          signals[key as keyof T].value = value;
        }
      });
    });
  }
  // Watch function
  function watch<K extends keyof T>(
    key: K, 
    callback: (value: T[K], oldValue: T[K]) => void
  ) {
    return signals[key].subscribe(() => {
      callback(signals[key].value, state[key]);
    });
  }
  // Computed property
  function derive<K extends string, V>(
    name: K,
    computeFn: (state: T) => V,
    options?: SignalOptions<V>
  ) {
    const derivedSignal = computed(() => computeFn(state), {
      name: options?.name || (options?.name ? `${options.name}.${name}` : name),
      ...options
    });
    // Add to state proxy
    Object.defineProperty(state, name, {
      get() {
        return derivedSignal.value;
      },
      enumerable: true
    });
    return derivedSignal;
  }
  return {
    state,
    update,
    watch,
    derive,
    signals
  };
} 