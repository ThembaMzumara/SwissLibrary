/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Route cache for performance optimization
 */
export class RouteCache<TValue = unknown> {
  private cache = new Map<string, TValue>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get cached route
   */
  get(key: string): TValue | undefined {
    return this.cache.get(key);
  }

  /**
   * Set cached route
   */
  set(key: string, value: TValue): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Create a new route cache
 */
export function createRouteCache<TValue = unknown>(maxSize: number = 100): RouteCache<TValue> {
  return new RouteCache<TValue>(maxSize);
}