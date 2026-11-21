/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { pluginServiceTransformer } from '../src/transformers/plugin-service-decorators';

function transform(code: string): string {
  const sf = ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);
  const result = ts.transform(sf, [pluginServiceTransformer()]);
  const out = ts.createPrinter().printFile(result.transformed[0] as ts.SourceFile);
  result.dispose();
  return out;
}

describe('pluginServiceTransformer', () => {
  it('emits registration for @plugin on class', () => {
    const code = `
      @plugin('router')
      class Foo {}
    `;
    const out = transform(code);
    expect(out).toContain("plugin('router')(Foo)");
    expect(out).not.toContain('@plugin');
    expect(out).toContain('class Foo');
  });

  it('emits registration for @service on property', () => {
    const code = `
      class Foo {
        @service('http') client: any;
      }
    `;
    const out = transform(code);
    expect(out).toContain("service('http')(Foo.prototype, \"client\")");
    expect(out).not.toContain('@service');
  });

  it('preserves unrelated decorators and members', () => {
    const code = `
      function dec(): any { return () => {}; }
      @plugin('state')
      class Bar {
        @dec()
        method() {}

        @service('storage') store: any;
      }
    `;
    const out = transform(code);
    expect(out).toContain('class Bar');
    expect(out).toContain('dec()');
    expect(out).toContain("plugin('state')(Bar)");
    expect(out).toContain("service('storage')(Bar.prototype, \"store\")");
  });

  it('supports identifier for plugin name and options literal', () => {
    const code = `
      const P = 'analytics';
      @plugin(P, { singleton: true })
      class Baz {}
    `;
    const out = transform(code);
    // Identifier P should be preserved as-is in the emitted call
    expect(out).toContain('plugin(P, { singleton: true })(Baz)');
    expect(out).not.toContain('@plugin');
  });

  it('supports identifier for service name and options identifier', () => {
    const code = `
      const S = 'i18n';
      const opts = { lazy: true };
      class Qux {
        @service(S, opts) t: any;
      }
    `;
    const out = transform(code);
    expect(out).toContain('service(S, opts)(Qux.prototype, "t")');
    expect(out).not.toContain('@service');
  });
});
