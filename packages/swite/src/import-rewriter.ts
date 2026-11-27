/*
 * Import Rewriter for SWITE
 */

import { init, parse } from 'es-module-lexer';
import { ModuleResolver } from './resolver.js';

export async function rewriteImports(
    code: string,
    importer: string,
    resolver: ModuleResolver
): Promise<string> {
    await init;

    try {
        const [imports] = parse(code);

        if (imports.length === 0) {
            return code;
        }

        let rewritten = code;
        let offset = 0;

        for (const imp of imports) {
            const { s: start, e: end, d: dynamicIndex } = imp;

            // Skip dynamic imports for now
            if (dynamicIndex !== -1) continue;

            const specifier = code.slice(start, end);

            // Resolve the import
            const resolved = await resolver.resolve(specifier, importer);

            // Replace in code
            const before = rewritten.slice(0, start + offset);
            const after = rewritten.slice(end + offset);
            rewritten = before + resolved + after;

            offset += resolved.length - specifier.length;
        }

        return rewritten;
    } catch {
        // Fallback: use regex for files that es-module-lexer can't parse
        // This happens with compiled .ui files that have template literals
        console.warn(`[SWITE] Parse failed for ${importer}, using regex fallback`);

        // Simple regex-based import rewriting
        let rewritten = code;
        const importRegex = /from\s+['"]([^'"]+)['"]/g;

        const matches = [...code.matchAll(importRegex)];
        for (const match of matches.reverse()) {
            const specifier = match[1];
            const resolved = await resolver.resolve(specifier, importer);
            rewritten = rewritten.slice(0, match.index! + match[0].indexOf(specifier)) +
                resolved +
                rewritten.slice(match.index! + match[0].indexOf(specifier) + specifier.length);
        }

        return rewritten;
    }
}
