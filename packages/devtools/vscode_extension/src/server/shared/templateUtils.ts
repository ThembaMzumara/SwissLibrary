/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { TextDocument } from 'vscode-languageserver-textdocument';

/**
 * Extract the first html`` template literal content from a SwissJS .ui TypeScript document.
 * Returns the inner text (without the leading html` and trailing `) and the start offset
 * of that content within the original document. If no html template is found, falls back
 * to the entire document text with start=0.
 */
export function extractFirstHtmlTemplate(document: TextDocument): { text: string; start: number } {
  const full = document.getText();
  const marker = 'html`';
  const startMarker = full.indexOf(marker);
  if (startMarker === -1) {
    return { text: full, start: 0 };
  }
  // Start of template content (after html`)
  const contentStart = startMarker + marker.length;
  let i = contentStart;
  let inEscape = false;
  for (; i < full.length; i++) {
    const ch = full[i];
    if (inEscape) { inEscape = false; continue; }
    if (ch === '\\') { inEscape = true; continue; }
    if (ch === '`') { break; }
  }
  let content = full.slice(contentStart, Math.min(i, full.length));
  // Normalize: trim leading whitespace/newlines so template line 0 col 0 starts at first tag/text
  const leadingMatch = content.match(/^[\s\r\n]+/);
  let adjustedStart = contentStart;
  if (leadingMatch && leadingMatch[0]) {
    adjustedStart += leadingMatch[0].length;
    content = content.slice(leadingMatch[0].length);
  }
  return { text: content, start: adjustedStart };
}
