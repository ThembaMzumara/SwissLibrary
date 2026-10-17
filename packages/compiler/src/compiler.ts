import * as path from "node:path";
import * as ts from "typescript";
import * as fsp from "node:fs/promises";
import { transform } from "esbuild";
import type { CompileOptions } from "./types.js";
import { processImports } from "./transformers/import-processor.js";
import { convertHtmlTemplates } from "./utils/template-utils.js";
import { typeSyntaxStripperTransformer } from "./transformers/type-syntax-stripper.js";
import { findFiles, ensureDirectoryExists } from "./utils/file-utils.js";
import {
  findTypeScriptFiles,
  compileTypeScriptToJavaScript as transpileTs,
} from "./utils/typescript-utils.js";

export class UiCompiler {
  private options: CompileOptions;

  constructor(options: CompileOptions = {}) {
    this.options = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      sourceMap: true,
      ...options,
    };
  }

  async compileFile(filePath: string, outputPath?: string): Promise<string> {
    const source = await this.readFile(filePath);
    const compiled = await this.compile(source, filePath);

    if (outputPath) {
      await this.writeFile(outputPath, compiled);
    }

    return compiled;
  }

  // Compile method with support for both sync and async operations
  // For backward compatibility, it's marked as async but can be used synchronously for simple cases
  async compile(source: string, filePath: string): Promise<string> {
    // Process imports
    let result = processImports(source, filePath);

    // Check if this is a .uix file (JSX support)
    const isUixFile = filePath.endsWith(".uix");

    if (isUixFile) {
      // Transform JSX in .uix files
      try {
        const { transformWithJsx } = await import(
          "./transformers/jsx-transformer.js"
        );
        result = transformWithJsx(result, filePath);
      } catch (error) {
        console.error("Error transforming JSX:", error);
        throw error;
      }
    }

    // Check for HTML templates (synchronous processing)
    const hasHtmlTemplates = result.includes("html`");

    if (hasHtmlTemplates) {
      // Convert HTML template literals (synchronous)
      result = convertHtmlTemplates(result);
    }

    // For JSX and TypeScript, we need async processing
    // This method is kept synchronous for backward compatibility with tests
    // For full async processing, use compileAsync
    return result;
  }

  // Async compile method for complex cases (JSX, TypeScript)
  async compileAsync(source: string, filePath: string): Promise<string> {
    // For .uix files, we've already handled JSX in the compile method
    if (filePath.endsWith(".uix")) {
      return this.compile(source, filePath);
    }

    // For .ui files, just handle HTML templates and imports
    if (filePath.endsWith(".ui")) {
      let result = processImports(source, filePath);

      // Handle HTML templates if present
      if (result.includes("html`")) {
        result = convertHtmlTemplates(result);
      }

      // THEN transform TypeScript syntax
      result = await this.transformTypeScriptWithEsbuild(result, filePath);
      // Strip TypeScript-only syntax using AST-based transformer
      result = this.stripTypeScriptSyntaxWithAST(result, filePath);
      return result;
    }

    // Handle .tsx files (standard TypeScript + JSX)
    if (filePath.endsWith(".tsx")) {
      return this.transformJsxWithEsbuild(source, filePath);
    }

    return source;
  }

  private async transformJsxWithEsbuild(
    source: string,
    filePath: string,
  ): Promise<string> {
    try {
      // Add createElement import if JSX is present and import doesn't exist
      let modifiedSource = source;
      const hasCreateElementImport =
        /import\s+\{[^}]*\bcreateElement\b[^}]*\}\s+from\s+['"]@swissjs\/core['"]/i.test(
          source,
        );

      if (!hasCreateElementImport) {
        // Add the import at the top after other imports
        const importStatement =
          "import { createElement, Fragment } from '@swissjs/core';\n";

        // Find the last import statement
        const importRegex = /^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm;
        const imports = source.match(importRegex);

        if (imports && imports.length > 0) {
          // Insert after the last import
          const lastImport = imports[imports.length - 1];
          const lastImportIndex = source.lastIndexOf(lastImport);
          const insertIndex = lastImportIndex + lastImport.length;
          modifiedSource =
            source.slice(0, insertIndex) +
            "\n" +
            importStatement +
            source.slice(insertIndex);
        } else {
          // No imports found, add at the beginning
          modifiedSource = importStatement + "\n" + source;
        }
      }

      // Use esbuild to transform JSX - much more reliable than TypeScript
      const result = await transform(modifiedSource, {
        loader: "tsx",
        jsx: "transform",
        jsxFactory: "createElement",
        jsxFragment: "Fragment",
        target: "es2020",
        format: "esm",
      });

      return result.code;
    } catch (error) {
      console.error(`[JSX Transform] esbuild ERROR in ${filePath}:`, error);
      // Return original source on error
      return source;
    }
  }

  private async transformTypeScriptWithEsbuild(
    source: string,
    filePath: string,
  ): Promise<string> {
    try {
      // Use esbuild to transform TypeScript syntax to JavaScript
      const result = await transform(source, {
        loader: "ts", // TypeScript loader
        target: "es2020",
        format: "esm",
        // Remove type-only imports and exports
        treeShaking: true,
        // Keep JSX syntax for later processing
        jsx: "preserve",
      });

      return result.code;
    } catch (error) {
      console.error(
        `[TypeScript Transform] esbuild ERROR in ${filePath}:`,
        error,
      );
      // Return original source on error to allow debugging
      return source;
    }
  }

  private stripTypeScriptSyntaxWithAST(
    source: string,
    filePath: string,
  ): string {
    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const result = ts.transform(sourceFile, [typeSyntaxStripperTransformer()]);
    const printer = ts.createPrinter();
    const output = printer.printFile(result.transformed[0] as ts.SourceFile);
    result.dispose();
    return output;
  }

  async compileDirectory(inputDir: string, outputDir: string): Promise<void> {
    const files = await findFiles(inputDir, ".ui");
    for (const file of files) {
      const relativePath = path.relative(inputDir, file);
      const outputPath = path.join(
        outputDir,
        relativePath.replace(/\.ui$/, ".js"),
      );
      await this.compileFile(file, outputPath);
    }
  }

  /**
   * Transpile all TypeScript files under inputDir to JavaScript into outputDir.
   * Used by the CLI build to finalize the .swiss-temp output.
   */
  async compileTypeScriptToJavaScript(
    inputDir: string,
    outputDir: string,
  ): Promise<boolean> {
    try {
      const tsFiles = await findTypeScriptFiles(inputDir);
      for (const tsFile of tsFiles) {
        const rel = path.relative(inputDir, tsFile);
        const outFile = path.join(outputDir, rel).replace(/\.ts$/, ".js");
        const source = await this.readFile(tsFile);
        const js = await transpileTs(source, tsFile, {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          sourceMap: true,
        });
        await ensureDirectoryExists(path.dirname(outFile));
        await fsp.writeFile(outFile, js, "utf-8");
      }
      return true;
    } catch (error) {
      console.error("TypeScript transpile failed:", error);
      return false;
    }
  }

  async watch(inputPath: string, outputPath?: string): Promise<void> {
    const chokidar = await import("chokidar");
    const watcher = chokidar.watch(inputPath, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("change", async (file: string) => {
      if (file.endsWith(".ui")) {
        try {
          console.log(`Recompiling ${path.relative(process.cwd(), file)}`);
          await this.compileFile(
            file,
            outputPath || file.replace(/\.ui$/, ".js"),
          );
        } catch (error) {
          console.error("Compilation error:", error);
        }
      }
    });
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      const content = await fsp.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}\n${error}`);
    }
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await ensureDirectoryExists(path.dirname(filePath));
      await fsp.writeFile(filePath, content, "utf-8");
    } catch (error) {
      throw new Error(`Failed to write file: ${filePath}\n${error}`);
    }
  }
}
