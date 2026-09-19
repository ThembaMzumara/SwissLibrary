/*
 * Module Resolver for SWITE
 */

import path from "node:path";
import { promises as fs } from "node:fs";

export class ModuleResolver {
  constructor(private root: string) { }

  async resolve(specifier: string, importer: string): Promise<string> {
    // Handle bare imports (@swissjs/core, @swiss-enterprise/cart, etc)
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
      return this.resolveBareImport(specifier);
    }

    // Handle absolute paths (already URLs)
    if (specifier.startsWith("/")) {
      return specifier;
    }

    // Handle relative imports
    const importerDir = path.dirname(importer);
    let resolved = path.resolve(importerDir, specifier);

    // Try adding extensions
    const extensions = [".ui", ".uix", ".ts", ".tsx", ".js", ".jsx", ".mjs"];

    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (await this.fileExists(withExt)) {
        return this.toUrl(withExt);
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexFile = path.join(resolved, `index${ext}`);
      if (await this.fileExists(indexFile)) {
        return this.toUrl(indexFile);
      }
    }

    // Return as-is if nothing found
    return this.toUrl(resolved);
  }

  private async resolveBareImport(specifier: string): Promise<string> {
    try {
      // Handle scoped packages (@swissjs/core) and regular packages
      const parts = specifier.split("/");
      const isScoped = specifier.startsWith("@");
      const pkgName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
      const subPath = isScoped
        ? parts.slice(2).join("/")
        : parts.slice(1).join("/");

      // Find package.json
      const pkgDir = path.join(this.root, "node_modules", pkgName);
      const pkgJsonPath = path.join(pkgDir, "package.json");

      if (!(await this.fileExists(pkgJsonPath))) {
        console.log(`[SWITE] Package ${pkgName} not in node_modules, checking workspace...`);
        // Try workspace packages before CDN fallback
        const workspacePkg = await this.resolveWorkspacePackage(pkgName);
        if (workspacePkg) {
          // Found in workspace, resolve the entry point
          const workspacePkgJson = JSON.parse(await fs.readFile(path.join(workspacePkg, "package.json"), "utf-8"));
          let entryPoint: string;
          if (subPath) {
            entryPoint = subPath;
          } else {
            entryPoint = workspacePkgJson.module || workspacePkgJson.main || "index.js";
          }

          // Resolve to full path
          const fullPath = path.join(workspacePkg, entryPoint);

          // Try the exact path first
          if (await this.fileExists(fullPath)) {
            return this.toUrl(fullPath);
          }

          // If entry point has extension, try swapping it (.mjs -> .js, etc)
          const ext = path.extname(entryPoint);
          if (ext) {
            const basePath = fullPath.slice(0, -ext.length);
            // Try common extensions
            for (const tryExt of [".js", ".mjs", ".ts"]) {
              if (await this.fileExists(basePath + tryExt)) {
                console.log(
                  `[SWITE] Resolved ${pkgName}: ${entryPoint} -> ${path.basename(basePath + tryExt)}`,
                );
                return this.toUrl(basePath + tryExt);
              }
            }
          } else {
            // No extension, try adding them
            for (const tryExt of [".js", ".mjs", ".ts"]) {
              if (await this.fileExists(fullPath + tryExt)) {
                return this.toUrl(fullPath + tryExt);
              }
            }
          }

          // Try index.js in directory
          if (await this.fileExists(path.join(fullPath, "index.js"))) {
            return this.toUrl(path.join(fullPath, "index.js"));
          }

          // Try index.ts in directory
          if (await this.fileExists(path.join(fullPath, "index.ts"))) {
            return this.toUrl(path.join(fullPath, "index.ts"));
          }

          // For unbuilt workspace packages, try src/ directory
          console.log(`[SWITE] Entry point ${entryPoint} not found, checking src/ for ${pkgName}...`);
          const srcDir = path.join(workspacePkg, "src");

          // Try src/index with various extensions
          for (const ext of [".ts", ".ui", ".uix", ".js"]) {
            const srcIndex = path.join(srcDir, `index${ext}`);
            if (await this.fileExists(srcIndex)) {
              console.log(`[SWITE] Found unbuilt workspace package ${pkgName} at ${srcIndex}`);
              return this.toUrl(srcIndex);
            }
          }

          console.warn(
            `[SWITE] Entry point not found for ${pkgName} at ${fullPath}, using CDN fallback`,
          );
          return `https://esm.sh/${specifier}`;
        }

        // Not in workspace, use CDN
        console.warn(`[SWITE] Package ${pkgName} not found, using CDN fallback`);
        return `https://esm.sh/${specifier}`;
      }

      // Package found in node_modules
      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));

      // Determine entry point
      let entryPoint: string;
      if (subPath) {
        entryPoint = subPath;
      } else {
        entryPoint = pkgJson.module || pkgJson.main || "index.js";
      }

      const fullPath = path.join(pkgDir, entryPoint);

      // Try the exact path first
      if (await this.fileExists(fullPath)) {
        return this.toUrl(fullPath);
      }

      // Try with extensions
      for (const ext of [".js", ".mjs", ".ts"]) {
        if (await this.fileExists(fullPath + ext)) {
          return this.toUrl(fullPath + ext);
        }
      }

      // Fallback to CDN
      console.warn(`[SWITE] Could not resolve ${specifier}, using CDN`);
      return `https://esm.sh/${specifier}`;
    } catch (error) {
      console.warn(`[SWITE] Error resolving ${specifier}:`, error);
      return `https://esm.sh/${specifier}`;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async resolveWorkspacePackage(pkgName: string): Promise<string | null> {
    // Check for pnpm-workspace.yaml or package.json workspaces
    const workspaceDirs = [
      path.join(this.root, "..", "..", "packages"), // ../../packages (SwissEnterpriseRepo)
      path.join(this.root, "..", "packages"), // ../packages
    ];

    for (const workspaceDir of workspaceDirs) {
      const pkgPath = path.join(workspaceDir, pkgName.replace("@swiss-enterprise/", ""));
      const pkgJsonPath = path.join(pkgPath, "package.json");

      if (await this.fileExists(pkgJsonPath)) {
        console.log(`[SWITE] Found workspace package: ${pkgName} at ${pkgPath}`);
        return pkgPath;
      }
    }

    return null;
  }
  private toUrl(filePath: string): string {
    return filePath.replace(this.root, "").replace(/\\/g, "/");
  }
}
