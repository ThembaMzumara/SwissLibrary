/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { UiCompiler } from "../src/index";

async function withTempFile(
  ext: string,
  contents: string,
  fn: (file: string) => Promise<void>,
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "swiss-compiler-"));
  const file = path.join(dir, `Temp${ext}`);
  await fs.writeFile(file, contents, "utf-8");
  try {
    await fn(file);
  } finally {
    await fs.remove(dir);
  }
}

describe("Template integration (.ui)", () => {
  it("converts html template literals in .ui files", async () => {
    const compiler = new UiCompiler();
    // prettier-ignore
    const tpl = `
      import { SwissComponent, html } from "@swissjs/core";

      export class TestComponent extends SwissComponent {
        render() {
          return html\`<div class="card">Hello</div>\`;
        }
      }
    `;

    await withTempFile(".ui", tpl, async (file) => {
      const out = await compiler.compileFile(file);

      // .ui files with HTML templates should be converted to string literals
      expect(out).toContain('"<div class="card">Hello</div>"');
      expect(out).toContain("SwissComponent");
      expect(out).not.toContain("createElement"); // No JSX transformation
      expect(out).not.toContain("html`"); // html templates are converted
    });
  });

  it("converts html template literals with interpolations", async () => {
    const compiler = new UiCompiler();
    // prettier-ignore
    const tpl = `
      import { SwissComponent, html } from "@swissjs/core";

      export class AppCard extends SwissComponent {
        render() {
          return html\`<div title="\${this.props.title}">Content</div>\`;
        }
      }
    `;

    await withTempFile(".ui", tpl, async (file) => {
      const out = await compiler.compileFile(file);

      // Should convert template literal with interpolations to string concatenation
      expect(out).toContain('"<div title="');
      expect(out).toContain("this.props.title");
      expect(out).toContain('>Content</div>"');
      expect(out).toContain("AppCard");
      expect(out).not.toContain("createElement"); // No JSX transformation
      expect(out).not.toContain("html`"); // html templates are converted
    });
  });

  it("handles invalid TypeScript syntax in .ui files", async () => {
    const compiler = new UiCompiler();
    const tpl = "invalid typescript syntax here!!!";
    await withTempFile(".ui", tpl, async (file) => {
      // .ui files with invalid TypeScript should still be passed through
      // (TypeScript compiler will catch syntax errors later in the pipeline)
      const out = await compiler.compileFile(file);
      expect(out).toContain("invalid typescript syntax here!!!");
    });
  });
});
