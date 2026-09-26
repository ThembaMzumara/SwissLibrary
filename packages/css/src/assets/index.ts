import { Buffer } from "node:buffer";

/**
 * Asset handling utilities
 */

export interface AssetOptions {
  publicPath?: string;
  outputPath?: string;
  limit?: number; // Inline assets smaller than this (bytes)
}

export interface ProcessedAsset {
  url: string;
  inline?: boolean;
  content?: string;
}

/**
 * Process asset import
 */
export function processAsset(
  assetPath: string,
  options: AssetOptions = {},
): ProcessedAsset {
  const { publicPath = "/", limit = 8192 } = options;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _limit = limit; // Keep limit in destructuring but silence unused

  // TODO: Implement actual asset processing
  // For now, return basic URL
  return {
    url: `${publicPath}${assetPath}`,
    inline: false,
  };
}

/**
 * Get asset MIME type
 */
export function getAssetMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",

    // Fonts
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",

    // Other
    pdf: "application/pdf",
    json: "application/json",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Convert asset to data URL
 */
export function assetToDataURL(content: Buffer, mimeType: string): string {
  const base64 = content.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
