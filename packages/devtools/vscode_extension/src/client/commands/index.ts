/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Command registration for the SwissJS VSCode extension
 */

import * as vscode from 'vscode';

/**
 * Register all commands for the extension
 */
export function registerCommands(context: vscode.ExtensionContext) {
  // Register the hello world command
  const helloWorldCommand = vscode.commands.registerCommand('swissjs.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from SwissJS!');
  });
  
  // Register create component command
  const createComponentCommand = vscode.commands.registerCommand('swissjs.createComponent', createNewComponent);
  
  // Register preview component command
  const previewCommand = vscode.commands.registerCommand('swissjs.preview', previewComponent);
  
  // Add all commands to the context
  context.subscriptions.push(
    helloWorldCommand,
    createComponentCommand,
    previewCommand
  );
}

// Export individual command functions for better code organization
export async function createNewComponent() {
  const componentName = await vscode.window.showInputBox({
    prompt: 'Enter component name',
    placeHolder: 'e.g., MyComponent',
    validateInput: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Component name cannot be empty';
      }
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
        return 'Component name must start with an uppercase letter and contain only alphanumeric characters';
      }
      return null;
    }
  });
  
  if (!componentName) {
    return; // User cancelled
  }
  
  // Create the component file content
  const componentContent = `import { SwissComponent, html } from '@swissjs/core';

export class ${componentName} extends SwissComponent<{ title?: string; description?: string }> {
  render() {
    const { title = '${componentName}', description = 'A new SwissJS component' } = this.props;
    
    return html\`
      <div class="${componentName.toLowerCase()}">
        <h1>\${title}</h1>
        <p>\${description}</p>
        \${this.getStyles()}
      </div>
    \`;
  }

  private getStyles(): string {
    return html\`
      <style>
        .${componentName.toLowerCase()} {
          padding: 1rem;
        }

        .${componentName.toLowerCase()} h1 {
          color: #333;
          margin-bottom: 0.5rem;
        }
      </style>
    \`;
  }
}
`;

  // Get the current workspace folder
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found. Please open a folder first.');
    return;
  }

  // Create the file path
  const fileName = `${componentName}.ui`;
  const filePath = vscode.Uri.joinPath(workspaceFolder.uri, 'src', 'components', fileName);

  try {
    // Create the file
    await vscode.workspace.fs.writeFile(filePath, new TextEncoder().encode(componentContent));
    
    // Open the file
    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);
    
    vscode.window.showInformationMessage(`Successfully created component: ${componentName}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create component: ${error}`);
  }
}

export async function previewComponent() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage('No active editor found. Please open a SwissJS component file.');
    return;
  }

  const document = activeEditor.document;
  if (!document.fileName.endsWith('.ui')) {
    vscode.window.showErrorMessage('Please open a SwissJS component file (.ui) to preview.');
    return;
  }

  // For now, show a simple preview message with file info
  const fileName = document.fileName.split('/').pop() || 'Unknown';
  const lineCount = document.lineCount;
  const componentName = fileName.replace('.ui', '');
  
  const previewInfo = `**Component Preview: ${componentName}**\n\n` +
    `📄 **File:** ${fileName}\n` +
    `📏 **Lines:** ${lineCount}\n` +
    `🔧 **Language:** SwissJS\n\n` +
    `*Full preview functionality with live rendering will be available in a future update.*`;

  // Show preview in an information message for now
  // In the future, this could open a webview panel with live preview
  vscode.window.showInformationMessage(
    `Preview for ${componentName}`,
    { modal: false },
    'View Details'
  ).then((selection: string | undefined) => {
    if (selection === 'View Details') {
      // Show detailed preview info
      vscode.window.showInformationMessage(previewInfo);
    }
  });
}
