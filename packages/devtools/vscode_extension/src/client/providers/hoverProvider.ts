/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Hover provider for SwissJS files
 */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

// Minimal LSP types
interface LSPPosition { line: number; character: number }
interface LSPRange { start: LSPPosition; end: LSPPosition }
type LSPMarkedString = string | { language?: string; value: string };
interface LSPHover { contents: LSPMarkedString | LSPMarkedString[]; range?: LSPRange }

export class SwissHoverProvider implements vscode.HoverProvider {
  constructor(private client: LanguageClient) {}

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    // If the language server provides hover information, use it
    try {
      const hoverResult = await this.client.sendRequest<LSPHover>('textDocument/hover', {
        textDocument: { uri: document.uri.toString() },
        position: position
      }, token);

      if (hoverResult && hoverResult.contents) {
        const contents = Array.isArray(hoverResult.contents) 
          ? hoverResult.contents.map(c => this.convertToMarkdown(c))
          : this.convertToMarkdown(hoverResult.contents);

        const range = hoverResult.range 
          ? new vscode.Range(
              hoverResult.range.start.line,
              hoverResult.range.start.character,
              hoverResult.range.end.line,
              hoverResult.range.end.character
            )
          : undefined;

        return new vscode.Hover(contents, range);
      }
    } catch (error) {
      console.error('Error providing hover:', error);
    }

    // Fallback to basic hover information
    const wordRange = document.getWordRangeAtPosition(position);
    const word = wordRange ? document.getText(wordRange) : '';

    if (word) {
      // Provide basic hover information based on the word
      const content = this.getBasicHoverContent(word);
      if (content) {
        return new vscode.Hover(content, wordRange);
      }
    }

    return undefined;
  }

  private convertToMarkdown(content: LSPMarkedString): vscode.MarkdownString {
    if (typeof content === 'string') {
      return new vscode.MarkdownString(content);
    } else if (content && typeof content === 'object' && 'value' in content) {
      const md = new vscode.MarkdownString();
      md.appendCodeblock(content.value, content.language);
      return md;
    }
    return new vscode.MarkdownString(String(content));
  }

  private getBasicHoverContent(word: string): vscode.MarkdownString | undefined {
    // Add basic hover information for common SwissJS/HTML elements and attributes
    const hoverInfo: Record<string, { content: string; type: 'element' | 'attribute' | 'directive' }> = {
      'div': {
        type: 'element',
        content: 'A generic container element. Use it to group elements for styling or to create layout structures.'
      },
      'button': {
        type: 'element',
        content: 'A clickable button that can trigger actions.'
      },
      'input': {
        type: 'element',
        content: 'A form control that allows user input.'
      },
      'on:click': {
        type: 'directive',
        content: 'SwissJS event binding. Executes the expression when the element is clicked.'
      },
      'bind:value': {
        type: 'directive',
        content: 'SwissJS two-way binding. Binds a variable to an input\'s value.'
      },
      'class': {
        type: 'attribute',
        content: 'Specifies one or more class names for an element. Multiple classes should be separated by spaces.'
      },
      'style': {
        type: 'attribute',
        content: 'Specifies inline CSS styles for an element.'
      }
    };

    const info = hoverInfo[word];
    if (info) {
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${word}**  
*(${info.type === 'directive' ? 'SwissJS Directive' : 
        info.type === 'attribute' ? 'HTML Attribute' : 'HTML Element'})*  
---  
${info.content}`);
      return md;
    }

    return undefined;
  }
}
