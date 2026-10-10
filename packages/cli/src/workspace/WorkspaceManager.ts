/*
 * Copyright (c) 2024 Themba Mzumara
 * Swiss Enterprise Framework - Workspace Manager
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as path from "path";

export interface SwissWorkspaceConfig {
  workspace: {
    name: string;
    version: string;
    packages: string[];
  };
  pipeline: {
    [key: string]: {
      dependsOn?: string[];
      outputs?: string[];
      cache?: boolean;
      persistent?: boolean;
      syncDeps?: boolean;
    };
  };
  swissDependencies?: {
    [key: string]: {
      source: string;
      dist: string;
      target: string;
      strategy: "symlink" | "copy";
    };
  };
  enterpriseDependencies?: {
    [key: string]: {
      source: string;
      dist: string;
      target: string;
      strategy: "symlink" | "copy";
    };
  };
  codeStandards?: {
    componentNaming?: string;
    hookNaming?: string;
    fileNaming?: string;
    enforceSwissPatterns?: boolean;
    requirePropsInterface?: boolean;
  };
  projectStructure?: {
    domainDriven?: boolean;
    separateByDomain?: string[];
    sharedFolders?: string[];
  };
}

export interface PackageInfo {
  name: string;
  path: string;
  packageJson: Record<string, unknown>;
  dependencies: string[];
  isSwissApp: boolean;
  isSwissPackage: boolean;
}

export class SwissWorkspaceManager {
  private config: SwissWorkspaceConfig | null = null;
  private packages: Map<string, PackageInfo> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map();

  constructor(private rootPath: string) {}

  async initialize(): Promise<void> {
    await this.loadConfig();
    await this.discoverPackages();
    this.buildDependencyGraph();
  }

  private async loadConfig(): Promise<void> {
    const configPath = path.join(this.rootPath, "swiss.workspace.json");

    if (!fs.existsSync(configPath)) {
      throw new Error(
        'swiss.workspace.json not found. Run "swiss workspace init" first.',
      );
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    this.config = JSON.parse(configContent);
  }

  private async discoverPackages(): Promise<void> {
    if (!this.config) return;

    for (const pattern of this.config.workspace.packages) {
      const packagePaths = await this.expandGlobPattern(pattern);

      for (const pkgPath of packagePaths) {
        const fullPath = path.join(this.rootPath, pkgPath);
        const packageJsonPath = path.join(fullPath, "package.json");

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf-8"),
          );

          const packageInfo: PackageInfo = {
            name: packageJson.name || path.basename(pkgPath),
            path: fullPath,
            packageJson,
            dependencies: this.extractDependencies(packageJson),
            isSwissApp: pkgPath.startsWith("apps/"),
            isSwissPackage: pkgPath.startsWith("SWISS/packages/"),
          };

          this.packages.set(packageInfo.name, packageInfo);
        }
      }
    }
  }

  private async expandGlobPattern(pattern: string): Promise<string[]> {
    const results: string[] = [];

    if (pattern.endsWith("/*")) {
      const baseDir = pattern.slice(0, -2);
      const fullBaseDir = path.join(this.rootPath, baseDir);

      if (fs.existsSync(fullBaseDir)) {
        const entries = fs.readdirSync(fullBaseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            results.push(path.join(baseDir, entry.name));
          }
        }
      }
    } else {
      // Direct path
      if (fs.existsSync(path.join(this.rootPath, pattern))) {
        results.push(pattern);
      }
    }

    return results;
  }

  private extractDependencies(packageJson: Record<string, unknown>): string[] {
    const deps = [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ];

    // Filter to only workspace dependencies
    return deps.filter(
      (dep) =>
        dep.startsWith("@swissjs/") ||
        dep.startsWith("@swiss-enterprise/") ||
        this.packages.has(dep),
    );
  }

  private buildDependencyGraph(): void {
    for (const [name, pkg] of this.packages) {
      const workspaceDeps = pkg.dependencies.filter((dep) =>
        this.packages.has(dep),
      );
      this.dependencyGraph.set(name, workspaceDeps);
    }
  }

  getBuildOrder(targetPackage?: string): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (pkgName: string) => {
      if (visited.has(pkgName)) return;
      if (visiting.has(pkgName)) {
        throw new Error(`Circular dependency detected involving ${pkgName}`);
      }

      visiting.add(pkgName);
      const deps = this.dependencyGraph.get(pkgName) || [];

      for (const dep of deps) {
        if (this.packages.has(dep)) {
          visit(dep);
        }
      }

      visiting.delete(pkgName);
      visited.add(pkgName);
      result.push(pkgName);
    };

    if (targetPackage) {
      if (!this.packages.has(targetPackage)) {
        throw new Error(`Package ${targetPackage} not found in workspace`);
      }
      visit(targetPackage);
    } else {
      for (const pkgName of this.packages.keys()) {
        visit(pkgName);
      }
    }

    return result;
  }

  getPackageInfo(name: string): PackageInfo | undefined {
    return this.packages.get(name);
  }

  getAllPackages(): PackageInfo[] {
    return Array.from(this.packages.values());
  }

  getSwissApps(): PackageInfo[] {
    return Array.from(this.packages.values()).filter((pkg) => pkg.isSwissApp);
  }

  getSwissPackages(): PackageInfo[] {
    return Array.from(this.packages.values()).filter(
      (pkg) => pkg.isSwissPackage,
    );
  }

  getConfig(): SwissWorkspaceConfig | null {
    return this.config;
  }
}
