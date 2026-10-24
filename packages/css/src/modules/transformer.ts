/**
 * CSS Modules transformer
 * Transforms CSS with scoped class names
 */

export interface CSSModuleOptions {
    generateScopedName?: (name: string, filename: string, css: string) => string;
    hashPrefix?: string;
}

export interface CSSModuleResult {
    css: string;
    exports: Record<string, string>;
}

/**
 * Default scoped name generator
 * Format: [filename]_[classname]_[hash]
 */
function defaultGenerateScopedName(
    name: string,
    filename: string,
    css: string
): string {
    const hash = generateHash(css + filename + name);
    const basename = filename.split('/').pop()?.replace(/\.[^.]+$/, '') || 'component';
    return `${basename}_${name}_${hash}`;
}

/**
 * Simple hash generator for class names
 */
function generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 5);
}

/**
 * Transform CSS to CSS Modules
 */
export function transformCSSModule(
    css: string,
    filename: string,
    options: CSSModuleOptions = {}
): CSSModuleResult {
    const generateScopedName = options.generateScopedName || defaultGenerateScopedName;
    const exports: Record<string, string> = {};

    // Parse CSS and extract class names
    const classNameRegex = /\.([a-zA-Z_][\w-]*)/g;
    let match;
    const classNames = new Set<string>();

    while ((match = classNameRegex.exec(css)) !== null) {
        classNames.add(match[1]);
    }

    // Generate scoped names
    let transformedCSS = css;
    classNames.forEach(className => {
        const scopedName = generateScopedName(className, filename, css);
        exports[className] = scopedName;

        // Replace all occurrences of .className with .scopedName
        const regex = new RegExp(`\\.${className}(?![\\w-])`, 'g');
        transformedCSS = transformedCSS.replace(regex, `.${scopedName}`);
    });

    return {
        css: transformedCSS,
        exports
    };
}

/**
 * Generate TypeScript definitions for CSS Module
 */
export function generateCSSModuleTypes(exports: Record<string, string>): string {
    const classNames = Object.keys(exports).map(name => `  ${name}: string;`).join('\n');

    return `declare const styles: {
${classNames}
};

export default styles;
`;
}
