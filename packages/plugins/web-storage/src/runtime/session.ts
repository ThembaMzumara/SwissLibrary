/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { isBrowser } from './env.js'
import type { KeyValueStorageSync } from '../public/types.js'

export function createSessionStorage(): KeyValueStorageSync {
  if (isBrowser() && typeof window.sessionStorage !== 'undefined') {
    const s = window.sessionStorage
    return {
      get: (k) => s.getItem(k),
      set: (k, v) => s.setItem(k, v),
      remove: (k) => s.removeItem(k),
      clear: () => s.clear(),
    }
  }
  // Fallback in non-browser environments
  const mem = new Map<string, string>()
  return {
    get: (k) => (mem.has(k) ? mem.get(k)! : null),
    set: (k, v) => { mem.set(k, v) },
    remove: (k) => { mem.delete(k) },
    clear: () => { mem.clear() },
  }
}
