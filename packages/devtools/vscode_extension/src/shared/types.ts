/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Shared types for the SwissJS VSCode extension
 */

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface DocumentInfo {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface Diagnostic {
  message: string;
  range: Range;
  severity: 'error' | 'warning' | 'info' | 'hint';
  code?: string | number;
  source?: string;
}

export interface CompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  filterText?: string;
  sortText?: string;
  commitCharacters?: string[];
  command?: unknown;
  data?: unknown;
}

export interface Hover {
  contents: string | { language: string; value: string } | { language: string; value: string }[];
  range?: Range;
}
