/**
 * CSS Compiler for Swiss components
 * Integrates with @swissjs/compiler to process CSS in .ui/.uix files
 */

import { transformCSSModule } from '../modules/transformer.js';
import type { CSSModuleOptions } from '../modules/transformer.js';

export interface CSSCompilerOptions {
    modules?: boolean | CSSModuleOptions;
    minify?: boolean;
    autoprefixer?: boolean;
}

export interface CompiledCSS {
    code: string;
    map?: string;
    modules?: Record<string, string>;
}

/**
 * Compile CSS from Swiss component
 */
export async function compileCSS(
    css: string,
    filename: string,
    options: CSSCompilerOptions = {}
): Promise<CompiledCSS> {
    let processedCSS = css;
    let modules: Record<string, string> | undefined;

    // CSS Modules transformation
    if (options.modules) {
        const moduleOptions = typeof options.modules === 'object' ? options.modules : {};
        const result = transformCSSModule(processedCSS, filename, moduleOptions);
        processedCSS = result.css;
        modules = result.exports;
    }

    // TODO: Add PostCSS processing
    // TODO: Add autoprefixer
    // TODO: Add minification

    return {
        code: processedCSS,
        modules
    };
}

/**
 * Extract CSS from Swiss component file
 */
export function extractCSS(componentSource: string): {
    css: string;
    isModule: boolean;
} | null {
    // Match <style> or <style module> tags
    const styleRegex = /<style(\s+module)?>([\s\S]*?)<\/style>/;
    const match = componentSource.match(styleRegex);

    if (!match) {
        return null;
    }

    return {
        css: match[2].trim(),
        isModule: !!match[1]
    };
}
