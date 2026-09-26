/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Range utilities for SwissJS LSP server
 */

import { Range, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

/**
 * Create a Range from start and end positions
 */
export function createRange(
  startLine: number,
  startChar: number,
  endLine: number,
  endChar: number
): Range {
  return {
    start: Position.create(startLine, startChar),
    end: Position.create(endLine, endChar)
  };
}

/**
 * Create a Range from offsets in a document
 */
export function createRangeFromOffsets(
  document: TextDocument,
  startOffset: number,
  endOffset: number
): Range {
  return {
    start: document.positionAt(startOffset),
    end: document.positionAt(endOffset)
  };
}

/**
 * Check if a position is within a range
 */
export function isPositionInRange(position: Position, range: Range): boolean {
  return (
    (position.line > range.start.line || 
     (position.line === range.start.line && position.character >= range.start.character)) &&
    (position.line < range.end.line ||
     (position.line === range.end.line && position.character <= range.end.character))
  );
}

/**
 * Check if two ranges overlap
 */
export function rangesOverlap(range1: Range, range2: Range): boolean {
  return !(
    range1.end.line < range2.start.line ||
    (range1.end.line === range2.start.line && range1.end.character <= range2.start.character) ||
    range2.end.line < range1.start.line ||
    (range2.end.line === range1.start.line && range2.end.character <= range1.start.character)
  );
}

/**
 * Get the text content of a range from a document
 */
export function getRangeText(document: TextDocument, range: Range): string {
  const startOffset = document.offsetAt(range.start);
  const endOffset = document.offsetAt(range.end);
  return document.getText().substring(startOffset, endOffset);
}

/**
 * Expand a range to include full lines
 */
export function expandRangeToFullLines(_document: TextDocument, range: Range): Range {
  const startLine = range.start.line;
  const endLine = range.end.line;
  
  return {
    start: Position.create(startLine, 0),
    end: Position.create(endLine + 1, 0)
  };
}

/**
 * Create a range that spans a single word at the given position
 */
export function createWordRangeAtPosition(
  document: TextDocument,
  position: Position
): Range {
  const text = document.getText();
  const offset = document.offsetAt(position);
  
  // Find word boundaries
  let start = offset;
  let end = offset;
  
  // Expand backwards
  while (start > 0 && /[\w-]/.test(text[start - 1])) {
    start--;
  }
  
  // Expand forwards
  while (end < text.length && /[\w-]/.test(text[end])) {
    end++;
  }
  
  return createRangeFromOffsets(document, start, end);
}

/**
 * Create a range for an entire line
 */
export function createLineRange(document: TextDocument, lineNumber: number): Range {
  const lineText = document.getText().split('\n')[lineNumber] || '';
  return {
    start: Position.create(lineNumber, 0),
    end: Position.create(lineNumber, lineText.length)
  };
}

/**
 * Compare two positions
 * @returns -1 if pos1 < pos2, 0 if equal, 1 if pos1 > pos2
 */
export function comparePositions(pos1: Position, pos2: Position): number {
  if (pos1.line < pos2.line) return -1;
  if (pos1.line > pos2.line) return 1;
  if (pos1.character < pos2.character) return -1;
  if (pos1.character > pos2.character) return 1;
  return 0;
}

/**
 * Check if a range is valid (start <= end)
 */
export function isValidRange(range: Range): boolean {
  return comparePositions(range.start, range.end) <= 0;
}

/**
 * Normalize a range to ensure start <= end
 */
export function normalizeRange(range: Range): Range {
  if (comparePositions(range.start, range.end) <= 0) {
    return range;
  }
  return {
    start: range.end,
    end: range.start
  };
}

/**
 * Create a zero-width range at a position (useful for insertions)
 */
export function createInsertionRange(position: Position): Range {
  return {
    start: position,
    end: position
  };
}
