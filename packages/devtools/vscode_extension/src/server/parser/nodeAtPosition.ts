/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { ASTNode, DocumentNode, TagNode, AttributeNode, TextNode } from '../astTypes';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

function inRange(offset: number, node: ASTNode): boolean {
  return offset >= node.range.start.offset && offset <= node.range.end.offset;
}

export function nodeAtOffset(root: DocumentNode, offset: number): ASTNode | null {
  if (!inRange(offset, root)) return null;
  let best: ASTNode = root;

  const visit = (node: ASTNode) => {
    if (!inRange(offset, node)) return;
    // Prefer the most specific (smallest) node containing offset
    if (
      node.range.end.offset - node.range.start.offset <
      best.range.end.offset - best.range.start.offset
    ) {
      best = node;
    }
    if ((node as TagNode).children) {
      for (const child of (node as TagNode).children as ASTNode[]) visit(child);
    }
    if ((node as TagNode).attributes) {
      for (const attr of (node as TagNode).attributes as AttributeNode[]) visit(attr);
      for (const attr of (node as TagNode).attributes as AttributeNode[]) {
        if (attr.valueRange) {
          const fake: TextNode = {
            type: 'Text',
            value: attr.value ?? '',
            range: attr.valueRange,
            parent: node
          };
          visit(fake);
        }
      }
    }
  };

  for (const child of root.children) visit(child);
  return best || null;
}

export function nodeAtPosition(root: DocumentNode, document: TextDocument, position: Position): ASTNode | null {
  const offset = document.offsetAt(position);
  return nodeAtOffset(root, offset);
}
