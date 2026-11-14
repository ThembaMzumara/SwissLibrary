/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Definition provider for SwissJS files
 */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

// Minimal LSP types
interface LSPPosition { line: number; character: number }
interface LSPRange { start: LSPPosition; end: LSPPosition }
interface LSPLocation { uri: string; range: LSPRange }
interface LSPLocationLink {
  targetUri: string;
  targetRange: LSPRange;
  targetSelectionRange?: LSPRange;
  originSelectionRange?: LSPRange;
}

export class SwissDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private client: LanguageClient) {}

  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | vscode.LocationLink[] | undefined> {
    try {
      // First try to get definition from the language server
      const result = await this.client.sendRequest<LSPLocation | LSPLocation[] | LSPLocationLink[] | null>(
        'textDocument/definition',
        {
          textDocument: { uri: document.uri.toString() },
          position: position
        },
        token
      );

      if (result) {
        if (Array.isArray(result)) {
          // Handle LocationLink[]
          if (result.length > 0 && 'targetUri' in result[0]) {
            return (result as LSPLocationLink[]).map(link => this.convertToVSCodeLocationLink(link));
          }
          // Handle Location[]
          return (result as LSPLocation[]).map(loc => this.convertToVSCodeLocation(loc));
        } else if ('uri' in result) {
          // Handle single Location
          return this.convertToVSCodeLocation(result as LSPLocation);
        }
      }
    } catch (error) {
      console.error('Error providing definition:', error);
    }

    // Fallback to basic definition provider if language server doesn't provide any
    return this.provideBasicDefinition(document, position);
  }

  private convertToVSCodeLocation(location: LSPLocation): vscode.Location {
    return new vscode.Location(
      vscode.Uri.parse(location.uri),
      new vscode.Range(
        location.range.start.line,
        location.range.start.character,
        location.range.end.line,
        location.range.end.character
      )
    );
  }

  private convertToVSCodeLocationLink(link: LSPLocationLink): vscode.LocationLink {
    return {
      targetRange: new vscode.Range(
        link.targetRange.start.line,
        link.targetRange.start.character,
        link.targetRange.end.line,
        link.targetRange.end.character
      ),
      targetSelectionRange: link.targetSelectionRange
        ? new vscode.Range(
            link.targetSelectionRange.start.line,
            link.targetSelectionRange.start.character,
            link.targetSelectionRange.end.line,
            link.targetSelectionRange.end.character
          )
        : undefined,
      targetUri: vscode.Uri.parse(link.targetUri),
      originSelectionRange: link.originSelectionRange
        ? new vscode.Range(
            link.originSelectionRange.start.line,
            link.originSelectionRange.start.character,
            link.originSelectionRange.end.line,
            link.originSelectionRange.end.character
          )
        : undefined
    };
  }

  private async provideBasicDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Location | undefined> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const text = document.getText();

    // Simple implementation to find the definition of a tag
    if (word && word.match(/^[A-Z]/)) {
      // This is a PascalCase word, likely a component
      const componentRegex = new RegExp(`<${word}\b`, 'g');
      let match;
      
      while ((match = componentRegex.exec(text)) !== null) {
        // Return the first occurrence of the component
        const pos = document.positionAt(match.index + 1); // +1 to skip the <
        return new vscode.Location(
          document.uri,
          new vscode.Range(pos, new vscode.Position(pos.line, pos.character + word.length))
        );
      }
    }

    return undefined;
  }
}
