/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Client-side extension entry point for the SwissJS VSCode extension
 */

// TODO(tech-debt): VSCode extension stabilization work
// - Activation sources: We currently contribute a custom language `swissjs` and
//   also associate `.ui` with `typescriptreact`. Align contribution + activation
//   so we have a single coherent activation source and no double-language
//   processing. See package.json `activationEvents` and `contributes.languages`.
// - Client start failures: Investigate intermittent "Client is not running ... startFailed".
//   Likely root causes include incorrect server path (fixed to server/dist/server.js),
//   missing environment, or race around documentSelector when both providers attach.
//   Add robust start/stop logging and a retry-once policy.
// - Document selector: We target `{ language: 'typescriptreact', pattern: '**/*.ui' }`.
//   Validate end-to-end that TS/React features and our LSP features coexist cleanly
//   and that we don't register duplicate handlers.
// - Telemetry/logging: Add a rolling output channel with timestamps; surface
//   errors from the server process for easier diagnostics.
// - Tests: Add client-side unit tests for activation flow and error handling.
// - Packaging: Confirm minimal file whitelist and consider source maps strategy.
// - Engines: We require Node 20 in engines. Ensure dev/debug tasks use Node 20.
// - TypeDoc: Ensure reflection is consistently built with package tsconfig.

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import * as path from 'path';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  console.log('SwissJS extension is now active!');

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', 'dist', 'server.js')
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
    // Register for .ui files treated as TypeScript React
    documentSelector: [
      { scheme: 'file', language: 'typescriptreact', pattern: '**/*.ui' }
    ],
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

  // Start the client. This will also launch the server
  client.start();

  // Register commands
  const disposable = vscode.commands.registerCommand('swissjs.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from SwissJS!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
