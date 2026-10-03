import * as ts from "typescript";
import fs from "fs-extra";
import * as path from "path";

/**
 * Compiles TypeScript code to JavaScript
 */
export async function compileTypeScriptToJavaScript(
  source: string,
  filePath: string,
  options: {
    target?: ts.ScriptTarget;
    module?: ts.ModuleKind;
    sourceMap?: boolean;
  } = {},
): Promise<string> {
  const compilerOptions: ts.CompilerOptions = {
    target: options.target || ts.ScriptTarget.ES2020,
    module: options.module || ts.ModuleKind.ESNext,
    strict: false,
    skipLibCheck: true,
    removeComments: false,
    preserveConstEnums: true,
    declaration: false,
    sourceMap: options.sourceMap !== false,
    isolatedModules: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    jsx: ts.JsxEmit.Preserve,
  };

  // Pre-process to handle 'import type' statements
  const processedSource = source
    // Remove 'import type' statements (they're only for TypeScript)
    .replace(/import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, "")
    // Convert regular type-only imports to comments
    .replace(/\/\/\s*import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, "");

  // Transpile TypeScript to JavaScript
  const result = ts.transpileModule(processedSource, {
    compilerOptions,
    fileName: filePath,
  });

  return result.outputText;
}

/**
 * Finds all TypeScript files in a directory recursively
 */
export async function findTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findTypeScriptFiles(fullPath)));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}
