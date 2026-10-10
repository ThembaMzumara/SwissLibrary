/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { strict as assert } from 'assert';
import { DocumentSymbol } from 'vscode-languageserver/node';
import { getDocumentSymbols } from '../../src/server/language/symbols';
import { loadTestDocument } from '../helpers/load-test-document';

function collectNames(symbols: readonly DocumentSymbol[], acc: string[] = [], prefix = ''): string[] {
  for (const s of symbols) {
    acc.push(prefix + s.name);
    if (s.children && s.children.length) collectNames(s.children, acc, prefix + s.name + '/');
  }
  return acc;
}

describe('Document Symbols (hierarchical)', () => {
  it('returns a nested symbol tree for tags', () => {
    const doc = loadTestDocument('sample.ui');
    const symbols = getDocumentSymbols(doc);
    assert.ok(Array.isArray(symbols), 'Should return an array');
    assert.ok(symbols.length > 0, 'Should return at least one symbol');

    const names = collectNames(symbols);
    // Expect top-level component and nested div
    assert.ok(names.some(n => n.startsWith('component')), 'Should include component');
    assert.ok(names.some(n => n.includes('component/div')), 'Should include nested div under component');
  });
});
