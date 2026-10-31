/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { CodeAction, CodeActionKind, Diagnostic, Range, TextEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function getCodeActions(document: TextDocument, params: { textDocument: { uri: string }, range: Range, context: { diagnostics: Diagnostic[] } }): CodeAction[] {
  const actions: CodeAction[] = [];
  const diags = params.context.diagnostics || [];

  for (const d of diags) {
    const msg = d.message || '';

    // Quick fix: Binding/event requires a value -> insert =""
    if (/requires a value$/.test(msg)) {
      const edit = insertEqualsQuotesEdit(d.range);
      if (edit) {
        actions.push({
          title: 'Insert attribute value',
          kind: CodeActionKind.QuickFix,
          diagnostics: [d],
          edit: { changes: { [document.uri]: [edit] } }
        });
      }
    }

    // Quick fix: Unclosed tag: </Tag>
    const unclosedMatch = msg.match(/^Unclosed tag: <([\w-]+)>/);
    if (unclosedMatch) {
      const tag = unclosedMatch[1];
      const insertPos = d.range.end; // insert closing at end of node range
      const edit: TextEdit = TextEdit.insert(insertPos, `</${tag}>`);
      actions.push({
        title: `Insert </${tag}>`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [d],
        edit: { changes: { [document.uri]: [edit] } }
      });
    }
  }

  return actions;
}

function insertEqualsQuotesEdit(range: Range): TextEdit | null {
  // Insert ="" at the end of the attribute name token.
  // We place it at the diagnostic end position to keep it simple.
  return TextEdit.insert(range.end, '=""');
}
