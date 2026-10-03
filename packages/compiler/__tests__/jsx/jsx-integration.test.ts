import { describe, it, expect } from "vitest";
import { UiCompiler } from "../../src/index";
import * as path from "path";
import * as fs from "fs/promises";

// Local implementation of withTempFile since we're having module resolution issues
async function withTempFile(
  ext: string,
  contents: string,
  fn: (filePath: string) => Promise<void>,
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(process.cwd(), "temp-"));
  const filePath = path.join(dir, `test${ext}`);

  try {
    await fs.writeFile(filePath, contents, "utf-8");
    await fn(filePath);
  } finally {
    try {
      await fs.unlink(filePath);
      await fs.rmdir(dir);
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
    }
  }
}

describe("JSX Integration Tests", () => {
  const compiler = new UiCompiler();

  it("transforms JSX in .ui files while keeping the extension", async () => {
    const jsxSource = `
      import { SwissComponent } from '@swissjs/core';

      export class SimpleComponent extends SwissComponent {
        render() {
          return <div className="greeting">Hello World</div>;
        }
      }
    `;

    await withTempFile(".ui", jsxSource, async (filePath) => {
      // Verify the test file has .ui extension
      expect(path.extname(filePath)).toBe(".ui");

      // Read the file to verify it was written correctly
      const fileContent = await fs.readFile(filePath, "utf-8");
      expect(fileContent).toContain(
        'return <div className="greeting">Hello World</div>;',
      );

      const result = await compiler.compileFile(filePath);

      // Should transform JSX to createElement calls
      expect(result).toContain('createElement("div"');
      expect(result).toContain('className: "greeting"');
      expect(result).toContain('"Hello World"');

      // The import should be added by the transformWithJsx method
      expect(result).toContain('import { createElement } from "@swissjs/core"');
    });
  });

  it("handles JSX with props and children in .ui files", async () => {
    const jsxSource = `
      import { SwissComponent } from '@swissjs/core';

      export class UserProfile extends SwissComponent {
        render() {
          const user = { name: 'John', age: 30 };
          return (
            <div className="profile">
              <h1>{user.name}</h1>
              <p>Age: {user.age}</p>
              {user.age >= 18 ? <p>Adult</p> : <p>Minor</p>}
              <button onClick={() => this.handleClick()}>
                Click me
              </button>
            </div>
          );
        }
      }
    `;

    await withTempFile(".ui", jsxSource, async (tempFilePath) => {
      expect(path.extname(tempFilePath)).toBe(".ui");

      // Read the file to verify it was written correctly
      const fileContent = await fs.readFile(tempFilePath, "utf-8");
      expect(fileContent).toContain('<div className="profile">');

      const result = await compiler.compileFile(tempFilePath);

      // Check prop transformation
      expect(result).toContain('createElement("div"');
      expect(result).toContain('className: "profile"');
      expect(result).toContain('createElement("button"');
      expect(result).toContain("onClick: () => this.handleClick()");

      // Check variable interpolation
      expect(result).toContain("user.name");
      expect(result).toContain('"Age: "');
      expect(result).toContain("user.age");

      // Check conditional rendering
      expect(result).toContain("user.age >= 18 ?");
    });
  });

  it("handles JSX fragments in .ui files", async () => {
    const jsxSource = `
      import { SwissComponent } from '@swissjs/core';

      export class List extends SwissComponent {
        render() {
          return (
            <>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </>
          );
        }
      }
    `;

    await withTempFile(".ui", jsxSource, async (tempFilePath) => {
      // Verify the test file has .ui extension
      expect(path.extname(tempFilePath)).toBe(".ui");

      const result = await compiler.compileFile(tempFilePath);

      // Should use Fragment for empty tags
      expect(result).toContain("createElement(Fragment");
      expect(result).toContain('createElement("li"');
    });
  });

  it("handles component composition in .ui files", async () => {
    const jsxSource = `
      import { SwissComponent } from '@swissjs/core';
      import { Button } from './Button';

      export class App extends SwissComponent {
        render() {
          return (
            <div className="app">
              <h1>My App</h1>
              <Button primary onClick={() => console.log('clicked')}>
                Submit
              </Button>
            </div>
          );
        }
      }
    `;

    await withTempFile(".ui", jsxSource, async (tempFilePath) => {
      // Verify the test file has .ui extension
      expect(path.extname(tempFilePath)).toBe(".ui");

      // Read the file to verify it was written correctly
      const fileContent = await fs.readFile(tempFilePath, "utf-8");
      expect(fileContent).toContain("import { Button } from './Button'");

      const result = await compiler.compileFile(tempFilePath);

      // Should handle custom components
      expect(result).toContain("createElement(Button");
      expect(result).toContain("primary: true");
      expect(result).toContain('onClick: () => console.log("clicked")');
    });
  });
});
