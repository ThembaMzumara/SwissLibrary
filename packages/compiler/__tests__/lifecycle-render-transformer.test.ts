/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { lifecycleRenderTransformer } from '../src/transformers/lifecycle-render-decorators';

function transform(code: string): string {
  const sf = ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);
  const result = ts.transform(sf, [lifecycleRenderTransformer()]);
  const out = ts.createPrinter().printFile(result.transformed[0] as ts.SourceFile);
  result.dispose();
  return out;
}

describe('lifecycleRenderTransformer', () => {
  it('emits registrations for lifecycle and render decorators', () => {
    const code = `
      class Foo {
        @onMount()
        m1() {}
        
        @onUpdate({ throttle: 10 })
        m2() {}
        
        @render()
        view() {}
      }
    `;
    const out = transform(code);
    expect(out).toContain("onMount()(Foo.prototype, \"m1\"");
    expect(out).toContain("onUpdate({ throttle: 10 })(Foo.prototype, \"m2\"");
    expect(out).toContain("render()(Foo.prototype, \"view\"");
    // original decorators removed
    expect(out).not.toContain('@onMount');
    expect(out).not.toContain('@onUpdate');
    expect(out).not.toContain('@render');
  });

  it('emits registrations for bind and computed', () => {
    const code = `
      class Foo {
        @bind('value')
        field: string = '';

        private _x = 1;
        @computed({ cache: true })
        get x() { return this._x; }
      }
    `;
    const out = transform(code);
    expect(out).toContain("bind('value')(Foo.prototype, \"field\"");
    expect(out).toContain("computed({ cache: true })(Foo.prototype, \"x\"");
    expect(out).not.toContain('@bind');
    expect(out).not.toContain('@computed');
  });

  it('throws on invalid placement for render (not a method)', () => {
    const code = `
      class Foo {
        @render()
        val: number = 1;
      }
    `;
    expect(() => transform(code)).toThrow(/LC1001/);
  });

  it('throws on invalid placement for lifecycle (not a method)', () => {
    const code = `
      class Foo {
        @onMount()
        val: number = 1;
      }
    `;
    expect(() => transform(code)).toThrow(/LC1003/);
  });

  it('throws on invalid placement for computed (not accessor or method)', () => {
    const code = `
      class Foo {
        @computed()
        val: number = 1;
      }
    `;
    expect(() => transform(code)).toThrow(/LC1002/);
  });

  it('supports multiple decorators across members and preserves class', () => {
    const code = `
      class Foo {
        @onMount() m1() {}
        @render({ immediate: true }) view() {}
        @bind('y') y = '';
      }
    `;
    const out = transform(code);
    expect(out).toContain('class Foo');
    expect(out.indexOf('class Foo')).toBeLessThan(out.indexOf('onMount()'));
    expect(out).toContain('render({ immediate: true })(Foo.prototype, "view"');
    expect(out).toContain('bind(\'y\')(Foo.prototype, "y"');
  });
});
