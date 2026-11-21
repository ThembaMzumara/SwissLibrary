<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Language Support (VSCode/Windsurf)

Provides comprehensive language support for SwissJS `.ui` files with syntax highlighting, IntelliSense, and more.

## Features

- **Syntax Highlighting**: Full support for SwissJS syntax in `.ui` files
- **IntelliSense**: Smart completions for tags, attributes, and expressions
  - Event handler completions with snippets (`on:click="$1"`, `@event="$1"`)
  - Boolean and enumerated attribute value completions
  - Registry-based tag and component suggestions
- **Diagnostics**: Real-time error checking and validation
  - Smart error suggestions using Levenshtein distance
  - SwissJS-specific validation rules
- **Hover Information**: Quick documentation on hover
- **Go to Definition**: Navigate to component definitions
- **Document Symbols**: Hierarchical outline view for quick navigation
- **Snippets**: Handy code templates for common patterns
- **Formatting**: Code formatting with indentation and attribute spacing
- **Code Actions**: Quick fixes for common syntax issues

## Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code/Windsurf
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "SwissJS Language Support"
4. Click Install

### From VSIX (Development Build)

1. Build the extension package:

   ```bash
   pnpm --filter @swissjs/vscode-swiss package
   ```

   This will generate a `.vsix` file in the extension directory.

2. Install the extension:
   - Open VS Code or Windsurf
   - Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
   - Click on the `...` menu and select `Install from VSIX...`
   - Select the generated `.vsix` file

3. Open a `.ui` file to activate the extension

### From Marketplace (Coming Soon)

```bash
ext install SwissJS.swissjs
```

## Technical Architecture

### Language Server Protocol (LSP)

The extension implements a full LSP server with the following components:

- **Parser & AST**: SwissJS-specific parser with AST node types
- **Diagnostics**: Real-time validation with smart error suggestions
- **Completions**: Context-aware completions with snippet support
- **Symbols**: Hierarchical document symbols for outline view
- **Formatting**: MVP formatting with indentation and attribute spacing
- **Code Actions**: Quick fixes for common syntax issues
- **Hover**: Documentation and type information on hover
- **Definitions**: Go-to-definition support for components

### Shared Utilities

- **String Utilities**: Levenshtein distance, fuzzy matching, prefix filtering
- **Range Utilities**: Position/range manipulation, text extraction, validation
- **Registry**: Known HTML tags, attributes, events, and SwissJS components
- **Logging**: Configurable logging with performance measurement

## Development

### Prerequisites

- Node.js 16+ and pnpm
- VS Code or Windsurf

### Building the Extension

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the extension:

   ```bash
   pnpm build
   ```

3. For development with auto-reload:
   ```bash
   pnpm watch
   ```

### Debugging

1. Open the extension in VS Code/Windsurf
2. Set breakpoints in your code
3. Press F5 to launch the Extension Development Host
4. The extension will be loaded in a new window where you can test your changes

## Configuration

The following settings are available:

- `swissjs.format.enable`: Enable/disable formatting for SwissJS files (default: `true`)
- `swissjs.trace.server`: Traces the communication between VS Code and the language server (default: `off`)

## Snippets

The extension provides several useful snippets for SwissJS development:

- `swiss-component`: Creates a new SwissJS component
- `html`: HTML template literal tag
- `css`: CSS template literal tag
- `onmount`: Add @onMount lifecycle hook
- `onupdate`: Add @onUpdate lifecycle hook
- `prop`: Add a property with @property decorator
- `state`: Add a reactive state property
- And many more...

## Language Server Protocol

The extension includes a custom LSP server for SwissJS that provides:

- Syntax validation
- Code completion
- Hover information
- Document symbols
- And more...

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

MIT © [SwissJS Team](https://github.com/your-org/swiss)
