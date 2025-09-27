/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Symbol provider for SwissJS files
 */

import { DocumentSymbol, SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SwissParser } from '../parser';
import { ASTNode, TagNode, DocumentNode } from '../astTypes';
import { extractFirstHtmlTemplate } from '../shared/templateUtils';

/**
 * Extract symbols from a SwissJS document
 */
export function getDocumentSymbols(document: TextDocument): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  
  try {
    const { text: tpl, start: baseOffset } = extractFirstHtmlTemplate(document);
    const parser = new SwissParser(tpl);
    const ast = parser.parse();
    
    const build = (node: ASTNode): DocumentSymbol | null => {
      if (node.type !== 'Tag') return null;
      const tag = node as TagNode;
      const name = tag.name;
      const selectionStart = document.positionAt(baseOffset + tag.range.start.offset);
      const selectionEnd = document.positionAt(baseOffset + tag.range.start.offset + name.length + 1); // <Name
      const range = {
        start: document.positionAt(baseOffset + tag.range.start.offset),
        end: document.positionAt(baseOffset + tag.range.end.offset)
      };
      const selectionRange = { start: selectionStart, end: selectionEnd };
      const children: DocumentSymbol[] = [];
      for (const child of tag.children) {
        const c = build(child as ASTNode);
        if (c) children.push(c);
      }
      return {
        name,
        kind: SymbolKind.Object,
        range,
        selectionRange,
        children
      };
    };

    for (const child of (ast as DocumentNode).children) {
      const sym = build(child as ASTNode);
      if (sym) symbols.push(sym);
    }
    
  } catch (error) {
    console.error('Error extracting symbols:', error);
  }
  
  return symbols;
}

/**
 * Find symbol at a specific position
 */
// findSymbolAtPosition is not used currently for hierarchical symbols; can be reintroduced if needed
