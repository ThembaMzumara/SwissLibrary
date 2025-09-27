/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Plugin } from 'vite';
import { UiCompiler } from '@swissjs/compiler';

export function swissPlugin(): Plugin {
  const compiler = new UiCompiler();

  return {
    name: 'vite-plugin-swiss',
    enforce: 'pre', // Run before other plugins to transform .ui files first
    
    async transform(code: string, id: string) {
      if (id.endsWith('.ui')) { // .ui is the Swiss template extension
        try {
          // Use the code parameter directly instead of reading from disk
          const jsCode = compiler.compile(code, id);
          return {
            code: jsCode,
            map: null // sourcemaps can be added later
          };
        } catch (e: unknown) {
          if (e instanceof Error) {
            this.error(e.message);
          } else {
            this.error(String(e));
          }
        }
      }
      return null;
    }
  };
} 