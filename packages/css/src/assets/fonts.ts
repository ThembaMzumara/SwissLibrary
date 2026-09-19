/**
 * Font loading and optimization
 */

export interface FontOptions {
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
    preload?: boolean;
    formats?: ('woff2' | 'woff' | 'ttf' | 'otf')[];
}

export interface FontFace {
    family: string;
    src: string[];
    weight?: string | number;
    style?: string;
    display?: string;
}

/**
 * Generate @font-face CSS
 */
export function generateFontFace(font: FontFace): string {
    const rules = [
        `font-family: '${font.family}'`,
        `src: ${font.src.join(', ')}`,
    ];

    if (font.weight) rules.push(`font-weight: ${font.weight}`);
    if (font.style) rules.push(`font-style: ${font.style}`);
    if (font.display) rules.push(`font-display: ${font.display}`);

    return `@font-face {
  ${rules.join(';\n  ')};
}`;
}

/**
 * Generate font preload link
 */
export function generateFontPreload(
    fontUrl: string,
    type: string = 'font/woff2'
): string {
    return `<link rel="preload" href="${fontUrl}" as="font" type="${type}" crossorigin>`;
}

/**
 * Optimize font loading strategy
 */
export function optimizeFontLoading(fonts: FontFace[]): {
    css: string;
    preloads: string[];
} {
    const css = fonts.map(generateFontFace).join('\n\n');
    const preloads = fonts
        .filter(f => f.src.length > 0)
        .map(f => {
            const woff2Src = f.src.find(s => s.includes('woff2'));
            if (woff2Src) {
                const url = woff2Src.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                return url ? generateFontPreload(url) : '';
            }
            return '';
        })
        .filter(Boolean);

    return { css, preloads };
}
