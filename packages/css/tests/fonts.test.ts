import { describe, it, expect } from 'vitest';
import { generateFontFace, generateFontPreload, optimizeFontLoading } from '../src/assets/fonts';

describe('Font Optimization', () => {
    describe('generateFontFace', () => {
        it('should generate @font-face CSS', () => {
            const fontFace = generateFontFace({
                family: 'Inter',
                src: ["url('/fonts/inter.woff2') format('woff2')"],
                weight: 400,
                display: 'swap'
            });

            expect(fontFace).toContain('@font-face');
            expect(fontFace).toContain('font-family: \'Inter\'');
            expect(fontFace).toContain('font-weight: 400');
            expect(fontFace).toContain('font-display: swap');
        });
    });

    describe('generateFontPreload', () => {
        it('should generate preload link', () => {
            const preload = generateFontPreload('/fonts/inter.woff2');

            expect(preload).toContain('<link rel="preload"');
            expect(preload).toContain('as="font"');
            expect(preload).toContain('crossorigin');
        });
    });

    describe('optimizeFontLoading', () => {
        it('should optimize multiple fonts', () => {
            const fonts = [
                {
                    family: 'Inter',
                    src: ["url('/fonts/inter.woff2') format('woff2')"],
                    weight: 400
                },
                {
                    family: 'Inter',
                    src: ["url('/fonts/inter-bold.woff2') format('woff2')"],
                    weight: 700
                }
            ];

            const result = optimizeFontLoading(fonts);

            expect(result.css).toContain('Inter');
            expect(result.preloads).toHaveLength(2);
        });
    });
});
