/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateDocument } from '../../src/server/language/diagnostics';

describe('Diagnostics Provider', () => {
  it('should report unknown tags', () => {
    const text = `<unknownTag></unknownTag>`;
    const document = TextDocument.create('file://test.ui', 'swissjs', 0, text);
    const diagnostics = validateDocument(document);
    
    assert.strictEqual(diagnostics.length > 0, true, 'Should report at least one diagnostic');
    assert(
      diagnostics.some(d => d.message.includes('Unknown tag')),
      'Should report unknown tag error'
    );
  });

  it('should report invalid attributes', () => {
    const text = `<component invalid attr></component>`;
    const document = TextDocument.create('file://test.ui', 'swissjs', 0, text);
    const diagnostics = validateDocument(document);
    
    assert(
      diagnostics.some(d => d.message.includes('Invalid attribute')),
      'Should report invalid attribute error'
    );
  });
});
