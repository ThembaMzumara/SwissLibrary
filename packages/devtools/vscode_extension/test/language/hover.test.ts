/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position } from 'vscode-languageserver';
import { getHoverInfo } from '../../src/server/language/hover';
import { assertDefined } from '../test-helper';

describe('Hover Provider', () => {
  it('should return hover info for a tag', () => {
    const text = `<component></component>`;
    const document = TextDocument.create('file://test.ui', 'swissjs', 0, text);
    const position = Position.create(0, 2); // Position inside <component>
    const hover = getHoverInfo(document, position);
    
    assertDefined(hover, 'Hover info should be defined');
    const contents = hover.contents as { kind: string; value: string };
    assert.strictEqual(contents.kind, 'markdown', 'Hover content should be markdown');
    assert(contents.value.includes('component'), 'Hover content should contain component info');
  });
});
