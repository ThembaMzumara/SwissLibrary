import { describe, it, expect } from 'vitest';
import { AssetBundler, createAssetManifest } from '../src/assets/bundler';

describe('Asset Bundler', () => {
    describe('AssetBundler', () => {
        it('should add assets and generate URLs', () => {
            const bundler = new AssetBundler({ publicPath: '/assets/' });

            const url = bundler.addAsset('image.png', Buffer.from('test'));

            expect(url).toContain('/assets/');
            expect(url).toContain('image');
            expect(url).toContain('.png');
        });

        it('should generate hashed filenames', () => {
            const bundler = new AssetBundler({ hash: true });

            const url1 = bundler.addAsset('image.png', Buffer.from('content1'));
            const url2 = bundler.addAsset('image.png', Buffer.from('content2'));

            expect(url1).not.toBe(url2);
        });

        it('should maintain asset manifest', () => {
            const bundler = new AssetBundler();

            bundler.addAsset('image1.png', Buffer.from('test1'));
            bundler.addAsset('image2.png', Buffer.from('test2'));

            const manifest = bundler.getManifest();

            expect(Object.keys(manifest)).toHaveLength(2);
            expect(manifest).toHaveProperty('image1.png');
            expect(manifest).toHaveProperty('image2.png');
        });
    });

    describe('createAssetManifest', () => {
        it('should create JSON manifest', () => {
            const bundler = new AssetBundler();
            bundler.addAsset('test.png', Buffer.from('test'));

            const json = createAssetManifest(bundler);

            expect(json).toContain('test.png');
            expect(() => JSON.parse(json)).not.toThrow();
        });
    });
});
