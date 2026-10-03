/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@swissjs\/core$/, replacement: resolve(__dirname, '../../core/dist/index.mjs') },
      { find: /^@swissjs\/core\/(.*)$/, replacement: resolve(__dirname, '../../core/dist') + '/$1' },
    ],
  },
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    environment: 'node',
  },
})
