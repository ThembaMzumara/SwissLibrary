import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';
import { jsxTransformer } from '../../src/transformers/jsx/jsx-transformer';

describe('JSX Transformer', () => {
  function transform(source: string): string {
    const sourceFile = ts.createSourceFile(
      'test.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const result = ts.transform(sourceFile, [jsxTransformer()]);
    const printer = ts.createPrinter();
    const output = printer.printFile(result.transformed[0]);
    result.dispose();
    
    return output;
  }

  it('transforms simple JSX to createElement', () => {
    const source = `const element = <div>Hello</div>;`;
    const result = transform(source);
    
    expect(result).toContain('createElement("div"');
    expect(result).toContain('"Hello"');
  });

  it('handles self-closing elements', () => {
    const source = `const img = <img src="test.jpg" alt="Test" />;`;
    const result = transform(source);
    
    expect(result).toContain('createElement("img"');
    expect(result).toContain('"src": "test.jpg"');
    expect(result).toContain('"alt": "Test"');
  });

  it('handles fragments', () => {
    const source = `const frag = <><div>1</div><div>2</div></>;`;
    const result = transform(source);
    
    expect(result).toContain('Fragment(');
    expect(result).toMatch(/createElement\([\s\S]*?"1"[\s\S]*?"2"[\s\S]*?\)/);
  });

  it('handles nested components', () => {
    const source = `
      const App = () => (
        <div className="app">
          <Header />
          <Main />
          <Footer />
        </div>
      );
    `;
    
    const result = transform(source);
    
    expect(result).toContain('createElement("div"');
    expect(result).toContain('"class": "app"');
    expect(result).toContain('createElement(Header');
    expect(result).toContain('createElement(Main');
    expect(result).toContain('createElement(Footer');
  });

  it('handles spread attributes', () => {
    const source = `
      const props = { className: 'container', id: 'app' };
      const element = <div {...props} data-test="test">Content</div>;
    `;
    
    const result = transform(source);
    
    expect(result).toContain('...props');
    expect(result).toContain('"data-test": "test"');
  });

  it('handles event handlers', () => {
    const source = `
      const handleClick = () => console.log('clicked');
      const button = <button onClick={handleClick}>Click me</button>;
    `;
    
    const result = transform(source);
    
    expect(result).toContain('"onClick": handleClick');
    expect(result).toContain('"Click me"');
  });

  it('handles boolean attributes', () => {
    const source = `const input = <input disabled />;`;
    const result = transform(source);
    
    expect(result).toContain('"disabled": true');
  });

  it('handles expressions in attributes', () => {
    const source = `
      const width = 100;
      const img = <img width={width} height={width * 2} />;
    `;
    
    const result = transform(source);
    
    expect(result).toContain('"width": width');
    expect(result).toContain('"height": width * 2');
  });
});
