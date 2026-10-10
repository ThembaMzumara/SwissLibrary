/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Curated barrel to avoid duplicate re-exports
export { activate, deactivate } from "./client/extension.js";
export * from "./client/commands/index.js";
export * from "./client/providers/completionProvider.js";
export * from "./client/providers/definitionProvider.js";
export * from "./client/providers/documentSymbolProvider.js";
export * from "./client/providers/hoverProvider.js";
export * from "./client/providers/index.js";
export * from "./server/astTypes.js";
export * from "./server/index.js";
export * from "./server/language/codeActions.js";
export * from "./server/language/completions.js";
export * from "./server/language/definitions.js";
export * from "./server/language/diagnostics.js";
export * from "./server/language/formatting.js";
export * from "./server/language/hover.js";
export * from "./server/language/index.js";
export * from "./server/language/symbols.js";
export * from "./server/parser/index.js";
export * from "./server/parser/nodeAtPosition.js";
export * from "./server/parser/swissParser.js";
export * from "./server/server.js";
export * from "./server/shared/logUtils.js";
export * from "./server/shared/registry.js";
export * from "./server/shared/stringUtils.js";
export * from "./server/shared/templateUtils.js";
export * from "./shared/index.js";
export * from "./shared/types.js";
export * from "./shared/utils.js";
