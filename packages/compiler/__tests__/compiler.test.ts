/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from "vitest";
import { UiCompiler } from "../src/index";

describe("Compiler Package", () => {
  it("runs a basic test", () => {
    expect(true).toBe(true);
  });

  it("processes html template literals in .ui files", async () => {
    const compiler = new UiCompiler({ outputFormat: "javascript" });

    // Test simple HTML template literal
    const simpleSource = `
import { SwissComponent, html } from "@swissjs/core";

export class TestComponent extends SwissComponent {
  render() {
    return html\`<div>Hello World</div>\`;
  }
}`;

    const result = compiler.compile(simpleSource, "test.ui");

    // Should convert html template literal to string
    expect(result).toContain('"<div>Hello World</div>"');
    expect(result).not.toContain("html`");
  });

  it("processes html template literals with interpolations", async () => {
    const compiler = new UiCompiler({ outputFormat: "javascript" });

    const sourceWithInterpolation = `
export class TestComponent extends SwissComponent {
  render() {
    const name = "Swiss";
    return html\`<div>Hello \${name}</div>\`;
  }
}`;

    const result = compiler.compile(sourceWithInterpolation, "test.ui");

    // Should handle interpolations correctly
    expect(result).toContain('"<div>Hello " + (name) + "</div>"');
    expect(result).not.toContain("html`");
    expect(result).not.toContain("${name}");
  });

  it("processes SWISS-specific HTML attributes", async () => {
    const compiler = new UiCompiler({ outputFormat: "javascript" });

    const sourceWithAttributes = `
export class TestComponent extends SwissComponent {
  render() {
    return html\`<button @click=\${this.handleClick} ?disabled=\${this.isDisabled}>Click me</button>\`;
  }
}`;

    const result = compiler.compile(sourceWithAttributes, "test.ui");

    // Should convert @click to onclick and handle interpolations
    expect(result).toContain("onclick=");
    expect(result).toContain("this.handleClick");
    // Should handle conditional disabled attribute
    expect(result).toContain("disabled");
    expect(result).toContain("this.isDisabled");
    expect(result).not.toContain("@click");
    expect(result).not.toContain("?disabled");
  });

  it("processes multiline html template literals", async () => {
    const compiler = new UiCompiler({ outputFormat: "javascript" });

    const multilineSource = `
export class TestComponent extends SwissComponent {
  render() {
    return html\`
      <div class="container">
        <h1>Title</h1>
        <p>Content</p>
      </div>
    \`;
  }
}`;

    const result = compiler.compile(multilineSource, "test.ui");

    // Should process multiline templates and clean up whitespace
    expect(result).toContain(
      '"<div class="container">" + "<h1>Title</h1>" + "<p>Content</p>" + "</div>"',
    );
    expect(result).not.toContain("html`");
  });

  it("handles complex interpolations with method calls", async () => {
    const compiler = new UiCompiler({ outputFormat: "javascript" });

    const complexSource = `
export class TestComponent extends SwissComponent {
  render() {
    return html\`
      <div class="pos-app">
        \${this.renderHeader()}
        \${this.renderMain()}
      </div>
    \`;
  }
}`;

    const result = compiler.compile(complexSource, "test.ui");

    // Should handle method call interpolations
    expect(result).toContain(
      '"<div class="pos-app">" + (this.renderHeader()) + (this.renderMain()) + "</div>"',
    );
    expect(result).not.toContain("html`");
    expect(result).not.toContain("${this.renderHeader()}");
  });
});
