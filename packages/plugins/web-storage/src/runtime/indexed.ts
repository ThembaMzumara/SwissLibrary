/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { KeyValueStorageAsync } from '../public/types.js'
import { isBrowser } from './env.js'

// Minimal async KV for IndexedDB namespace.
// For now, provide a zero-deps in-memory async fallback in all envs.
// Later, we can enhance with real IndexedDB (idb) in browser.
export function createIndexedStorage(): KeyValueStorageAsync {
  // Placeholder: use real IDB impl later behind feature detection
  const mem = new Map<string, string>()
  const delay = async <T>(v: T) => v

  // In browser, we still return the in-memory async impl for now.
  // Future: if (isBrowser() && 'indexedDB' in window) { /* real impl */ }
  void isBrowser

  return {
    async get(key: string) {
      return delay(mem.has(key) ? mem.get(key)! : null)
    },
    async set(key: string, value: string) {
      mem.set(key, value)
    },
    async remove(key: string) {
      mem.delete(key)
    },
    async clear() {
      mem.clear()
    },
  }
}
