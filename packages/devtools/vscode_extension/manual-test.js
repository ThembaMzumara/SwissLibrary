/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const { TextDocument } = require('vscode-languageserver-textdocument');
const { Position } = require('vscode-languageserver');

// Simple test to verify our completions function works
function testCompletions() {
  console.log('=== Manual Completions Testing ===');
  
  // Create a simple test document
  const testContent = '<div>\n  <button \n    class="btn"\n    id="myButton"\n  >\n    Click me\n  </button>\n</div>';
  const doc = TextDocument.create('test://test.ui', 'swissjs', 1, testContent);
  
  console.log('Test document content:');
  console.log(testContent);
  console.log('\nTesting positions:');
  
  // Test 1: Tag name completion at position (0, 1) - should be inside <d|iv>
  console.log('\n1. Testing tag name completion at (0, 1):');
  const pos1 = Position.create(0, 1);
  const textUntilPos1 = testContent.substring(0, doc.offsetAt(pos1));
  console.log(`Text until position: "${textUntilPos1}"`);
  console.log(`Character at position: "${testContent[doc.offsetAt(pos1)]}"`);
  
  // Test 2: Attribute completion at position (1, 9) - should be after <button |
  console.log('\n2. Testing attribute completion at (1, 9):');
  const pos2 = Position.create(1, 9);
  const textUntilPos2 = testContent.substring(0, doc.offsetAt(pos2));
  console.log(`Text until position: "${textUntilPos2}"`);
  console.log(`Character at position: "${testContent[doc.offsetAt(pos2)]}"`);
  
  // Test 3: Attribute value completion at position (2, 16) - should be inside class="b|tn"
  console.log('\n3. Testing attribute value completion at (2, 16):');
  const pos3 = Position.create(2, 16);
  const textUntilPos3 = testContent.substring(0, doc.offsetAt(pos3));
  console.log(`Text until position: "${textUntilPos3}"`);
  console.log(`Character at position: "${testContent[doc.offsetAt(pos3)]}"`);
  
  // Test regex patterns
  console.log('\n=== Testing Regex Patterns ===');
  const patterns = {
    isInTagName: /<[a-zA-Z-]*$/,
    isInAttribute: /<[^>]*\s+[^=>\s]*$/,
    isInAttributeValue: /<[^>]*\s+[a-zA-Z0-9-:]+\s*=\s*["'][^"']*$/
  };
  
  [textUntilPos1, textUntilPos2, textUntilPos3].forEach((text, i) => {
    console.log(`\nPosition ${i + 1} text: "${text}"`);
    Object.entries(patterns).forEach(([name, pattern]) => {
      console.log(`  ${name}: ${pattern.test(text)}`);
    });
  });
}

testCompletions();
