/**
 * Asset bundling and management
 */

export interface BundleOptions {
    publicPath?: string;
    outputPath?: string;
    hash?: boolean;
    manifest?: boolean;
}

export interface AssetManifest {
    [key: string]: string;
}

/**
 * Asset Bundler
 */
export class AssetBundler {
    private assets: Map<string, string> = new Map();
    private manifest: AssetManifest = {};

    constructor(private options: BundleOptions = {}) { }

    /**
     * Add asset to bundle
     */
    addAsset(originalPath: string, content: Buffer | string): string {
        const { hash = true, publicPath = '/' } = this.options;

        let outputPath = originalPath;

        if (hash) {
            const hashValue = this.generateHash(content);
            const ext = originalPath.split('.').pop();
            const name = originalPath.replace(/\.[^.]+$/, '');
            outputPath = `${name}.${hashValue}.${ext}`;
        }

        const publicUrl = `${publicPath}${outputPath}`;
        this.assets.set(originalPath, publicUrl);
        this.manifest[originalPath] = publicUrl;

        return publicUrl;
    }

    /**
     * Get asset URL
     */
    getAssetUrl(originalPath: string): string | undefined {
        return this.assets.get(originalPath);
    }

    /**
     * Get manifest
     */
    getManifest(): AssetManifest {
        return { ...this.manifest };
    }

    /**
     * Generate content hash
     */
    private generateHash(content: Buffer | string): string {
        const str = typeof content === 'string' ? content : content.toString();
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).substring(0, 8);
    }
}

/**
 * Create asset manifest JSON
 */
export function createAssetManifest(bundler: AssetBundler): string {
    return JSON.stringify(bundler.getManifest(), null, 2);
}
