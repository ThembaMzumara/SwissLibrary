import { describe, it, expect } from 'vitest';
import { optimizeForProduction, splitCSS, removeUnusedCSS } from '../src/compiler/optimize';

describe('Build Optimizations', () => {
    describe('optimizeForProduction', () => {
        it('should minify CSS', async () => {
            const css = `
        .button {
          padding: 1rem;
          color: blue;
        }
      `;

            const result = await optimizeForProduction(css, undefined, { minify: true });

            expect(result.css.length).toBeLessThan(css.length);
            expect(result.css).not.toContain('\n');
        });

        it('should generate fingerprint', async () => {
            const css = `.button { color: blue; }`;

            const result = await optimizeForProduction(css, undefined, { fingerprint: true });

            expect(result.fingerprint).toBeDefined();
            expect(result.fingerprint).toHaveLength(5);
        });
    });

    describe('splitCSS', () => {
        it('should split CSS into chunks', () => {
            const css = Array(100).fill('.class { color: red; }').join('\n');

            const chunks = splitCSS(css, 500);

            expect(chunks.length).toBeGreaterThan(1);
        });
    });

    describe('removeUnusedCSS', () => {
        it('should remove unused classes', () => {
            const css = `
        .used { color: blue; }
        .unused { color: red; }
      `;

            const usedClasses = new Set(['used']);
            const result = removeUnusedCSS(css, usedClasses);

            expect(result).toContain('.used');
            expect(result).not.toContain('.unused');
        });
    });
});
