/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
        injected: resolve(__dirname, 'src/injected.ts'),
        panel: resolve(__dirname, 'src/panel.ts'),
        devtools: resolve(__dirname, 'devtools.html')
      },
      output: {
        entryFileNames: (chunk) => {
          // ensure top-level files for MV3
          return `${chunk.name}.js`
        },
        assetFileNames: (asset) => {
          if (asset.name && asset.name.endsWith('.html')) return '[name][extname]'
          return 'assets/[name][extname]'
        }
      }
    }
  }
})
