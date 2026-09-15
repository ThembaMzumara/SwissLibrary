/*
 * Copyright (c) 2024 Themba Mzumara
 * Swiss Enterprise Framework - Dependency Sync Manager
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as path from "path";
import { SwissWorkspaceManager } from "./WorkspaceManager.js";

export interface SyncResult {
  success: boolean;
  synced: string[];
  errors: string[];
  skipped: string[];
}

export class SyncManager {
  constructor(private workspaceManager: SwissWorkspaceManager) {}

  private resolveSourcePath(sourcePath: string): string {
    // Handle environment variable substitution
    if (sourcePath.includes("${")) {
      sourcePath = sourcePath.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return process.env[varName] || match;
      });
    }

    // If still contains variables or is not absolute, try smart detection
    if (sourcePath.includes("${") || !path.isAbsolute(sourcePath)) {
      return this.detectSwissRoot(sourcePath);
    }

    return sourcePath;
  }

  private detectSwissRoot(relativePath: string): string {
    const workspaceRoot = this.workspaceManager["rootPath"];

    // Strategy 1: Check if SWISS_DEV_ROOT environment variable is set
    const swissDevRoot = process.env.SWISS_DEV_ROOT;
    if (swissDevRoot) {
      const resolved = relativePath
        .replace("${SWISS_DEV_ROOT}/", "")
        .replace("${SWISS_DEV_ROOT}\\", "");
      return path.join(swissDevRoot, resolved);
    }

    // Strategy 2: Look for SWISS directory in parent directories
    let currentDir = workspaceRoot;
    for (let i = 0; i < 5; i++) {
      // Check up to 5 levels up
      const swissPath = path.join(currentDir, "SWISS");
      if (fs.existsSync(swissPath)) {
        const resolved = relativePath
          .replace("${SWISS_DEV_ROOT}/", "")
          .replace("${SWISS_DEV_ROOT}\\", "");
        return path.join(currentDir, resolved);
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // Reached root
      currentDir = parentDir;
    }

    // Strategy 3: Check common development patterns
    const commonPaths = [
      path.join(workspaceRoot, "..", "SWISS"),
      path.join(workspaceRoot, "..", "..", "SWISS"),
      path.join(workspaceRoot, "..", "..", "dev", "SWISS"),
    ];

    for (const commonPath of commonPaths) {
      if (fs.existsSync(commonPath)) {
        const resolved = relativePath
          .replace("${SWISS_DEV_ROOT}/", "")
          .replace("${SWISS_DEV_ROOT}\\", "");
        return path.resolve(commonPath, "..", resolved);
      }
    }

    // Fallback: Use relative to workspace
    console.warn(
      `⚠️  Could not auto-detect Swiss root. Set SWISS_DEV_ROOT environment variable.`,
    );
    console.warn(
      `   Example: export SWISS_DEV_ROOT="/home/dilbert/Documents/dev"`,
    );
    return path.resolve(
      workspaceRoot,
      relativePath.replace("${SWISS_DEV_ROOT}/", "../../../"),
    );
  }

  async syncDependencies(targetPackage?: string): Promise<SyncResult> {
    const config = this.workspaceManager.getConfig();
    if (!config) throw new Error("Workspace config not loaded");

    const result: SyncResult = {
      success: true,
      synced: [],
      errors: [],
      skipped: [],
    };

    const packages = targetPackage
      ? [this.workspaceManager.getPackageInfo(targetPackage)].filter(Boolean)
      : this.workspaceManager.getAllPackages().filter((pkg) => pkg.isSwissApp);

    for (const pkg of packages) {
      if (!pkg) continue;

      // Sync Swiss framework dependencies
      if (config.swissDependencies) {
        await this.syncPackageDependencies(
          pkg,
          config.swissDependencies,
          result,
        );
      }

      // Sync Enterprise dependencies
      if (config.enterpriseDependencies) {
        await this.syncPackageDependencies(
          pkg,
          config.enterpriseDependencies,
          result,
        );
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  private async syncPackageDependencies(
    pkg: { path: string; name: string },
    dependencies: Record<
      string,
      { source: string; dist: string; target: string; strategy: string }
    >,
    result: SyncResult,
  ): Promise<void> {
    for (const [depName, depConfig] of Object.entries(dependencies)) {
      try {
        const sourcePath = this.resolveSourcePath(depConfig.source);
        const sourceDistPath = path.join(sourcePath, depConfig.dist);
        const targetPath = path.join(pkg.path, depConfig.target);

        // Check if source exists and is built
        if (!fs.existsSync(sourceDistPath)) {
          result.errors.push(
            `Source not built: ${depName} at ${sourceDistPath}`,
          );
          continue;
        }

        // Create target directory
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Remove existing target
        if (fs.existsSync(targetPath)) {
          if (fs.lstatSync(targetPath).isSymbolicLink()) {
            fs.unlinkSync(targetPath);
          } else {
            fs.rmSync(targetPath, { recursive: true, force: true });
          }
        }

        // Sync based on strategy
        if (depConfig.strategy === "symlink") {
          await this.createSymlink(sourceDistPath, targetPath);
        } else {
          await this.copyDirectory(sourceDistPath, targetPath);
        }

        result.synced.push(`${pkg.name} ← ${depName}`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        result.errors.push(
          `Failed to sync ${depName} to ${pkg.name}: ${errorMessage}`,
        );
      }
    }
  }

  private async createSymlink(source: string, target: string): Promise<void> {
    const relativePath = path.relative(path.dirname(target), source);
    fs.symlinkSync(relativePath, target, "dir");
  }

  private async copyDirectory(source: string, target: string): Promise<void> {
    if (!fs.existsSync(source)) return;

    fs.mkdirSync(target, { recursive: true });

    const entries = fs.readdirSync(source, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  async watchDependencies(targetPackage?: string): Promise<void> {
    const config = this.workspaceManager.getConfig();
    if (!config) throw new Error("Workspace config not loaded");

    console.log("🔍 Watching Swiss dependencies for changes...");

    // Watch Swiss packages for changes
    for (const [depName, depConfig] of Object.entries(
      config.swissDependencies || {},
    )) {
      const sourcePath = path.resolve(
        this.workspaceManager["rootPath"],
        depConfig.source,
      );
      const sourceDistPath = path.join(sourcePath, depConfig.dist);

      if (fs.existsSync(sourceDistPath)) {
        fs.watch(
          sourceDistPath,
          { recursive: true },
          async (eventType, filename) => {
            if (filename && !filename.includes("node_modules")) {
              console.log(`📦 ${depName} changed: ${filename}`);
              await this.syncDependencies(targetPackage);
              console.log("✅ Dependencies synced");
            }
          },
        );
      }
    }
  }

  async validateDependencies(
    targetPackage?: string,
  ): Promise<{ valid: boolean; issues: string[] }> {
    const config = this.workspaceManager.getConfig();
    if (!config) throw new Error("Workspace config not loaded");

    const issues: string[] = [];
    const packages = targetPackage
      ? [this.workspaceManager.getPackageInfo(targetPackage)].filter(Boolean)
      : this.workspaceManager.getSwissApps();

    for (const pkg of packages) {
      if (!pkg) continue;

      for (const [depName, depConfig] of Object.entries(
        config.swissDependencies || {},
      )) {
        const targetPath = path.join(pkg.path, depConfig.target);

        if (!fs.existsSync(targetPath)) {
          issues.push(`Missing dependency: ${depName} in ${pkg.name}`);
          continue;
        }

        // Check if symlink is valid
        if (
          depConfig.strategy === "symlink" &&
          fs.lstatSync(targetPath).isSymbolicLink()
        ) {
          const linkTarget = fs.readlinkSync(targetPath);
          const resolvedTarget = path.resolve(
            path.dirname(targetPath),
            linkTarget,
          );

          if (!fs.existsSync(resolvedTarget)) {
            issues.push(
              `Broken symlink: ${depName} in ${pkg.name} → ${resolvedTarget}`,
            );
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
