// import * as path from 'path'; // Unused

/**
 * Handles import rewriting for .ui and .uix files and 1ui imports
 */
export function processImports(source: string, filePath: string): string {
  // Note: .ui file imports are handled by the Vite plugin, not the compiler
  // The compiler should not transform .ui imports to .ui.js in Vite environments
  const processed = source;

  // Note: .uix file imports are handled by the Vite plugin, not the compiler
  // The compiler should not transform .uix imports to .uix.js

  // Check for invalid imports
  if (/from\s+['"]1ui['"]/.test(processed)) {
    throw new Error(
      `Invalid import: '1ui' found in ${filePath}. JSX runtime should be imported from '@swissjs/core'.`,
    );
  }

  return processed;
}
