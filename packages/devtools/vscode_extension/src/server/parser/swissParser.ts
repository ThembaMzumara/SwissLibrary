/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * SwissJS Parser - Converts SwissJS source code into an AST
 */

import { ASTNode, DocumentNode, TagNode, AttributeNode, TextNode, ExpressionNode } from '../astTypes';

export class SwissParser {
  private source: string;
  private position: number;
  private line: number;
  private column: number;
  private currentChar: string | null = null;

  constructor(source: string) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.currentChar = source[0] || null;
  }

  private createPosition() {
    return {
      line: this.line,
      column: this.column,
      offset: this.position
    };
  }

  private advance(): void {
    if (this.currentChar === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
    this.currentChar = this.source[this.position] || null;
  }

  private skipWhitespace(): void {
    while (this.currentChar && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private isGt(char: string | null): char is '>' {
    return char === '>';
  }

  private isSlash(char: string | null): char is '/' {
    return char === '/';
  }

  private isQuote(char: string | null): char is '"' | '\'' {
    return char === '"' || char === '\'';
  }

  private isIdentifierStart(char: string | null): char is string {
    return char !== null && /^[a-zA-Z_$]$/.test(char);
  }

  private isIdentifierChar(char: string | null): char is string {
    return char !== null && /^[a-zA-Z0-9_$]$/.test(char);
  }

  private parseIdentifier(): string {
    let result = '';
    if (this.isIdentifierStart(this.currentChar)) {
      result += this.currentChar;
      this.advance();
      
      while (this.currentChar && this.isIdentifierChar(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
    }
    return result;
  }

  public parse(): DocumentNode {
    const startPos = this.createPosition();
    const document: DocumentNode = {
      type: 'Document',
      range: {
        start: startPos,
        end: this.createPosition()
      },
      children: [],
      parent: undefined
    };

    // First, extract HTML content from html template literals
    const htmlContent = this.extractHtmlFromTemplateLiterals();
    
    if (htmlContent.length > 0) {
      // Parse each HTML template literal content
      for (const { content, offset } of htmlContent) {
        // Create a new parser instance for the HTML content
        const htmlParser = new SwissParser(content);
        const htmlDoc = htmlParser.parseHtmlContent(document);
        
        // Adjust positions to account for the template literal offset
        this.adjustNodePositions(htmlDoc.children, offset);
        document.children.push(...htmlDoc.children);
      }
    } else {
      // Fallback: parse as raw HTML/XML (legacy support)
      const htmlDoc = this.parseHtmlContent(document);
      document.children = htmlDoc.children;
    }

    document.range.end = this.createPosition();
    return document;
  }

  private adjustNodePositions(nodes: ASTNode[], offset: number): void {
    for (const node of nodes) {
      // Adjust the node's range positions
      const originalStartLine = node.range.start.line;
      const originalEndLine = node.range.end.line;
      
      // Calculate the actual line/column in the original document
      const baseLineOffset = this.getLineFromOffset(offset) - 1;
      
      node.range.start.line = originalStartLine + baseLineOffset;
      node.range.start.offset = (node.range.start.offset || 0) + offset;
      
      node.range.end.line = originalEndLine + baseLineOffset;
      node.range.end.offset = (node.range.end.offset || 0) + offset;
      
      // Recursively adjust child nodes
      if ('children' in node && Array.isArray(node.children)) {
        this.adjustNodePositions(node.children, offset);
      }
    }
  }

  private extractHtmlFromTemplateLiterals(): Array<{ content: string; offset: number }> {
    const htmlMatches: Array<{ content: string; offset: number }> = [];
    const htmlRegex = /html`([^`]*)`/gs;
    let match;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops
    
    while ((match = htmlRegex.exec(this.source)) !== null && iterations < maxIterations) {
      const content = match[1];
      const offset = match.index + 5; // Skip 'html`'
      htmlMatches.push({ content, offset });
      iterations++;
    }
    
    return htmlMatches;
  }

  private getLineFromOffset(offset: number): number {
    const lines = this.source.substring(0, offset).split('\n');
    return lines.length;
  }

  private parseHtmlContent(document: DocumentNode): DocumentNode {
    while (this.currentChar !== null) {
      this.skipWhitespace();
      
      if (this.currentChar === '<') {
        // Parse tag
        const tag = this.parseTag(document);
        if (tag) {
          document.children.push(tag);
        }
      } else if (this.currentChar === '{') {
        // Parse expression
        const expr = this.parseExpression(document);
        if (expr) {
          document.children.push(expr);
        }
      } else if (this.currentChar) {
        // Parse text
        const text = this.parseText(document);
        if (text) {
          document.children.push(text);
        }
      }
    }
    
    return document;
  }

  private parseTag(parent: ASTNode): TagNode | null {
    if (this.currentChar !== '<') return null;
    
    const startPos = this.createPosition();
    this.advance(); // Skip '<'
    
    // Skip whitespace
    this.skipWhitespace();
    
    // Parse tag name
    const tagName = this.parseIdentifier();
    if (!tagName) return null;
    
    const tagNode: TagNode = {
      type: 'Tag',
      name: tagName,
      selfClosing: false,
      attributes: [],
      children: [],
      range: {
        start: startPos,
        end: this.createPosition()
      },
      parent
    };
    
    // Parse attributes
    while (this.currentChar) {
      this.skipWhitespace();
      if (this.isGt(this.currentChar) || this.isSlash(this.currentChar)) {
        break;
      }
      const attr = this.parseAttribute(tagNode);
      if (attr) {
        tagNode.attributes.push(attr);
      } else {
        break;
      }
    }
    
    // Handle self-closing tag and closing bracket
    if (this.currentChar) {
      if (this.isSlash(this.currentChar)) {
        tagNode.selfClosing = true;
        this.advance(); // Skip '/'
      }
      
      // Skip '>'
      if (this.isGt(this.currentChar)) {
        this.advance();
      }
    }
    
    // Parse children if not self-closing
    let foundClosing = false;
    if (!tagNode.selfClosing) {
      while (this.currentChar) {
        const ch = this.currentChar;
        if (ch === '<') {
          // Peek next char to decide whether this is a closing tag or a nested element
          const afterLt = this.source[this.position + 1] || null;
          if (this.isSlash(afterLt)) {
            // Consume '<' and '/'
            this.advance();
            // Closing tag
            this.advance(); // Skip '/'
            const endTagName = this.parseIdentifier();
            if (endTagName === tagName) {
              // Skip to '>'
              while (this.currentChar && !this.isGt(this.currentChar)) {
                this.advance();
              }
              if (this.isGt(this.currentChar)) {
                this.advance();
              }
              foundClosing = true;
              break;
            }
          } else {
            // Nested element
            const child = this.parseTag(tagNode);
            if (child) {
              tagNode.children.push(child);
            } else {
              // Safety guard: if we cannot parse a child after '<',
              // advance to the next tag boundary to avoid infinite loops.
              // Consume '<' and move forward until next boundary if stuck
              this.advance();
              while (this.currentChar && (this.currentChar as string) !== '<' && !this.isGt(this.currentChar)) {
                this.advance();
              }
              if (this.isGt(this.currentChar)) this.advance();
            }
          }
        } else if (ch === '{') {
          const expr = this.parseExpression(tagNode);
          if (expr) {
            tagNode.children.push(expr);
          } else {
            this.advance();
          }
        } else {
          // Text content
          const textNode = this.parseText(tagNode);
          if (textNode) {
            tagNode.children.push(textNode);
          }
        }
      }
    }
    
    if (!tagNode.selfClosing && !foundClosing) {
      // EOF or mismatched closing tag; mark as unclosed for diagnostics
      tagNode.unclosed = true;
    }
    tagNode.range.end = this.createPosition();
    return tagNode;
  }

  private parseAttribute(parent: TagNode): AttributeNode | null {
    if (!this.currentChar || !this.isIdentifierStart(this.currentChar)) {
      return null;
    }
    
    const startPos = this.createPosition();
    const name = this.parseIdentifier();
    if (!name) return null;
    
    const attrNode: AttributeNode = {
      type: 'Attribute',
      name,
      value: null,
      range: {
        start: startPos,
        end: this.createPosition()
      },
      parent
    };
    
    // Parse value if present
    if (this.currentChar === '=') {
      this.advance(); // Skip '='
      
      const quoteChar = this.currentChar;
      if (this.isQuote(quoteChar)) {
        this.advance(); // Skip opening quote
        
        const valueStart = this.createPosition();
        const valueParts: string[] = [];
        
        while (this.currentChar && this.currentChar !== quoteChar) {
          valueParts.push(this.currentChar);
          this.advance();
        }
        
        if (this.currentChar === quoteChar) {
          this.advance(); // Skip closing quote
        }
        
        attrNode.value = valueParts.join('');
        attrNode.valueRange = {
          start: valueStart,
          end: this.createPosition()
        };
      }
    }
    
    attrNode.range.end = this.createPosition();
    return attrNode;
  }

  private parseExpression(parent: ASTNode): ExpressionNode | null {
    if (this.currentChar !== '{') return null;
    
    const start = this.createPosition();
    this.advance(); // Skip '{'
    
    let value = '';
    let depth = 1;
    
    while (this.currentChar !== null) {
      if (this.currentChar === '{') {
        depth++;
      } else if (this.currentChar === '}') {
        depth--;
        if (depth === 0) {
          this.advance(); // Skip closing '}'
          break;
        }
      }
      
      value += this.currentChar;
      this.advance();
    }
    
    if (depth !== 0) return null; // Unbalanced braces
    
    const trimmedValue = value.trim();
    const exprNode: ExpressionNode = {
      type: 'Expression',
      value: trimmedValue,
      expression: trimmedValue,
      range: {
        start,
        end: this.createPosition()
      },
      parent
    };
    
    return exprNode;
  }

  private parseText(parent: ASTNode): TextNode | null {
    const start = this.createPosition();
    let value = '';
    
    while (this.currentChar !== null && this.currentChar !== '<' && this.currentChar !== '{') {
      value += this.currentChar;
      this.advance();
    }
    
    if (!value.trim()) return null;
    
    return {
      type: 'Text',
      value: value.trim(),
      range: {
        start,
        end: this.createPosition()
      },
      parent
    };
  }
}
