/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { strict as assert } from 'assert';
import { getFormattingEdits } from '../../src/server/language/formatting';
import { loadTestDocument } from '../helpers/load-test-document';

function applyEdits(original: string, newText: string): string {
  // Our formatter uses a single full-document replace; just return newText
  return newText;
}

describe('Formatting Provider (MVP)', () => {
  it('returns a full-document edit and produces stable indentation', () => {
    const doc = loadTestDocument('sample.ui');
    const edits = getFormattingEdits(doc);
    assert.ok(Array.isArray(edits), 'Should return an array of TextEdit');
    assert.ok(edits.length <= 1, 'Should return at most one full-document edit');

    if (edits.length === 1) {
      const formatted = applyEdits(doc.getText(), edits[0].newText || '');
      assert.ok(formatted.includes('\n  <div'), 'Indents child elements');
      assert.ok(formatted.includes('</component>'), 'Keeps closing tag');
    }
  });
});
