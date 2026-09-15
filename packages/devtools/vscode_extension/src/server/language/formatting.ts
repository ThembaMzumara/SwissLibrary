/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { TextEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SwissParser } from '../parser';
import { ASTNode, DocumentNode, TagNode, TextNode, AttributeNode } from '../astTypes';
import { extractFirstHtmlTemplate } from '../shared/templateUtils';

export function getFormattingEdits(document: TextDocument): TextEdit[] {
  const text = document.getText();
  try {
    // Extract the first html`` template content and format only that region.
    const { text: tpl, start: baseOffset } = extractFirstHtmlTemplate(document);

    const parser = new SwissParser(tpl);
    const ast = parser.parse();
    const formattedTpl = printDocument(ast as DocumentNode, document, baseOffset);

    // Reconstruct full document by replacing template region
    const before = text.slice(0, baseOffset);
    const after = text.slice(baseOffset + tpl.length);
    const newFull = before + formattedTpl + after;

    if (newFull !== text) {
      return [TextEdit.replace(fullRange(document), newFull)];
    }
  } catch {
    // On parse failure, do not change the document
  }
  return [];
}

function fullRange(document: TextDocument) {
  return {
    start: document.positionAt(0),
    end: document.positionAt(document.getText().length)
  };
}

function printDocument(root: DocumentNode, document: TextDocument, baseOffset: number): string {
  const out: string[] = [];
  let indent = 0;
  const indentStr = (n: number) => '  '.repeat(n);

  const printNode = (node: ASTNode) => {
    if (node.type === 'Text') {
      const val = (node as TextNode).value.trim();
      if (val) out.push(indentStr(indent) + escapeText(val));
      return;
    }
    if (node.type === 'Tag') {
      const tag = node as TagNode;
      const attrs = tag.attributes.map(printAttr).filter(Boolean).join(' ');
      const open = attrs ? `<${tag.name} ${attrs}>` : `<${tag.name}>`;
      const self = tag.selfClosing ? (attrs ? `<${tag.name} ${attrs} />` : `<${tag.name} />`) : open;
      if (tag.selfClosing) {
        out.push(indentStr(indent) + self);
        return;
      }
      out.push(indentStr(indent) + self);
      indent++;
      for (const child of tag.children) printNode(child as ASTNode);
      indent--;
      out.push(indentStr(indent) + `</${tag.name}>`);
      return;
    }
    // ignore expressions for now; preserve as-is text slice
    const slice = document.getText().slice(baseOffset + node.range.start.offset, baseOffset + node.range.end.offset);
    out.push(indentStr(indent) + slice);
  };

  for (const child of root.children) printNode(child as ASTNode);
  return out.join('\n') + (out.length ? '\n' : '');
}

function printAttr(attr: AttributeNode): string {
  if (attr.value == null || attr.value === '') return attr.name;
  const v = attr.value.includes('"') ? `'${attr.value}'` : `"${attr.value}"`;
  return `${attr.name}=${v}`;
}

function escapeText(s: string): string { return s; }

