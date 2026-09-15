/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { componentTemplateStyleTransformer } from '../src/transformers/component-decorators';
import { pluginServiceTransformer } from '../src/transformers/plugin-service-decorators';
import { lifecycleRenderTransformer } from '../src/transformers/lifecycle-render-decorators';
import { capabilityTransformer } from '../src/transformers/capability-annot';
import { providesTransformer } from '../src/transformers/provides-annot';
import { capabilityDefTransformer } from '../src/transformers/capability-def-annot';

function transformTSX(code: string): string {
  const sf = ts.createSourceFile('test.ui.tsx', code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  const result = ts.transform(sf, [
    componentTemplateStyleTransformer(),
    pluginServiceTransformer(),
    lifecycleRenderTransformer(),
    capabilityTransformer(),
    providesTransformer(),
    capabilityDefTransformer(),
  ]);
  const out = ts.createPrinter().printFile(result.transformed[0] as ts.SourceFile);
  result.dispose();
  return out;
}

describe('TSX + decorators integration', () => {
  it('transforms a TSX component with decorators', () => {
    const code = `
      import { SwissComponent } from '@swissjs/core';
      import { component, onMount, provides, requires } from '@swissjs/core';

      @component({ tag: 'app-card' })
      @provides('ui:card')
      @requires('ui:toast', { strict: false })
      class Card extends SwissComponent<{ initial?: number }> {
        private count = 0;

        @onMount()
        mount() { this.count = 1; }

        render() {
          return (
            <div className="card">
              <h3 className="title">Hello</h3>
              <button onClick={() => (this.count++, this.render())}>
                Clicked {this.count}
              </button>
            </div>
          );
        }
      }
    `;

    const out = transformTSX(code);

    // Decorator calls should be emitted after the class
    expect(out).toContain("component({ tag: 'app-card' })(Card)");
    expect(out).toContain("provides('ui:card')(Card)");
    expect(out).toContain("requires('ui:toast', { strict: false })(Card)");
    expect(out).toContain("onMount()(Card.prototype, \"mount\"");

    // Original decorator syntax should be removed
    expect(out).not.toContain('@component');
    expect(out).not.toContain('@onMount');

    // TSX should remain as function calls after printer; at least ensure class is preserved
    expect(out).toContain('class Card');
  });
});
