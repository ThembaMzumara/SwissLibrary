/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

type Mergeable = Record<string, unknown> | unknown[];

/**
 * Deep merge utility with type safety and conflict resolution
 * @param target - Target object to merge into
 * @param sources - Source objects to merge from
 * @param options - Merge configuration options
 * @returns Merged object
 */
export function deepMerge<T extends Mergeable>(
  target: T,
  ...sources: Partial<T>[]
): T {
  return sources.reduce((acc, source) => {
        return mergeObjects(acc, source) as Partial<T>;
  }, target) as T;
}

function mergeObjects(target: unknown, source: unknown): unknown {
  if (source === null || source === undefined) return target;
  // Handle arrays
  if (Array.isArray(target) && Array.isArray(source)) {
    return mergeArrays(target, source);
  }
  // Handle objects
  if (isObject(target) && isObject(source)) {
    return mergePlainObjects(target, source);
  }
  // Handle special types
    if (source instanceof Set && target instanceof Set) {
    return new Set([...target, ...source]);
  }
    if (source instanceof Map && target instanceof Map) {
    return new Map([...target, ...source]);
  }
  if (source instanceof Date) {
    return new Date(source);
  }
  // Primitive values
  return source;
}

function mergeArrays(target: unknown[], source: unknown[]): unknown[] {
  // Merge array strategies:
  // 1. Replace: return [...source]
  // 2. Append: return [...target, ...source]
  // 3. Index-based merge (default)
  return source.map((item, index) => {
    if (index < target.length) {
      return mergeObjects(target[index], item);
    }
    return item;
  });
}

function mergePlainObjects(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...target };
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor') {
      continue; // Security: Skip prototype pollution
    }
    if (key in target) {
      merged[key] = mergeObjects(target[key], source[key]);
    } else {
      merged[key] = source[key];
    }
  }
  return merged;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return !!(value && typeof value === 'object' && !Array.isArray(value));
}

/**
 * Capability-aware deep merge for security contexts
 * @param target - Target capability set
 * @param source - Source capability set
 * @returns Merged capabilities with conflict resolution
 */
export function mergeCapabilities(
  target: Set<string>,
  source: Set<string>
): Set<string> {
  // Apply security rules: Never add higher privileges
  const merged = new Set(target);
  for (const capability of source) {
    if (!capability.startsWith('sudo:')) {
      merged.add(capability);
    }
  }
  return merged;
}

/**
 * Type-safe deep merge with schema validation
 * @param target - Target object
 * @param source - Source object
 * @param schema - Validation schema
 * @returns Merged and validated object
 */
export function safeDeepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
  schema?: Record<string, (value: unknown) => boolean>
): T {
  const merged = deepMerge({ ...target }, source);
  if (schema) {
    for (const key in merged) {
      if (schema[key] && !schema[key](merged[key])) {
        throw new Error(`Validation failed for property: ${key}`);
      }
    }
  }
  return merged;
} 