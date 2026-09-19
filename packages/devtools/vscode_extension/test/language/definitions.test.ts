/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position } from 'vscode-languageserver';
import { findDefinition } from '../../src/server/language/definitions';
import { assertDefined } from '../test-helper';

describe('Definition Provider', () => {
  it('should return a definition location for a tag', () => {
    const text = `<component></component>`;
    const document = TextDocument.create('file://test.ui', 'swissjs', 0, text);
    const position = Position.create(0, 2); // Position inside <component>
    const definition = findDefinition(document, position);
    
    assertDefined(definition, 'Definition should be defined');
    if (Array.isArray(definition)) {
      assert(definition.length > 0, 'Definition array should not be empty');
      assert.strictEqual(definition[0].uri, document.uri, 'Definition URI should match document URI');
    } else {
      assert.strictEqual(definition.uri, document.uri, 'Definition URI should match document URI');
    }
  });
});
