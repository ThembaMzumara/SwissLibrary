/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Diagnostics provider for SwissJS files
 */

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SwissParser } from '../parser';
import { ASTNode, TagNode, DocumentNode } from '../astTypes';
import { isKnownTag, isEventAttribute, isBindingAttribute, knownHtmlTags, knownHtmlAttributes } from '../shared/registry';
import { suggestCorrections } from '../shared';

// Known tags are provided via shared registry (knownSwissTags, knownHtmlTags)

/**
 * Validates a SwissJS document and returns diagnostics
 */
export function validateDocument(document: TextDocument): Diagnostic[] {
  const text = document.getText();
  const diagnostics: Diagnostic[] = [];

  try {
    // Parse the document to catch syntax errors
    const parser = new SwissParser(text);
    const ast = parser.parse();

    // Validate tags and attributes
    validateNode(ast, diagnostics, document);

  } catch (error) {
    if (error instanceof Error) {
      // Add a diagnostic for the parsing error
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 100 }
        },
        message: `Parse error: ${error.message}`,
        source: 'swissjs'
      });
    }
  }

  return diagnostics;
}

/**
 * Recursively validate AST nodes for unknown tags and invalid attributes
 */
function validateNode(node: ASTNode, diagnostics: Diagnostic[], document: TextDocument): void {
  if (node.type === 'Tag') {
    const tagNode = node as TagNode;

    // Unknown tag (treat as Error per tests)
    if (!isKnownTag(tagNode.name)) {
      const allKnownTags = Array.from(knownHtmlTags);
      const suggestions = suggestCorrections(tagNode.name, allKnownTags, 2);
      const suggestionText = suggestions.length > 0 
        ? ` Did you mean: ${suggestions.join(', ')}?`
        : '';
      
      diagnostics.push(createNodeDiagnostic(
        document,
        tagNode,
        DiagnosticSeverity.Error,
        `Unknown tag: '${tagNode.name}'.${suggestionText}`
      ));
    }

    // Duplicate attributes check
    const seen = new Set<string>();
    for (const attr of tagNode.attributes) {
      if (seen.has(attr.name)) {
        diagnostics.push(createNodeDiagnostic(document, attr, DiagnosticSeverity.Warning, `Duplicate attribute: ${attr.name}`));
      }
      seen.add(attr.name);

      // Attribute validity
      const name = attr.name;
      const hasValue = typeof attr.value === 'string' && attr.value.length > 0;

      // Event attributes
      if (isEventAttribute(name)) {
        if (!hasValue) {
          diagnostics.push(createNodeDiagnostic(document, attr, DiagnosticSeverity.Warning, `Event attribute '${name}' requires a handler value`));
        }
        continue;
      }

      // Binding attributes
      if (isBindingAttribute(name)) {
        if (!hasValue) {
          diagnostics.push(createNodeDiagnostic(document, attr, DiagnosticSeverity.Error, `Binding attribute '${name}' requires a value`));
        }
        continue;
      }

      // Boolean attributes are allowed without value if they are standard HTML ones
      const baseName = name;
      const isPossiblyBoolean = ['disabled','readonly','required','checked','multiple','selected','hidden'].includes(baseName);
      if (!hasValue && !isPossiblyBoolean) {
        // allow missing value for boolean only
        // Not an error yet; many HTML attributes may be valueless in some syntaxes, keep as info
      }

      // Invalid attribute (not html, not binding/event) -> Warning per tests
      if (!knownHtmlAttributes.has(baseName)) {
        diagnostics.push(createNodeDiagnostic(document, attr, DiagnosticSeverity.Warning, `Invalid attribute: ${name}`));
      }
    }

    // Unclosed tag
    if (tagNode.unclosed) {
      diagnostics.push(createNodeDiagnostic(document, tagNode, DiagnosticSeverity.Error, `Unclosed tag: <${tagNode.name}>`));
    }

    // Recurse children
    for (const child of tagNode.children) validateNode(child as ASTNode, diagnostics, document);
  } else if (node.type === 'Document') {
    for (const child of (node as DocumentNode).children) validateNode(child as ASTNode, diagnostics, document);
  }
}

/**
 * Checks if an attribute is valid
 */
// Keep space for future granular attribute validation if needed

/**
 * Creates a Diagnostic object for a given range and message
 */
function createDiagnostic(document: TextDocument, startOffset: number, endOffset: number, severity: DiagnosticSeverity, message: string): Diagnostic {
  return {
    severity,
    range: Range.create(document.positionAt(startOffset), document.positionAt(endOffset)),
    message,
    source: 'swissjs'
  };
}

function createNodeDiagnostic(document: TextDocument, node: { range: { start: { offset: number }; end: { offset: number } } }, severity: DiagnosticSeverity, message: string): Diagnostic {
  return createDiagnostic(document, node.range.start.offset, node.range.end.offset, severity, message);
}

/**
 * Validates a specific portion of the document (for incremental validation)
 */
export function validateTextDocument(
  document: TextDocument,
  _contentChanges: { range: { start: number; end: number } }[]
): Diagnostic[] {
  // For now, just revalidate the whole document
  // In the future, we could optimize this to only validate the changed portions
  // Touch the parameter to satisfy no-unused-vars without changing behavior
  void _contentChanges.length;
  return validateDocument(document);
}
