/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compileUiFilesToTemp } from "../commands/build.js";
import * as fs from "fs-extra";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, "__fixtures__");
const tempDir = path.join(fixturesPath, ".temp");

// Mock the UiCompiler
vi.mock("@swissjs/compiler", () => ({
  UiCompiler: vi.fn().mockImplementation(() => ({
    compileFile: vi.fn(async (filePath: string) => {
      const content = await fs.readFile(filePath, "utf-8");
      return `// Compiled from ${path.basename(filePath)}\n${content}`;
    }),
  })),
}));

describe("compileUiFilesToTemp", () => {
  beforeEach(async () => {
    // Create test fixtures
    await fs.ensureDir(path.join(fixturesPath, "src"));
    await fs.writeFile(
      path.join(fixturesPath, "src", "test.ui"),
      "html`<div>Test UI</div>`",
    );
    await fs.writeFile(
      path.join(fixturesPath, "src", "component.uix"),
      "const Component = () => <div>Test UIX</div>;\nexport default Component;",
    );
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    // Clean up
    await fs.remove(tempDir);
    await fs.remove(path.join(fixturesPath, "src"));
  });

  it("should compile .ui files to TypeScript in temp directory", async () => {
    await compileUiFilesToTemp(
      path.join(fixturesPath, "src"),
      tempDir,
      true, // debug
    );

    // Check if .ui file was compiled
    const uiOutputPath = path.join(tempDir, "test.ui");
    expect(await fs.pathExists(uiOutputPath)).toBe(true);

    const uiContent = await fs.readFile(uiOutputPath, "utf-8");
    expect(uiContent).toContain("// Compiled from test.ui");
    expect(uiContent).toContain("Test UI");
  });

  it("should compile .uix files to TypeScript in temp directory", async () => {
    await compileUiFilesToTemp(
      path.join(fixturesPath, "src"),
      tempDir,
      true, // debug
    );

    // Check if .uix file was compiled
    const uixOutputPath = path.join(tempDir, "component.ts");
    expect(await fs.pathExists(uixOutputPath)).toBe(true);

    const uixContent = await fs.readFile(uixOutputPath, "utf-8");
    expect(uixContent).toContain("// Compiled from component.uix");
    expect(uixContent).toContain("Test UIX");
  });

  it("should maintain directory structure when compiling files", async () => {
    // Create a nested directory structure
    const nestedDir = path.join(fixturesPath, "src", "components");
    await fs.ensureDir(nestedDir);
    await fs.writeFile(
      path.join(nestedDir, "nested.uix"),
      "const Nested = () => <div>Nested Component</div>;\nexport default Nested;",
    );

    await compileUiFilesToTemp(
      path.join(fixturesPath, "src"),
      tempDir,
      true, // debug
    );

    // Check if nested .uix file was compiled with correct path
    const nestedOutputPath = path.join(tempDir, "components", "nested.ts");
    expect(await fs.pathExists(nestedOutputPath)).toBe(true);

    const nestedContent = await fs.readFile(nestedOutputPath, "utf-8");
    expect(nestedContent).toContain("// Compiled from nested.uix");
    expect(nestedContent).toContain("Nested Component");
  });
});
