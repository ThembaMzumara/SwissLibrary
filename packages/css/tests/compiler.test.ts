import { describe, it, expect } from 'vitest';
import { compileCSS, extractCSS } from '../src/compiler';

describe('CSS Compiler', () => {
    describe('compileCSS', () => {
        it('should compile CSS without modules', async () => {
            const css = `.button { color: blue; }`;
            const result = await compileCSS(css, 'Button.ui');

            expect(result.code).toBe(css);
            expect(result.modules).toBeUndefined();
        });

        it('should compile CSS with modules', async () => {
            const css = `.button { color: blue; }`;
            const result = await compileCSS(css, 'Button.ui', { modules: true });

            expect(result.modules).toBeDefined();
            expect(result.modules).toHaveProperty('button');
            expect(result.code).not.toContain('.button');
        });

        it('should pass options to CSS Modules', async () => {
            const css = `.button { color: blue; }`;
            const customGenerator = (name: string) => `custom_${name}`;

            const result = await compileCSS(css, 'Button.ui', {
                modules: { generateScopedName: customGenerator }
            });

            expect(result.modules?.button).toBe('custom_button');
        });
    });

    describe('extractCSS', () => {
        it('should extract CSS from component', () => {
            const component = `
        <component name="Button">
          <style>
            .button { color: blue; }
          </style>
        </component>
      `;

            const result = extractCSS(component);

            expect(result).not.toBeNull();
            expect(result?.css).toContain('.button');
            expect(result?.isModule).toBe(false);
        });

        it('should detect CSS modules', () => {
            const component = `
        <component name="Button">
          <style module>
            .button { color: blue; }
          </style>
        </component>
      `;

            const result = extractCSS(component);

            expect(result?.isModule).toBe(true);
        });

        it('should return null if no style tag', () => {
            const component = `
        <component name="Button">
          <template>
            <button>Click me</button>
          </template>
        </component>
      `;

            const result = extractCSS(component);

            expect(result).toBeNull();
        });
    });
});
