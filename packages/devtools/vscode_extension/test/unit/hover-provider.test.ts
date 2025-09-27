/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { strict as assert } from 'assert';
import { Position } from 'vscode-languageserver';
import { getHoverInfo } from '../../src/server/language/hover';
import { loadTestDocument } from '../helpers/load-test-document';

describe('Hover Provider', () => {
  it('should provide hover information for component tags', () => {
    const doc = loadTestDocument('sample.ui');
    const position = Position.create(0, 2); // Position inside <component>
    const hover = getHoverInfo(doc, position);
    
    assert.ok(hover, 'Hover info should be returned');
    const contents = hover.contents as { kind: string; value: string };
    assert.strictEqual(contents.kind, 'markdown', 'Hover content should be markdown');
    assert.ok(contents.value.includes('component'), 'Hover content should contain component info');
  });

  it('should provide hover information for HTML elements', () => {
    const doc = loadTestDocument('sample.ui');
    const position = Position.create(1, 3); // Position inside <div>
    const hover = getHoverInfo(doc, position);
    
    assert.ok(hover, 'Hover info should be returned for HTML elements');
    const contents = hover.contents as { kind: string; value: string };
    assert.ok(contents.value.includes('div'), 'Hover content should contain div info');
  });
});
