/**
 * Build optimizations for CSS
 */

import { minifyCSS, extractCriticalCSS, generateCSSFingerprint } from '../utils/index.js';

export interface BuildOptions {
    minify?: boolean;
    criticalCSS?: boolean;
    fingerprint?: boolean;
    sourcemap?: boolean;
}

export interface BuildResult {
    css: string;
    criticalCSS?: string;
    fingerprint?: string;
    sourcemap?: string;
}

/**
 * Optimize CSS for production
 */
export async function optimizeForProduction(
    css: string,
    html?: string,
    options: BuildOptions = {}
): Promise<BuildResult> {
    let processedCSS = css;
    const result: BuildResult = { css };

    // Minification
    if (options.minify) {
        processedCSS = minifyCSS(processedCSS);
    }

    // Critical CSS extraction
    if (options.criticalCSS && html) {
        result.criticalCSS = extractCriticalCSS(processedCSS, html);
    }

    // Fingerprinting
    if (options.fingerprint) {
        result.fingerprint = generateCSSFingerprint(processedCSS);
    }

    result.css = processedCSS;
    return result;
}

/**
 * Split CSS into chunks
 */
export function splitCSS(css: string, chunkSize: number = 50000): string[] {
    const chunks: string[] = [];
    const rules = css.split('}').filter(Boolean);

    let currentChunk = '';

    for (const rule of rules) {
        const ruleWithBrace = rule + '}';

        if ((currentChunk + ruleWithBrace).length > chunkSize) {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = ruleWithBrace;
        } else {
            currentChunk += ruleWithBrace;
        }
    }

    if (currentChunk) chunks.push(currentChunk);

    return chunks;
}

/**
 * Remove unused CSS (basic implementation)
 */
export function removeUnusedCSS(css: string, usedClasses: Set<string>): string {
    const rules = css.split('}').filter(Boolean);

    const usedRules = rules.filter(rule => {
        const classMatches = rule.match(/\.([a-zA-Z_][\w-]*)/g);
        if (!classMatches) return true;

        return classMatches.some(className => {
            const cleanName = className.substring(1);
            return usedClasses.has(cleanName);
        });
    });

    return usedRules.map(r => r + '}').join('\n');
}
