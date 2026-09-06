import { describe, it, expect } from 'vitest';
import { transformCSSModule, generateCSSModuleTypes } from '../src/modules/transformer';

describe('CSS Modules Transformer', () => {
    describe('transformCSSModule', () => {
        it('should transform class names to scoped names', () => {
            const css = `
        .button {
          padding: 1rem;
        }
        .button:hover {
          background: blue;
        }
      `;

            const result = transformCSSModule(css, 'Button.ui');

            expect(result.exports).toHaveProperty('button');
            expect(result.css).toContain(result.exports.button);
            expect(result.css).not.toContain('.button');
        });

        it('should handle multiple class names', () => {
            const css = `
        .container { width: 100%; }
        .header { font-size: 2rem; }
        .footer { margin-top: 2rem; }
      `;

            const result = transformCSSModule(css, 'Layout.ui');

            expect(result.exports).toHaveProperty('container');
            expect(result.exports).toHaveProperty('header');
            expect(result.exports).toHaveProperty('footer');
            expect(Object.keys(result.exports)).toHaveLength(3);
        });

        it('should preserve class names with hyphens', () => {
            const css = `.my-button { color: red; }`;
            const result = transformCSSModule(css, 'Button.ui');

            expect(result.exports).toHaveProperty('my-button');
        });

        it('should not transform class names in strings', () => {
            const css = `
        .button {
          content: ".not-a-class";
        }
      `;

            const result = transformCSSModule(css, 'Button.ui');

            expect(result.exports).toHaveProperty('button');
            expect(result.css).toContain('".not-a-class"');
        });

        it('should generate consistent hashes for same input', () => {
            const css = `.button { color: blue; }`;

            const result1 = transformCSSModule(css, 'Button.ui');
            const result2 = transformCSSModule(css, 'Button.ui');

            expect(result1.exports.button).toBe(result2.exports.button);
        });

        it('should generate different hashes for different files', () => {
            const css = `.button { color: blue; }`;

            const result1 = transformCSSModule(css, 'Button1.ui');
            const result2 = transformCSSModule(css, 'Button2.ui');

            expect(result1.exports.button).not.toBe(result2.exports.button);
        });
    });

    describe('generateCSSModuleTypes', () => {
        it('should generate TypeScript definitions', () => {
            const exports = {
                button: 'Button_button_abc123',
                container: 'Button_container_def456'
            };

            const types = generateCSSModuleTypes(exports);

            expect(types).toContain('button: string');
            expect(types).toContain('container: string');
            expect(types).toContain('declare const styles');
            expect(types).toContain('export default styles');
        });
    });
});
