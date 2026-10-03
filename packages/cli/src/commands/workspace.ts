/*
 * Copyright (c) 2024 Themba Mzumara
 * Swiss Enterprise Framework - Workspace Commands
 * Licensed under the MIT License.
 */

import { Command } from "commander";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";
import { SwissWorkspaceManager } from "../workspace/WorkspaceManager.js";
import { DependencyResolver } from "../workspace/DependencyResolver.js";
import { SyncManager } from "../workspace/SyncManager.js";

export function createWorkspaceCommand(): Command {
  const workspace = new Command("workspace");
  workspace.description("Swiss workspace management commands");

  // swiss workspace init
  workspace
    .command("init")
    .description("Initialize Swiss workspace configuration")
    .action(async () => {
      await initWorkspace();
    });

  // swiss workspace build [app]
  workspace
    .command("build")
    .argument("[app]", "Specific app to build")
    .option("--no-cache", "Disable build cache")
    .description("Build workspace packages with dependency awareness")
    .action(async (app, options) => {
      await buildWorkspace(app, options);
    });

  // swiss workspace dev [app]
  workspace
    .command("dev")
    .argument("[app]", "Specific app to run in dev mode")
    .option("--no-sync", "Disable dependency syncing")
    .description("Run workspace in development mode with auto-sync")
    .action(async (app, options) => {
      await devWorkspace(app, options);
    });

  // swiss workspace sync-deps [app]
  workspace
    .command("sync-deps")
    .argument("[app]", "Specific app to sync dependencies for")
    .description("Sync Swiss dependencies across workspace")
    .action(async (app) => {
      await syncDependencies(app);
    });

  // swiss workspace validate [app]
  workspace
    .command("validate")
    .argument("[app]", "Specific app to validate")
    .description("Validate workspace dependencies and structure")
    .action(async (app) => {
      await validateWorkspace(app);
    });

  // swiss workspace list
  workspace
    .command("list")
    .description("List all packages in workspace")
    .action(async () => {
      await listPackages();
    });

  return workspace;
}

