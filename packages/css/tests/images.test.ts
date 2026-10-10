import { describe, it, expect } from 'vitest';
import { optimizeImage, generateSrcSet, generatePlaceholder } from '../src/assets/images';

describe('Image Optimization', () => {
    describe('optimizeImage', () => {
        it('should return optimized image metadata', async () => {
            const result = await optimizeImage('/images/test.jpg', {
                width: 800,
                format: 'webp'
            });

            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('width');
            expect(result).toHaveProperty('format');
            expect(result.format).toBe('webp');
        });
    });

    describe('generateSrcSet', () => {
        it('should generate responsive srcset', () => {
            const srcset = generateSrcSet('/images/test.jpg', [400, 800, 1200]);

            expect(srcset).toContain('400w');
            expect(srcset).toContain('800w');
            expect(srcset).toContain('1200w');
        });
    });

    describe('generatePlaceholder', () => {
        it('should generate placeholder data URL', async () => {
            const placeholder = await generatePlaceholder('/images/test.jpg');

            expect(placeholder).toContain('data:');
        });
    });
});
