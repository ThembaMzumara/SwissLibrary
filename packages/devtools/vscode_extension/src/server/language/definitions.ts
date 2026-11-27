/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Definition provider for SwissJS files
 */

import { Definition, Location, Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SwissParser } from '../parser';
import { ASTNode, TagNode, AttributeNode, ExpressionNode } from '../astTypes';

/**
 * Find definition at the given position in the document
 */
export function findDefinition(
  document: TextDocument,
  position: Position
): Definition | null {
  const text = document.getText();
  const offset = document.offsetAt(position);
  
  // Fast-path: try to resolve tag under cursor within html template literal without full parse
  try {
    const htmlRegex = /html`([\s\S]*?)`/g;
    let match: RegExpExecArray | null;
    while ((match = htmlRegex.exec(text)) !== null) {
      const htmlStart = match.index + 5; // after 'html`'
      const htmlEnd = htmlStart + match[1].length;
      if (offset >= htmlStart && offset <= htmlEnd) {
        const relOffset = offset - htmlStart;
        const html = match[1];
        // Find nearest opening tag to the left
        const left = html.slice(0, relOffset);
        const lt = left.lastIndexOf('<');
        if (lt !== -1) {
          const afterLt = html.slice(lt);
          const m = afterLt.match(/^<\/?([A-Za-z][\w-]*)/);
          if (m) {
            const name = m[1];
            const nameStart = htmlStart + lt + 1;
            return {
              uri: document.uri,
              range: {
                start: document.positionAt(nameStart),
                end: document.positionAt(nameStart + name.length)
              }
            };
          }
        }
        break;
      }
    }
  } catch {
    // ignore fast-path errors and fallback
  }
  
  try {
    const parser = new SwissParser(text);
    const ast = parser.parse();
    
    // Find the node at the given position
    const findNodeAtPosition = (node: ASTNode): ASTNode | null => {
      if (!node.range) return null;
      
      const start = node.range.start.offset || 0;
      const end = node.range.end.offset || 0;
      
      if (offset >= start && offset <= end) {
        // Check children first (most specific to least specific)
        if ('children' in node && node.children) {
          for (const child of node.children) {
            const found = findNodeAtPosition(child);
            if (found) return found;
          }
        }
        
        // Check attributes for tag nodes
        if (node.type === 'Tag') {
          const tagNode = node as TagNode;
          for (const attr of tagNode.attributes) {
            if (attr.range && attr.range.start.offset && attr.range.end.offset &&
                offset >= attr.range.start.offset && offset <= attr.range.end.offset) {
              return attr;
            }
          }
        }
        
        return node;
      }
      return null;
    };
    
    const node = findNodeAtPosition(ast);
    if (!node) return null;
    
    // Handle different node types
    switch (node.type) {
      case 'Tag': {
        const tagNode = node as TagNode;
        // Try to find the component definition
        return findComponentDefinition(tagNode.name, document);
      }
      
      case 'Attribute': {
        const attrNode = node as AttributeNode;
        // For attributes, we'll look for the property in the component
        if (attrNode.parent && attrNode.parent.type === 'Tag') {
          const tagNode = attrNode.parent as TagNode;
          return findPropertyDefinition(tagNode.name, attrNode.name, document);
        }
        break;
      }
      
      case 'Expression': {
        // For expressions, we'll try to find the referenced symbol
        const exprNode = node as ExpressionNode;
        const symbol = extractSymbolFromExpression(exprNode.expression, offset - exprNode.range.start.offset);
        if (symbol) {
          return findSymbolDefinition(symbol, document);
        }
        break;
      }
    }
    
  } catch (error) {
    console.error('Error in definition provider:', error);
  }
  
  return null;
}

/**
 * Find the definition of a component
 */
function findComponentDefinition(componentName: string, document: TextDocument): Location | null {
  // In a real implementation, this would search the codebase for the component definition
  // For now, we'll just return the current file location as a placeholder
  return {
    uri: document.uri,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: componentName.length }
    }
  };
}

/**
 * Find the definition of a property in a component
 */
function findPropertyDefinition(_componentName: string, propertyName: string, document: TextDocument): Location | null {
  // In a real implementation, this would search the component for the property definition
  // For now, we'll just return the current file location as a placeholder
  return {
    uri: document.uri,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: propertyName.length }
    }
  };
}

/**
 * Extract symbol from expression at the given offset
 */
function extractSymbolFromExpression(expression: string, offset: number): string | null {
  // Simple implementation - extract the identifier at the cursor position
  // This would need to be more sophisticated for a real implementation
  const re = /[\w$]+/g;
  let match;
  
  while ((match = re.exec(expression)) !== null) {
    if (match.index <= offset && re.lastIndex > offset) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Find the definition of a symbol
 */
function findSymbolDefinition(symbol: string, document: TextDocument): Location | null {
  // In a real implementation, this would search the codebase for the symbol definition
  // For now, we'll just return the current file location as a placeholder
  return {
    uri: document.uri,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: symbol.length }
    }
  };
}