async function initWorkspace(): Promise<void> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "swiss.workspace.json");

  if (fs.existsSync(configPath)) {
    console.log("⚠️  swiss.workspace.json already exists");
    return;
  }

  const defaultConfig = {
    workspace: {
      name: path.basename(cwd),
      version: "1.0.0",
      packages: ["SWISS/packages/*", "apps/*", "packages/*"],
    },
    pipeline: {
      build: {
        dependsOn: ["^build"],
        outputs: ["dist/**", "build/**"],
        cache: true,
      },
      dev: {
        cache: false,
        persistent: true,
        syncDeps: true,
      },
      compile: {
        dependsOn: ["^build"],
        outputs: ["**/*.js"],
        cache: true,
      },
      "sync-deps": {
        cache: false,
      },
    },
    swissDependencies: {
      "@swissjs/core": {
        source: "SWISS/packages/core",
        dist: "dist",
        target: "dist/SWISS/packages/core/dist",
        strategy: "symlink",
      },
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log("✅ Created swiss.workspace.json");

  // Create pnpm-workspace.yaml if it doesn't exist
  const pnpmWorkspacePath = path.join(cwd, "pnpm-workspace.yaml");
  if (!fs.existsSync(pnpmWorkspacePath)) {
    const pnpmConfig = `packages:
  # Swiss Enterprise Apps
  - apps/*
  
  # Swiss Enterprise Packages
  - packages/*
  
  # Swiss Framework Core (linked)
  - SWISS/packages/*
  
  # Tools and Services
  - tools/*
  - services/*
`;
    fs.writeFileSync(pnpmWorkspacePath, pnpmConfig);
    console.log("✅ Created pnpm-workspace.yaml");
  }
}

async function buildWorkspace(
  targetApp?: string,
  options?: { cache?: boolean },
): Promise<void> {
  const manager = new SwissWorkspaceManager(process.cwd());
  await manager.initialize();

  const resolver = new DependencyResolver(manager);
  const tasks = resolver.resolveBuildTasks("build", targetApp);

  console.log(
    `🏗️  Building ${targetApp || "workspace"} with ${tasks.length} tasks`,
  );

  for (const task of tasks) {
    if (!options?.cache && resolver.shouldSkipTask(task)) {
      console.log(`⏭️  Skipping ${task.packageName} (cached)`);
      continue;
    }

    console.log(`🔨 Building ${task.packageName}...`);

    const pkg = manager.getPackageInfo(task.packageName);
    if (!pkg) continue;

    try {
      await runCommand("npm", ["run", task.command], pkg.path);
      console.log(`✅ Built ${task.packageName}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to build ${task.packageName}:`, errorMessage);
      process.exit(1);
    }
  }

  // Sync dependencies after build
  const syncManager = new SyncManager(manager);
  const syncResult = await syncManager.syncDependencies(targetApp);

  if (syncResult.success) {
    console.log(`✅ Synced ${syncResult.synced.length} dependencies`);
  } else {
    console.error("❌ Dependency sync failed:", syncResult.errors);
  }
}

async function devWorkspace(
  targetApp?: string,
  options?: { sync?: boolean },
): Promise<void> {
  const manager = new SwissWorkspaceManager(process.cwd());
  await manager.initialize();

  // Initial sync
  if (!options?.sync) {
    const syncManager = new SyncManager(manager);
    const syncResult = await syncManager.syncDependencies(targetApp);

    if (syncResult.success) {
      console.log(`✅ Initial sync: ${syncResult.synced.length} dependencies`);
    }

    // Start watching for changes
    syncManager.watchDependencies(targetApp);
  }

  // Start dev server for target app
  if (targetApp) {
    const pkg = manager.getPackageInfo(targetApp);
    if (pkg && (pkg.packageJson.scripts as Record<string, string>)?.dev) {
      console.log(`🚀 Starting dev server for ${targetApp}...`);
      await runCommand("npm", ["run", "dev"], pkg.path, { stdio: "inherit" });
    } else {
      console.error(`❌ No dev script found for ${targetApp}`);
    }
  } else {
    console.log("🔍 Watching workspace for changes...");
    // Keep process alive
    process.stdin.resume();
  }
}

async function syncDependencies(targetApp?: string): Promise<void> {
  const manager = new SwissWorkspaceManager(process.cwd());
  await manager.initialize();

  const syncManager = new SyncManager(manager);
  console.log(
    `🔄 Syncing dependencies${targetApp ? ` for ${targetApp}` : ""}...`,
  );

  const result = await syncManager.syncDependencies(targetApp);

  if (result.success) {
    console.log(`✅ Successfully synced ${result.synced.length} dependencies`);
    result.synced.forEach((sync) => console.log(`  📦 ${sync}`));
  } else {
    console.error(`❌ Sync failed with ${result.errors.length} errors:`);
    result.errors.forEach((error) => console.error(`  ❌ ${error}`));
    process.exit(1);
  }

  if (result.skipped.length > 0) {
    console.log(`⏭️  Skipped ${result.skipped.length} dependencies`);
  }
}

async function validateWorkspace(targetApp?: string): Promise<void> {
  const manager = new SwissWorkspaceManager(process.cwd());
  await manager.initialize();

  const syncManager = new SyncManager(manager);
  const validation = await syncManager.validateDependencies(targetApp);

  if (validation.valid) {
    console.log("✅ All dependencies are valid");
  } else {
    console.error(`❌ Found ${validation.issues.length} dependency issues:`);
    validation.issues.forEach((issue) => console.error(`  ❌ ${issue}`));
    process.exit(1);
  }
}

async function listPackages(): Promise<void> {
  const manager = new SwissWorkspaceManager(process.cwd());
  await manager.initialize();

  const packages = manager.getAllPackages();

  console.log(`📦 Found ${packages.length} packages in workspace:\n`);

  const apps = packages.filter((pkg) => pkg.isSwissApp);
  const swissPackages = packages.filter((pkg) => pkg.isSwissPackage);
  const otherPackages = packages.filter(
    (pkg) => !pkg.isSwissApp && !pkg.isSwissPackage,
  );

  if (apps.length > 0) {
    console.log("🚀 Swiss Applications:");
    apps.forEach((pkg) =>
      console.log(
        `  📱 ${pkg.name} (${path.relative(process.cwd(), pkg.path)})`,
      ),
    );
    console.log();
  }

  if (swissPackages.length > 0) {
    console.log("🧀 Swiss Framework Packages:");
    swissPackages.forEach((pkg) =>
      console.log(
        `  📦 ${pkg.name} (${path.relative(process.cwd(), pkg.path)})`,
      ),
    );
    console.log();
  }

  if (otherPackages.length > 0) {
    console.log("📦 Other Packages:");
    otherPackages.forEach((pkg) =>
      console.log(
        `  📦 ${pkg.name} (${path.relative(process.cwd(), pkg.path)})`,
      ),
    );
  }
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  options: { stdio?: "inherit" | "pipe" } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: options.stdio || "pipe",
      ...options,
    });

    let output = "";
    let errorOutput = "";

    if (child.stdout) {
      child.stdout.on("data", (data) => {
        output += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
    }

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command failed with code ${code}: ${errorOutput || output}`,
          ),
        );
      }
    });

    child.on("error", (error: Error) => {
      reject(error);
    });
  });
}
