/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Document symbol provider for SwissJS files
 */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

// Minimal LSP types used for requests/responses
interface LSPPosition { line: number; character: number }
interface LSPRange { start: LSPPosition; end: LSPPosition }
interface LSPDocumentSymbol {
  name: string;
  detail?: string;
  kind: number; // LSP SymbolKind as number
  range: LSPRange;
  selectionRange: LSPRange;
  children?: LSPDocumentSymbol[];
}
interface LSPSymbolInformation {
  name: string;
  kind: number;
  location: { uri: string; range: LSPRange };
  containerName?: string;
}

export class SwissDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  constructor(private client: LanguageClient) {}

  public async provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
    try {
      // First try to get document symbols (hierarchical)
      const result = await this.client.sendRequest<LSPDocumentSymbol[] | null>(
        'textDocument/documentSymbol',
        {
          textDocument: { uri: document.uri.toString() }
        },
        token
      );

      if (result && result.length > 0) {
        return this.convertToVSCodeDocumentSymbols(result);
      }

      // Fall back to flat symbol information if hierarchical symbols aren't available
      const flatResult = await this.client.sendRequest<LSPSymbolInformation[] | null>(
        'textDocument/documentSymbol',
        {
          textDocument: { uri: document.uri.toString() }
        },
        token
      );

      if (flatResult && flatResult.length > 0) {
        return flatResult.map(symbol => this.convertToVSCodeSymbolInformation(symbol));
      }
    } catch (error) {
      console.error('Error providing document symbols:', error);
    }

    // Fallback to basic symbol extraction if language server doesn't provide any
    return this.provideBasicDocumentSymbols(document);
  }

  private convertToVSCodeDocumentSymbols(symbols: LSPDocumentSymbol[]): vscode.DocumentSymbol[] {
    return symbols.map(symbol => {
      const range = new vscode.Range(
        symbol.range.start.line,
        symbol.range.start.character,
        symbol.range.end.line,
        symbol.range.end.character
      );

      const selectionRange = symbol.selectionRange
        ? new vscode.Range(
            symbol.selectionRange.start.line,
            symbol.selectionRange.start.character,
            symbol.selectionRange.end.line,
            symbol.selectionRange.end.character
          )
        : range;

      const vscodeSymbol = new vscode.DocumentSymbol(
        symbol.name,
        symbol.detail || '',
        this.mapSymbolKind(symbol.kind),
        range,
        selectionRange
      );

      if (symbol.children && symbol.children.length > 0) {
        vscodeSymbol.children = this.convertToVSCodeDocumentSymbols(symbol.children);
      }

      return vscodeSymbol;
    });
  }

  private convertToVSCodeSymbolInformation(symbol: LSPSymbolInformation): vscode.SymbolInformation {
    return new vscode.SymbolInformation(
      symbol.name,
      this.mapSymbolKind(symbol.kind),
      symbol.containerName || '',
      new vscode.Location(
        vscode.Uri.parse(symbol.location.uri),
        new vscode.Range(
          symbol.location.range.start.line,
          symbol.location.range.start.character,
          symbol.location.range.end.line,
          symbol.location.range.end.character
        )
      )
    );
  }

  private mapSymbolKind(kind: number): vscode.SymbolKind {
    // LSP symbol kinds are 1-based, VS Code's are 0-based
    return Math.max(kind - 1, 0) as vscode.SymbolKind;
  }

  private async provideBasicDocumentSymbols(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentSymbol[]> {
    const symbols: vscode.DocumentSymbol[] = [];
    const text = document.getText();
    
    // Simple regex to find tags - this is a very basic implementation
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>/g;
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      const tagName = match[1];
      const startPos = document.positionAt(match.index);
      
      // Create a simple symbol for the tag
      const symbol = new vscode.DocumentSymbol(
        tagName,
        'HTML Element',
        vscode.SymbolKind.Class,
        new vscode.Range(startPos, startPos),
        new vscode.Range(startPos, startPos)
      );
      
      symbols.push(symbol);
    }
    
    return symbols;
  }
}
