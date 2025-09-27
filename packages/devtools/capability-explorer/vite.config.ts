/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { defineConfig } from 'vite';
import { swissPlugin } from '@swissjs/vite-plugin-swiss';
import { resolve } from 'path';

export default defineConfig({
  plugins: [swissPlugin()],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ui'),
      name: 'CapabilityExplorer',
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['@swissjs/core'],
      output: {
        globals: {
          '@swissjs/core': 'SwissJS'
        }
      }
    }
  },
  server: {
    port: 3001,
    host: true
  }
});
