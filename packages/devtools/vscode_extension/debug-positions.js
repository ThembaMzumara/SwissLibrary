/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const fs = require('fs');

// Load the test fixture
const content = fs.readFileSync('./test/fixtures/completions.ui', 'utf8');
const lines = content.split('\n');

console.log('=== ANALYZING TEST POSITIONS ===');

// Calculate line start offsets
let offset = 0;
const lineOffsets = [];
for (let i = 0; i < lines.length; i++) {
  lineOffsets[i] = offset;
  offset += lines[i].length + 1; // +1 for newline
}

// Test position 1: Line 10, position 7 (0-based: line 9, pos 7)
const line10Offset = lineOffsets[9] + 7;
console.log('Test 1 - Line 10, pos 7:');
console.log('  Line content:', JSON.stringify(lines[9]));
console.log('  Character at pos 7:', JSON.stringify(lines[9][7]));
console.log('  Text before pos 7:', JSON.stringify(lines[9].substring(0, 7)));
console.log('  Absolute offset:', line10Offset);

// Test position 2: Line 11, position 15 (0-based: line 10, pos 15)
const line11Offset = lineOffsets[10] + 15;
console.log('\nTest 2 - Line 11, pos 15:');
console.log('  Line content:', JSON.stringify(lines[10]));
console.log('  Line length:', lines[10].length);
if (lines[10].length > 15) {
  console.log('  Character at pos 15:', JSON.stringify(lines[10][15]));
  console.log('  Text before pos 15:', JSON.stringify(lines[10].substring(0, 15)));
} else {
  console.log('  Position 15 is beyond line end!');
}
console.log('  Absolute offset:', line11Offset);

// Find html template literal boundaries
const htmlMatch = content.match(/html`([^`]*)`/s);
if (htmlMatch) {
  const htmlStart = htmlMatch.index + 5; // Skip 'html`'
  const htmlEnd = htmlStart + htmlMatch[1].length;
  console.log('\nHTML template literal:');
  console.log('  Start offset:', htmlStart);
  console.log('  End offset:', htmlEnd);
  console.log('  Content preview:', JSON.stringify(htmlMatch[1].substring(0, 50)));
  console.log('  Test 1 in HTML?', line10Offset >= htmlStart && line10Offset <= htmlEnd);
  console.log('  Test 2 in HTML?', line11Offset >= htmlStart && line11Offset <= htmlEnd);
  
  if (line10Offset >= htmlStart && line10Offset <= htmlEnd) {
    const relativeOffset1 = line10Offset - htmlStart;
    console.log('  Test 1 relative offset in HTML:', relativeOffset1);
    console.log('  HTML text before test 1:', JSON.stringify(htmlMatch[1].substring(0, relativeOffset1)));
  }
  
  if (line11Offset >= htmlStart && line11Offset <= htmlEnd) {
    const relativeOffset2 = line11Offset - htmlStart;
    console.log('  Test 2 relative offset in HTML:', relativeOffset2);
    console.log('  HTML text before test 2:', JSON.stringify(htmlMatch[1].substring(0, relativeOffset2)));
  }
}

console.log('\n=== CONTEXT DETECTION TESTS ===');
// Test our updated regex patterns
const tagNameRegex = /<[a-zA-Z-]*$/;
const attributeRegex = /<[a-zA-Z][a-zA-Z0-9-]*\s+$/;
const attributeValueRegex = /<[^>]*\s+[a-zA-Z0-9-:]+\s*=\s*["'][^"']*$/;

// Test with HTML content (relative positions)
if (htmlMatch) {
  const htmlContent = htmlMatch[1];
  
  // Test 1: relative offset 8 in HTML content
  const htmlText1 = htmlContent.substring(0, 8);
  console.log('Test 1 HTML context (relative offset 8):');
  console.log('  HTML text:', JSON.stringify(htmlText1));
  const isInAttributeValue1 = attributeValueRegex.test(htmlText1);
  const isInAttribute1 = !isInAttributeValue1 && attributeRegex.test(htmlText1);
  const isInTagName1 = !isInAttributeValue1 && !isInAttribute1 && tagNameRegex.test(htmlText1);
  console.log('  Tag name:', isInTagName1);
  console.log('  Attribute:', isInAttribute1);
  console.log('  Attribute value:', isInAttributeValue1);
  
  // Test 2: relative offset 29 in HTML content (after the space)
  const htmlText2 = htmlContent.substring(0, 29);
  console.log('Test 2 HTML context (relative offset 29):');
  console.log('  HTML text:', JSON.stringify(htmlText2));
  const isInAttributeValue2 = attributeValueRegex.test(htmlText2);
  const isInAttribute2 = !isInAttributeValue2 && attributeRegex.test(htmlText2);
  const isInTagName2 = !isInAttributeValue2 && !isInAttribute2 && tagNameRegex.test(htmlText2);
  console.log('  Tag name:', isInTagName2);
  console.log('  Attribute:', isInAttribute2);
  console.log('  Attribute value:', isInAttributeValue2);
}
