/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Plugin } from '@swissjs/core'
import { STORAGE_LOCAL, STORAGE_SESSION, STORAGE_INDEXED } from './public/services.js'
import { createLocalStorage } from './runtime/local.js'
import { createSessionStorage } from './runtime/session.js'
import { createIndexedStorage } from './runtime/indexed.js'

export const WebStoragePlugin: Plugin = {
  name: '@swissjs/plugin-web-storage',
  version: '0.1.0',
  requiredCapabilities: [],
  init() {
    // Placeholder for capability registration or hooks
  },
  providesService(name: string) {
    return name === STORAGE_LOCAL || name === STORAGE_SESSION || name === STORAGE_INDEXED
  },
  getService<T>(name: string): T {
    switch (name) {
      case STORAGE_LOCAL:
        return createLocalStorage() as unknown as T
      case STORAGE_SESSION:
        return createSessionStorage() as unknown as T
      case STORAGE_INDEXED:
        return createIndexedStorage() as unknown as T
      default:
        throw new Error(`Unknown service: ${name}`)
    }
  },
}

