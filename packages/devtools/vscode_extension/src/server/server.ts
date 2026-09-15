/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Language Server Protocol (LSP) server for SwissJS
 */

// TODO(tech-debt): Server stabilization
// - Startup diagnostics: add verbose logging for onInitialize/onInitialized,
//   transport readiness, and document open notifications to diagnose rare
//   start failures.
// - Error surfacing: when an exception happens during init/feature handlers,
//   forward to client output channel with actionable hints.
// - Feature gating: ensure features only attach to `**/*.ui` when appropriate
//   to avoid double-handling with TS/React providers.
// - Configuration: validate `swissjs.trace.server` and add schema/defaults tests.
// - Tests: add unit tests for diagnostics/completions/formatting entrypoints.
// - Performance: profile completion/diagnostics on large .ui files.

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  CompletionItem,
  TextDocumentPositionParams,
  Definition,
  Hover,
  DocumentSymbol,
  DocumentSymbolParams,
  DocumentFormattingParams,
  CodeAction,
  TextDocumentChangeEvent,
  TextEdit,
  InitializeResult,
  DidChangeConfigurationNotification,
  CompletionParams
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { validateDocument } from './language/diagnostics';
import { getCompletions } from './language/completions';
import { getDocumentSymbols } from './language/symbols';
import { getHoverInfo } from './language/hover';
import { findDefinition } from './language/definitions';
import { getFormattingEdits } from './language/formatting';
import { getCodeActions } from './language/codeActions';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Track if we've received the initialization request
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

// Workspace settings cache and defaults
type SwissServerSettings = {
  trace: 'off' | 'messages' | 'verbose';
};

const defaultSettings: SwissServerSettings = { trace: 'off' };
let globalSettings: SwissServerSettings = defaultSettings;
const documentSettings: Map<string, Thenable<SwissServerSettings>> = new Map();

function getDocumentSettings(resource: string): Thenable<SwissServerSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'swissjs'
    }).then((config) => {
      const trace = (config?.trace?.server as SwissServerSettings['trace']) ?? 'off';
      return { trace };
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// When the client first connects
connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      // Tell the client what features we support
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['<', ' ', '=', '"', ':', '@']
      },
      hoverProvider: true,
      definitionProvider: true,
      documentSymbolProvider: true,
      documentFormattingProvider: true
    }
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }

  return result;
});

// After initialization, register for configuration changes
connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      // Touch the parameter to satisfy no-unused-vars
      void _event;
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// Clear settings cache on configuration changes
connection.onDidChangeConfiguration(async () => {
  documentSettings.clear();
  globalSettings = defaultSettings;
  // Re-validate all open documents when settings change
  for (const doc of documents.all()) {
    validateWithDebounce(doc);
  }
});

// Debounced validation per document (sends diagnostics)
const debounceTimers: Map<string, NodeJS.Timeout> = new Map();
function validateWithDebounce(doc: TextDocument, delayMs = 150): void {
  const key = doc.uri;
  const existing = debounceTimers.get(key);
  if (existing) {
    clearTimeout(existing);
  }
  const handle = setTimeout(async () => {
    try {
      const diags = await validateDocument(doc);
      connection.sendDiagnostics({ uri: doc.uri, diagnostics: diags });
    } catch (err) {
      connection.console.error(`validateDocument error for ${key}: ${String(err)}`);
    } finally {
      debounceTimers.delete(key);
    }
  }, delayMs);
  debounceTimers.set(key, handle);
}

// The content of a text document has changed
// This event is emitted when the document is first opened or when its content has changed
documents.onDidChangeContent((change: TextDocumentChangeEvent<TextDocument>) => {
  // Revalidate the document on changes (debounced to reduce churn)
  validateWithDebounce(change.document);
});

// Document open/close telemetry and validation
documents.onDidOpen(async (e: TextDocumentChangeEvent<TextDocument>) => {
  try {
    connection.telemetry.logEvent?.({ type: 'doc:open', uri: e.document.uri });
    validateWithDebounce(e.document, 50);
  } catch (err) {
    connection.console.error(`onDidOpen error: ${String(err)}`);
  }
});

documents.onDidClose((e: TextDocumentChangeEvent<TextDocument>) => {
  try {
    connection.telemetry.logEvent?.({ type: 'doc:close', uri: e.document.uri });
    connection.sendDiagnostics({ uri: e.document.uri, diagnostics: [] });
  } catch (err) {
    connection.console.error(`onDidClose error: ${String(err)}`);
  }
});

// Completion provider
connection.onCompletion(
  (params: CompletionParams): CompletionItem[] => {
    try {
      const document = documents.get(params.textDocument.uri);
      if (!document) {
        return [];
      }
      return getCompletions(document, params.position);
    } catch (err) {
      connection.console.error(`onCompletion error: ${String(err)}`);
      return [];
    }
  }
);

// Resolve additional information for a completion item (if needed)
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

// Hover provider
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  try {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    // Touch settings to honor potential trace level per document (and avoid unused warnings)
    void getDocumentSettings(document.uri);
    return getHoverInfo(document, params.position);
  } catch (err) {
    connection.console.error(`onHover error: ${String(err)}`);
    return null;
  }
});

// Go to definition provider
connection.onDefinition((params: TextDocumentPositionParams): Definition | null => {
  try {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    return findDefinition(document, params.position);
  } catch (err) {
    connection.console.error(`onDefinition error: ${String(err)}`);
    return null;
  }
});

// Document symbols provider
connection.onDocumentSymbol((params: DocumentSymbolParams): DocumentSymbol[] => {
  try {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }
    return getDocumentSymbols(document);
  } catch (err) {
    connection.console.error(`onDocumentSymbol error: ${String(err)}`);
    return [];
  }
});

// Document formatting provider
connection.onDocumentFormatting((params: DocumentFormattingParams): TextEdit[] => {
  try {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }
    return getFormattingEdits(document);
  } catch (err) {
    connection.console.error(`onDocumentFormatting error: ${String(err)}`);
    return [];
  }
});

// Code actions provider (MVP)
connection.onCodeAction((params): CodeAction[] => {
  try {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }
    return getCodeActions(document, params);
  } catch (err) {
    connection.console.error(`onCodeAction error: ${String(err)}`);
    return [];
  }
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection (after documents are wired)
connection.listen();

// Listen on the connection for exit notification
connection.onExit(() => {
  // Clean up resources if needed
});

// Log uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in language server:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in language server:', reason);
});

// Log when the server starts
console.log('SwissJS language server is now running in node process');

// (trace helper removed; reintroduce when needed to avoid unused symbol lints)
