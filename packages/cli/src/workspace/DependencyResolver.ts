/*
 * Copyright (c) 2024 Themba Mzumara
 * Swiss Enterprise Framework - Dependency Resolver
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as path from "path";
import { SwissWorkspaceManager, type PackageInfo } from "./WorkspaceManager.js";

export interface BuildTask {
  packageName: string;
  command: string;
  dependencies: string[];
  outputs: string[];
  cacheable: boolean;
}

export class DependencyResolver {
  constructor(private workspaceManager: SwissWorkspaceManager) {}

  resolveBuildTasks(command: string, targetPackage?: string): BuildTask[] {
    const config = this.workspaceManager.getConfig();
    if (!config) throw new Error("Workspace config not loaded");

    const pipelineConfig = config.pipeline[command];
    if (!pipelineConfig) {
      throw new Error(
        `Command "${command}" not found in pipeline configuration`,
      );
    }

    const buildOrder = this.workspaceManager.getBuildOrder(targetPackage);
    const tasks: BuildTask[] = [];

    for (const pkgName of buildOrder) {
      const pkg = this.workspaceManager.getPackageInfo(pkgName);
      if (!pkg) continue;

      // Check if package has the command in its package.json
      const hasCommand =
        pkg.packageJson.scripts &&
        (pkg.packageJson.scripts as Record<string, string>)[command];
      if (!hasCommand && command !== "sync-deps") continue;

      const task: BuildTask = {
        packageName: pkgName,
        command,
        dependencies: this.resolveDependencies(
          pkgName,
          pipelineConfig.dependsOn || [],
        ),
        outputs: this.resolveOutputs(pkg, pipelineConfig.outputs || []),
        cacheable: pipelineConfig.cache !== false,
      };

      tasks.push(task);
    }

    return tasks;
  }

  private resolveDependencies(
    packageName: string,
    dependsOn: string[],
  ): string[] {
    const resolved: string[] = [];

    for (const dep of dependsOn) {
      if (dep === "^build") {
        // Depends on build command of all dependencies
        const pkg = this.workspaceManager.getPackageInfo(packageName);
        if (pkg) {
          for (const depName of pkg.dependencies) {
            const depPkg = this.workspaceManager.getPackageInfo(depName);
            if (
              depPkg &&
              (depPkg.packageJson.scripts as Record<string, string>)?.build
            ) {
              resolved.push(`${depName}:build`);
            }
          }
        }
      } else if (dep.includes(":")) {
        // Specific package:command dependency
        resolved.push(dep);
      } else {
        // Same command on dependencies
        const pkg = this.workspaceManager.getPackageInfo(packageName);
        if (pkg) {
          for (const depName of pkg.dependencies) {
            const depPkg = this.workspaceManager.getPackageInfo(depName);
            if (
              depPkg &&
              (depPkg.packageJson.scripts as Record<string, string>)?.[dep]
            ) {
              resolved.push(`${depName}:${dep}`);
            }
          }
        }
      }
    }

    return resolved;
  }

  private resolveOutputs(pkg: PackageInfo, outputs: string[]): string[] {
    return outputs.map((output) => path.join(pkg.path, output));
  }

  shouldSkipTask(task: BuildTask): boolean {
    if (!task.cacheable) return false;

    // Simple cache check - if all outputs exist and are newer than inputs
    const outputExists = task.outputs.every((output) => fs.existsSync(output));
    if (!outputExists) return false;

    // Get the oldest output file time
    const outputTimes = task.outputs.map((output) => {
      const stats = fs.statSync(output);
      return stats.mtime.getTime();
    });
    const oldestOutput = Math.min(...outputTimes);

    // Check if any source files are newer
    const pkg = this.workspaceManager.getPackageInfo(task.packageName);
    if (!pkg) return false;

    const sourceFiles = this.getSourceFiles(pkg.path);
    for (const sourceFile of sourceFiles) {
      const stats = fs.statSync(sourceFile);
      if (stats.mtime.getTime() > oldestOutput) {
        return false; // Source is newer, need to rebuild
      }
    }

    return true; // Can skip
  }

  private getSourceFiles(packagePath: string): string[] {
    const sourceFiles: string[] = [];
    const extensions = [".ts", ".ui", ".js", ".json"];

    const scanDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.isDirectory() &&
          !["node_modules", "dist", "build"].includes(entry.name)
        ) {
          scanDir(fullPath);
        } else if (
          entry.isFile() &&
          extensions.some((ext) => entry.name.endsWith(ext))
        ) {
          sourceFiles.push(fullPath);
        }
      }
    };

    scanDir(path.join(packagePath, "src"));
    scanDir(path.join(packagePath, "pages"));

    // Include package.json
    const packageJsonPath = path.join(packagePath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      sourceFiles.push(packageJsonPath);
    }

    return sourceFiles;
  }
}
