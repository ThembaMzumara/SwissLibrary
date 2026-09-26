/**
 * TypeScript type generation for CSS
 */

import { generateCSSModuleTypes } from '../modules/transformer.js';

export interface TypeGenOptions {
    outputPath?: string;
    namedExport?: boolean;
}

/**
 * Generate .d.ts file for CSS module
 */
export function generateCSSTypes(
    cssModuleExports: Record<string, string>,
    options: TypeGenOptions = {}
): string {
    if (options.namedExport) {
        // Generate named exports
        const exports = Object.keys(cssModuleExports)
            .map(name => `export const ${name}: string;`)
            .join('\n');

        return exports;
    }

    // Generate default export
    return generateCSSModuleTypes(cssModuleExports);
}

/**
 * Generate global CSS types
 */
export function generateGlobalCSSTypes(): string {
    return `declare module '*.css' {
  const styles: { [key: string]: string };
  export default styles;
}

declare module '*.module.css' {
  const styles: { [key: string]: string };
  export default styles;
}
`;
}

/**
 * Generate asset import types
 */
export function generateAssetTypes(): string {
    return `declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.woff' {
  const src: string;
  export default src;
}

declare module '*.woff2' {
  const src: string;
  export default src;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.otf' {
  const src: string;
  export default src;
}
`;
}
