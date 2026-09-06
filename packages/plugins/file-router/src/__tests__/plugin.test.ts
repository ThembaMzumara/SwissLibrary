/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import { fileRouterPlugin } from '../core/plugin.js';

describe('fileRouterPlugin', () => {
  it('should create plugin with default options', () => {
    const plugin = fileRouterPlugin();
    
    expect(plugin.name).toBe('file-router');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.requiredCapabilities).toEqual(['filesystem', 'imports']);
  });

  it('should create plugin with custom options', () => {
    const options = {
      routesDir: './src/pages',
      extensions: ['.ui', '.jsx'],
      layouts: false,
      lazyLoading: false
    };
    
    const plugin = fileRouterPlugin(options);
    
    expect(plugin.name).toBe('file-router');
  });
}); 