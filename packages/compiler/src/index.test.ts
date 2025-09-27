/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import { UiCompiler } from './index.js';

describe('UiCompiler Decorator Transformation', () => {
  const compiler = new UiCompiler();

  const normalize = (str: string) => {
    return str
      .replace(/import\s+\{.*?\}\s+from\s+['"]@swissjs\/core['"];\s*/, '') // Remove core import
      .replace(/\s*([=,[\]{}])\s*/g, '$1') // Remove space around punctuation
      .replace(/\s+/g, ' ') // Collapse remaining whitespace
      .trim();
  }

  it('should transform @requires decorator', () => {
    const source = `
      function requires(...args: any[]) { return (target: any) => {} }
      const FilesystemAccess = 'filesystem:read';
      @requires('network:fetch', FilesystemAccess)
      export class MySecureComponent {}
    `;
    const expected = `
      function requires(...args: any[]) { return (target: any) => { }; }
      const FilesystemAccess = 'filesystem:read';
      export class MySecureComponent {
          static requires = ["network:fetch", "filesystem:read"];
      }
    `;
    const output = compiler['transformUiFile'](source, 'test-component.ts');
    expect(normalize(output)).toBe(normalize(expected));
  });

  it('should transform @provides decorator', () => {
    const source = `
      function provides(...args: any[]) { return (target: any) => {} }
      const LoggerService = 'service:logger';
      @provides('service:api', LoggerService)
      export class MyServiceProvider {}
    `;
    const expected = `
      function provides(...args: any[]) { return (target: any) => { }; }
      const LoggerService = 'service:logger';
      export class MyServiceProvider {
          static provides = ["service:api", "service:logger"];
      }
    `;
    const output = compiler['transformUiFile'](source, 'test-provider.ts');
    expect(normalize(output)).toBe(normalize(expected));
  });

  it('should transform @capability decorator', () => {
    const source = `
      function capability(...args: any[]) { return (target: any) => {} }
      const capName = 'swiss:filesystem:read';
      @capability(capName)
      export class FilesystemReader {}
    `;
    const expected = `
      function capability(...args: any[]) { return (target: any) => { }; }
      const capName = 'swiss:filesystem:read';
      export class FilesystemReader {
          static capabilityName = "swiss:filesystem:read";
      }
    `;
    const output = compiler['transformUiFile'](source, 'test-capability.ts');
    expect(normalize(output)).toBe(normalize(expected));
  });
});
