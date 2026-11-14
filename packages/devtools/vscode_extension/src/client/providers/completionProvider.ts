/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Completion provider for SwissJS files
 */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

// Minimal LSP types to avoid depending on protocol package from the client
interface LSPPosition { line: number; character: number }
interface LSPRange { start: LSPPosition; end: LSPPosition }
interface LSPTextEdit { range: LSPRange; newText: string }
interface LSPCommand { title?: string; command?: string; arguments?: unknown[] }
interface LSPCompletionItem {
  label: string | { label: string };
  kind?: number;
  detail?: string;
  documentation?: string | { value: string };
  insertText?: string;
  filterText?: string;
  sortText?: string;
  preselect?: boolean;
  textEdit?: { newText: string } | LSPTextEdit;
  additionalTextEdits?: LSPTextEdit[];
  command?: LSPCommand;
  data?: unknown;
}
interface LSPCompletionList { isIncomplete?: boolean; items: LSPCompletionItem[] }
type CompletionItemWithData = vscode.CompletionItem & { data?: unknown };

export class SwissCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private client: LanguageClient) {}

  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList | undefined> {
    // First try to get completions from the language server
    try {
      const result = await this.client.sendRequest<LSPCompletionList | LSPCompletionItem[] | null>(
        'textDocument/completion',
        {
          textDocument: { uri: document.uri.toString() },
          position: position,
          context: {
            triggerKind: this.mapTriggerKind(context.triggerKind),
            triggerCharacter: context.triggerCharacter
          }
        },
        token
      );

      if (result) {
        if (Array.isArray(result)) {
          return result.map((item) => this.convertToVsCodeCompletionItem(item));
        } else if ('items' in result) {
          return new vscode.CompletionList(
            result.items.map((item) => this.convertToVsCodeCompletionItem(item)),
            Boolean(result.isIncomplete)
          );
        }
      }
    } catch (error) {
      console.error('Error providing completions:', error);
    }

    // Fallback to basic completions if language server doesn't provide any
    return this.provideBasicCompletions(document, position);
  }

  public async resolveCompletionItem(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem> {
    // If the completion item has a data property, it means it came from the language server
    // and might need to be resolved
    if ((item as CompletionItemWithData).data !== undefined) {
      try {
        const resolvedItem = await this.client.sendRequest<LSPCompletionItem>(
          'completionItem/resolve',
          this.convertToLSPCompletionItem(item),
          token
        );

        if (resolvedItem) {
          return this.convertToVsCodeCompletionItem(resolvedItem);
        }
      } catch (error) {
        console.error('Error resolving completion item:', error);
      }
    }

    return item;
  }

  private convertToVsCodeCompletionItem(item: LSPCompletionItem): vscode.CompletionItem {
    const vscodeItem = new vscode.CompletionItem(
      item.label,
      this.mapCompletionItemKind(item.kind)
    );

    if (item.detail) vscodeItem.detail = item.detail;
    if (item.documentation) {
      if (typeof item.documentation === 'string') {
        vscodeItem.documentation = new vscode.MarkdownString(item.documentation);
      } else if ('value' in item.documentation) {
        const md = new vscode.MarkdownString(item.documentation.value);
        vscodeItem.documentation = md;
      }
    }
    if (item.insertText) vscodeItem.insertText = item.insertText as string;
    if (item.filterText) vscodeItem.filterText = item.filterText;
    if (item.sortText) vscodeItem.sortText = item.sortText;
    if (item.preselect) vscodeItem.preselect = item.preselect;
    if (item.textEdit) {
      if ('newText' in item.textEdit) {
        vscodeItem.insertText = item.textEdit.newText;
      }
    }
    if (item.additionalTextEdits) {
      vscodeItem.additionalTextEdits = item.additionalTextEdits.map((edit) => {
        return new vscode.TextEdit(
          new vscode.Range(
            edit.range.start.line,
            edit.range.start.character,
            edit.range.end.line,
            edit.range.end.character
          ),
          edit.newText
        );
      });
    }
    if (item.command) {
      vscodeItem.command = {
        title: item.command.title || '',
        command: item.command.command || '',
        arguments: item.command.arguments
      };
    }

    // Store the original data for resolution if needed
    if (Object.prototype.hasOwnProperty.call(item, 'data')) {
      (vscodeItem as CompletionItemWithData).data = (item as { data?: unknown }).data;
    }

    return vscodeItem;
  }

  private convertToLSPCompletionItem(item: vscode.CompletionItem): LSPCompletionItem {
    const lspItem: LSPCompletionItem = {
      label: typeof item.label === 'string' ? item.label : item.label.label,
      kind: this.unmapCompletionItemKind(item.kind)
    };

    if (item.detail) lspItem.detail = item.detail;
    if (item.documentation) {
      if (typeof item.documentation === 'string') {
        lspItem.documentation = item.documentation;
      } else if (item.documentation instanceof vscode.MarkdownString) {
        lspItem.documentation = { value: item.documentation.value };
      }
    }
    if (item.insertText) lspItem.insertText = item.insertText as string;
    if (item.filterText) lspItem.filterText = item.filterText;
    if (item.sortText) lspItem.sortText = item.sortText;
    if (item.preselect) lspItem.preselect = item.preselect;
    if ((item as CompletionItemWithData).data !== undefined) {
      lspItem.data = (item as CompletionItemWithData).data;
    }

    return lspItem;
  }

  private mapTriggerKind(kind: vscode.CompletionTriggerKind): number {
    // Map VS Code's trigger kind to LSP's trigger kind
    switch (kind) {
      case vscode.CompletionTriggerKind.Invoke: return 1;
      case vscode.CompletionTriggerKind.TriggerCharacter: return 2;
      case vscode.CompletionTriggerKind.TriggerForIncompleteCompletions: return 3;
      default: return 1;
    }
  }

  private mapCompletionItemKind(kind?: number): vscode.CompletionItemKind {
    // Map LSP completion item kind to VS Code completion item kind
    if (!kind) return vscode.CompletionItemKind.Text;
    
    // LSP kind values are 1-based, VS Code's are 0-based
    return Math.max(kind - 1, 0) as vscode.CompletionItemKind;
  }

  private unmapCompletionItemKind(kind?: vscode.CompletionItemKind): number | undefined {
    // Map VS Code completion item kind to LSP completion item kind
    if (kind === undefined) return undefined;
    
    // LSP kind values are 1-based, VS Code's are 0-based
    return kind + 1;
  }

  private async provideBasicCompletions(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const completions: vscode.CompletionItem[] = [];
    const linePrefix = document.lineAt(position).text.substr(0, position.character);

    // Basic HTML tag completions
    if (linePrefix.endsWith('<')) {
      const commonTags = [
        'div', 'span', 'button', 'input', 'form', 'label', 'select', 'option',
        'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'
      ];

      commonTags.forEach(tag => {
        const completion = new vscode.CompletionItem(
          tag,
          vscode.CompletionItemKind.Class
        );
        completion.insertText = `${tag} $1>$1</${tag}>`;
        completion.documentation = `HTML <${tag}> element`;
        completion.detail = 'HTML Element';
        completion.kind = vscode.CompletionItemKind.Class;
        completion.commitCharacters = ['>', ' '];
        completions.push(completion);
      });
    }
    // Basic attribute completions
    else if (linePrefix.match(/<[a-zA-Z][^>]*\s[^>]*$/)) {
      const commonAttrs = [
        'class', 'id', 'style', 'title', 'role', 'aria-*',
        'on:click', 'on:submit', 'on:change', 'on:input',
        'bind:value', 'bind:checked', 'bind:group'
      ];

      commonAttrs.forEach(attr => {
        const completion = new vscode.CompletionItem(
          attr,
          attr.startsWith('on:') || attr.startsWith('bind:') 
            ? vscode.CompletionItemKind.Event 
            : vscode.CompletionItemKind.Property
        );
        
        if (attr.endsWith('*')) {
          completion.insertText = attr.replace('*', '');
          completion.documentation = 'ARIA attribute';
        } else if (attr.startsWith('on:')) {
          completion.insertText = `${attr}={"$1"}`;
          completion.documentation = `SwissJS ${attr} event handler`;
        } else if (attr.startsWith('bind:')) {
          completion.insertText = `${attr}={"$1"}`;
          completion.documentation = `SwissJS two-way binding for ${attr.replace('bind:', '')}`;
        } else {
          completion.insertText = `${attr}="$1"`;
          completion.documentation = `HTML ${attr} attribute`;
        }
        
        completion.detail = attr.startsWith('on:') ? 'Event' : 
                           attr.startsWith('bind:') ? 'Binding' : 'Attribute';
        completions.push(completion);
      });
    }

    return completions;
  }
}
