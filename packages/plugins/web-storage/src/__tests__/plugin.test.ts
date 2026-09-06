/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest'
import { WebStoragePlugin } from '../plugin.js'
import { STORAGE_LOCAL, STORAGE_SESSION, STORAGE_INDEXED } from '../public/services.js'

// Tests aligned with file-router style

describe('@swissjs/plugin-web-storage', () => {
  it('exposes plugin metadata and services like other plugins', () => {
    expect(WebStoragePlugin.name).toBe('@swissjs/plugin-web-storage')
    expect(typeof WebStoragePlugin.version).toBe('string')
    expect(Array.isArray(WebStoragePlugin.requiredCapabilities)).toBe(true)

    expect(WebStoragePlugin.providesService?.(STORAGE_LOCAL)).toBe(true)
    expect(WebStoragePlugin.providesService?.(STORAGE_SESSION)).toBe(true)
    expect(WebStoragePlugin.providesService?.(STORAGE_INDEXED)).toBe(true)

    const local = WebStoragePlugin.getService?.(STORAGE_LOCAL) as {
      get: (k: string) => string | null
      set: (k: string, v: string) => void
      remove: (k: string) => void
      clear: () => void
    }
    expect(local).toBeTruthy()
    local.set('k', 'v')
    expect(local.get('k')).toBe('v')
    local.remove('k')
    expect(local.get('k')).toBeNull()
  })
})
