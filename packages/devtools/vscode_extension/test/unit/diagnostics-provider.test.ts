/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as assert from 'assert';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateDocument } from '../../src/server/language/diagnostics';
import { loadTestDocument } from '../helpers/load-test-document';

const createTestDocument = (content: string): TextDocument => {
  return TextDocument.create(
    'file:///test.ui',
    'swissjs',
    0,
    content
  );
};

describe('Diagnostics Provider', () => {
  it('should validate document structure', () => {
    const doc = loadTestDocument('sample.ui');
    const diagnostics = validateDocument(doc);
    
    assert.ok(Array.isArray(diagnostics), 'Should return an array of diagnostics');
  });

  it('should report unknown tags', () => {
    const doc = createTestDocument('<unknownTag></unknownTag>');
    const diagnostics = validateDocument(doc);
    
    const hasUnknownTagError = diagnostics.some(d => 
      d.message.includes('Unknown tag') && d.severity === DiagnosticSeverity.Error
    );
    
    assert.ok(hasUnknownTagError, 'Should report unknown tag error');
  });

  it('should report invalid attributes', () => {
    const doc = createTestDocument('<component invalid-attr></component>');
    const diagnostics = validateDocument(doc);
    
    const hasInvalidAttrError = diagnostics.some(d => 
      d.message.includes('Invalid attribute') && d.severity === DiagnosticSeverity.Warning
    );
    
    assert.ok(hasInvalidAttrError, 'Should report invalid attribute warning');
  });
});
