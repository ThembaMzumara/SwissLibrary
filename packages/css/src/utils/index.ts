/**
 * Utility functions for CSS processing
 */

/**
 * Minify CSS (basic implementation)
 */
export function minifyCSS(css: string): string {
  return (
    css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remove whitespace
      .replace(/\s+/g, " ")
      // Remove spaces around special characters
      .replace(/\s*([{}:;,>+~])\s*/g, "$1")
      .trim()
  );
}

/**
 * Extract critical CSS (placeholder)
 */
export function extractCriticalCSS(
  css: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _html: string,
): string {
  // TODO: Implement critical CSS extraction
  // For now, return all CSS
  return css;
}

/**
 * Generate CSS fingerprint for caching
 */
export function generateCSSFingerprint(css: string): string {
  let hash = 0;
  for (let i = 0; i < css.length; i++) {
    const char = css.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
