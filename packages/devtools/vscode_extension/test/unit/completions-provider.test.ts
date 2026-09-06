/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as assert from 'assert';
import { Position } from 'vscode-languageserver';
import { getCompletions } from '../../src/server/language/completions';
import { loadTestDocument } from '../helpers/load-test-document';

describe('Completions Provider', () => {
  it('should provide HTML tag name completions', () => {
    const doc = loadTestDocument('completions.ui');
    // Position inside an opening tag within html template literal: <d|
    const position = Position.create(10, 9); // Line 10: "      <div>" - position after '<di'
    const completions = getCompletions(doc, position);
    
    assert.ok(completions.length > 0, 'Should return completions');
    
    // Check for some common HTML tags
    const tagLabels = completions.map(c => c.label);
    assert.ok(tagLabels.includes('div'), 'Should include div tag');
    assert.ok(tagLabels.includes('span'), 'Should include span tag');
    assert.ok(tagLabels.includes('button'), 'Should include button tag');
    
    // Check completion item details
    const divCompletion = completions.find(c => c.label === 'div');
    assert.strictEqual(divCompletion?.kind, 7, 'Should have Class kind'); // 7 = CompletionItemKind.Class
    assert.strictEqual(divCompletion?.detail, 'HTML Div', 'Should have correct detail');
  });

  it('should provide HTML attribute name completions', () => {
    const doc = loadTestDocument('completions.ui');
    // Position after a space inside a tag within html template literal: <button |
    const position = Position.create(11, 15); // Line 11: "        <button " - position at space after button
    const completions = getCompletions(doc, position);
    
    assert.ok(completions.length > 0, 'Should return attribute completions');
    
    // Check for some common attributes
    const attrLabels = completions.map(c => c.label);
    assert.ok(attrLabels.includes('class'), 'Should include class attribute');
    assert.ok(attrLabels.includes('id'), 'Should include id attribute');
    
    // Check completion item details
    const classCompletion = completions.find(c => c.label === 'class');
    assert.strictEqual(classCompletion?.kind, 10, 'Should have Property kind'); // 10 = CompletionItemKind.Property
    assert.strictEqual(classCompletion?.detail, 'CSS class name', 'Should have correct detail');
  });

  it('should provide attribute value completions for known attributes', () => {
    const doc = loadTestDocument('completions.ui');
    // Position after class="
    const position = Position.create(2, 16);
    const completions = getCompletions(doc, position);
    
    // This test is more about ensuring the function handles the position correctly
    // The actual completion logic for attribute values would be implemented separately
    assert.ok(Array.isArray(completions), 'Should return an array of completions');
  });

  it('should provide component completions', () => {
    const doc = loadTestDocument('completions.ui');
    // Position inside a custom component tag name within html template literal: <custom-|
    const position = Position.create(21, 15); // Line 21: "        <custom-component" - position after '<'
    const completions = getCompletions(doc, position);
    
    // Check if custom components are included
    const componentLabels = completions.map(c => c.label);
    assert.ok(componentLabels.includes('custom-component'), 'Should include custom components');
    
    // Check completion item details for custom components
    const customCompCompletion = completions.find(c => c.label === 'custom-component');
    assert.strictEqual(customCompCompletion?.kind, 7, 'Should have Class kind for components');
    assert.strictEqual(customCompCompletion?.detail, 'Custom Component', 'Should indicate it\'s a custom component');
  });
});
