/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as assert from 'assert';
import { findDefinition } from '../../src/server/language/definitions';
import { loadTestDocument } from '../helpers/load-test-document';

describe('Definition Provider', () => {
  it('should find definition for component tags', () => {
    const doc = loadTestDocument('sample.ui');
    const text = doc.getText();
    const idx = text.indexOf('<component');
    if (idx < 0) throw new Error('fixture missing <component');
    const position = doc.positionAt(idx + 2); // inside tag name
    const definition = findDefinition(doc, position);
    
    assert.ok(definition, 'Definition should be found for component tag');
    
    if (Array.isArray(definition)) {
      assert.ok(definition.length > 0, 'Definition array should not be empty');
      assert.strictEqual(definition[0].uri, doc.uri, 'Definition URI should match document URI');
    } else {
      assert.strictEqual(definition.uri, doc.uri, 'Definition URI should match document URI');
    }
  });

  it('should find definition for HTML elements', () => {
    const doc = loadTestDocument('sample.ui');
    const text = doc.getText();
    const idx = text.indexOf('<div');
    if (idx < 0) throw new Error('fixture missing <div');
    const position = doc.positionAt(idx + 2); // inside tag name
    const definition = findDefinition(doc, position);
    
    assert.ok(definition, 'Definition should be found for HTML element');
    
    if (Array.isArray(definition)) {
      assert.ok(definition.length > 0, 'Definition array should not be empty');
    }
  });
});
