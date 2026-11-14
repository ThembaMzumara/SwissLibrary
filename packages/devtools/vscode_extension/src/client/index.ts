/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Client-side entry point for the SwissJS VSCode extension
 */

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import * as path from 'path';
import { registerCommands } from './commands';
import { SwissCompletionProvider } from './providers/completionProvider';
import { SwissDefinitionProvider } from './providers/definitionProvider';
import { SwissDocumentSymbolProvider } from './providers/documentSymbolProvider';
import { SwissHoverProvider } from './providers/hoverProvider';

// Global client reference
let client: LanguageClient;

/**
 * Activates the SwissJS VSCode extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('SwissJS extension is now active!');

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('dist', 'server', 'server.js')
  );

  // If the extension is launched in debug mode, enable debug logging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // Configure the server options
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] }
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for swissjs documents
    documentSelector: [{ scheme: 'file', language: 'swissjs' }],
    synchronize: {
      // Notify the server about file changes to '.ui' files contained in the workspace
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.ui')
    }
  };

  // Create the language client and start the client
  client = new LanguageClient(
    'swissjsLanguageServer',
    'SwissJS Language Server',
    serverOptions,
    clientOptions
  );

  // Register commands
  registerCommands(context);

  // Register providers
  registerLanguageProviders(context);

  // Start the client. This will also launch the server
  client.start();
}

/**
 * Registers all language feature providers
 */
function registerLanguageProviders(context: vscode.ExtensionContext) {
  // Register completion provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'swissjs',
    new SwissCompletionProvider(client),
    '<', // Trigger completion on <
    ' ', // Trigger completion on space
    '=', // Trigger completion on =
    '"' // Trigger completion on "
  );

  // Register hover provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    'swissjs',
    new SwissHoverProvider(client)
  );

  // Register definition provider
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    'swissjs',
    new SwissDefinitionProvider(client)
  );

  // Register document symbol provider
  const documentSymbolProvider = vscode.languages.registerDocumentSymbolProvider(
    'swissjs',
    new SwissDocumentSymbolProvider(client)
  );

  // Add all providers to the context's subscriptions
  context.subscriptions.push(
    completionProvider,
    hoverProvider,
    definitionProvider,
    documentSymbolProvider
  );
}

/**
 * Deactivates the SwissJS VSCode extension
 */
export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
