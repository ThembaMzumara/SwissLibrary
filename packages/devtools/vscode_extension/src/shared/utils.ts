/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Shared utilities for the SwissJS VSCode extension
 */

import { Position, Range } from './types';

export function positionToOffset(text: string, pos: Position): number {
  const lines = text.split('\n');
  let offset = 0;
  
  for (let i = 0; i < pos.line; i++) {
    offset += lines[i].length + 1; // +1 for the newline character
  }
  
  return offset + pos.character;
}

export function offsetToPosition(text: string, offset: number): Position {
  const lines = text.substr(0, offset).split('\n');
  return {
    line: lines.length - 1,
    character: lines[lines.length - 1].length
  };
}

export function createRange(startLine: number, startChar: number, endLine: number, endChar: number): Range {
  return {
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar }
  };
}

export function isInRange(position: Position, range: Range): boolean {
  return (
    (position.line > range.start.line || 
      (position.line === range.start.line && position.character >= range.start.character)) &&
    (position.line < range.end.line || 
      (position.line === range.end.line && position.character <= range.end.character))
  );
}
