/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Listener, PropertyKey, ReactiveObject } from './types/index.js';
export type { EffectDisposer } from './types/index.js';

/**
 * Create a reactive object that notifies listeners when properties change
 */
export function reactive<T extends object>(target: T): T {
  const reactiveObj = target as ReactiveObject;
  
  // Initialize listener maps if they don't exist
  if (!reactiveObj.__listeners) {
    Object.defineProperty(reactiveObj, '__listeners', {
      value: new Map<PropertyKey, Set<Listener>>(),
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  
  if (!reactiveObj.__globalListeners) {
    Object.defineProperty(reactiveObj, '__globalListeners', {
      value: new Set<Listener>(),
      writable: false,
      enumerable: false,
      configurable: false
    });
  }

  return new Proxy(target, {
    get(obj: T, prop: PropertyKey) {
      // Return the actual value
      return (obj as unknown as Record<PropertyKey, unknown>)[prop];
    },

    set(obj: T, prop: PropertyKey, value: unknown) {
      const record = obj as unknown as Record<PropertyKey, unknown>;
      const oldValue = record[prop];
      
      // Set the new value
      record[prop] = value;
      
      // Notify listeners only if value actually changed
      if (oldValue !== value) {
        notifyListeners(obj as unknown as ReactiveObject, prop);
      }
      
      return true;
    }
  });
}

/**
 * Watch for changes on a specific property
 */
export function watch<T extends object>(
  obj: T, 
  property: keyof T, 
  callback: (newValue: unknown, oldValue: unknown) => void
): () => void {
  const reactiveObj = obj as ReactiveObject;
  
  if (!reactiveObj.__listeners) {
    throw new Error('Object is not reactive. Use reactive() first.');
  }

  const prop = property as PropertyKey;
  
  if (!reactiveObj.__listeners.has(prop)) {
    reactiveObj.__listeners.set(prop, new Set());
  }

  const currentValue = reactiveObj[prop];
  
  const listener = () => {
    const newValue = reactiveObj[prop];
    callback(newValue, currentValue);
  };

  reactiveObj.__listeners.get(prop)!.add(listener);

  // Return unsubscribe function
  return () => {
    reactiveObj.__listeners?.get(prop)?.delete(listener);
  };
}

/**
 * Watch for any changes on the object
 */
export function watchAll<T extends object>(
  obj: T, 
  callback: () => void
): () => void {
  const reactiveObj = obj as ReactiveObject;
  
  if (!reactiveObj.__globalListeners) {
    throw new Error('Object is not reactive. Use reactive() first.');
  }

  reactiveObj.__globalListeners.add(callback);

  // Return unsubscribe function
  return () => {
    reactiveObj.__globalListeners?.delete(callback);
  };
}

/**
 * Create a computed property that updates when dependencies change
 */
export function computed<T>(fn: () => T): { value: T } {
  let value = fn();
  let isStale = false;
  
  const computedRef = {
    get value() {
      if (isStale) {
        value = fn();
        isStale = false;
      }
      return value;
    }
  };

  // This is a simplified version - in a full implementation,
  // we'd track dependencies automatically
  return computedRef;
}

/**
 * Notify all listeners for a property change
 */
function notifyListeners(obj: ReactiveObject, property: PropertyKey): void {
  // Notify property-specific listeners
  const propertyListeners = obj.__listeners?.get(property);
  if (propertyListeners) {
    propertyListeners.forEach(listener => listener());
  }

  // Notify global listeners
  if (obj.__globalListeners) {
    obj.__globalListeners.forEach(listener => listener());
  }
}

/**
 * Effect function that runs when reactive dependencies change
 */
export function effect(fn: () => void): () => void {
  // This is a simplified version
  // In a full implementation, we'd track which reactive objects
  // are accessed during the function execution
  fn();
  
  // Return cleanup function
  return () => {
    // Cleanup logic would go here
  };
}