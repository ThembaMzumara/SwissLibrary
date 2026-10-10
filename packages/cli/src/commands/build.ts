/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs-extra";
// TODO: Build command needs to be reimplemented with SWITE bundler
// Vite has been removed - this command is deprecated until SWITE build is ready
// Removed unused imports: compileUiFilesToJavaScript, fixDtsExtensions, spawnSync

type ProjectType = "component" | "library" | "plugin";

interface SwissJSConfig {
  type?: ProjectType;
  build?: {
    entry?: string;
    outDir?: string;
    publicDir?: string;
    formats?: string[];
    declaration?: boolean;
    external?: string[];
    assets?: boolean;
    html?: boolean;
  };
  plugin?: {
    name?: string;
    install?: string;
    config?: unknown;
  };
}

export const buildCommand = new Command("build")
  .description("Build the project for production")
  .option("-o, --out-dir <dir>", "Output directory")
  .option("--mode <mode>", "Build mode", "production")
  .option("--minify", "Minify output", true)
  .option("--sourcemap", "Generate source maps", false)
  .option("--analyze", "Analyze bundle size", false)
  .option("--clean", "Clean output directory before build", true)
  .option(
    "--no-clean-temp",
    "Do not clean the .swiss-temp directory after build (for debugging)",
    false,
  )
  .option("--debug", "Enable debug logging for build steps", false)
  .action(async (options: Record<string, unknown>) => {
    try {
      console.log(chalk.blue("🧀 SwissJS Build System"));
      console.log(chalk.gray("Building mixed .ui + TypeScript project...\n"));

      // Validate project structure
      const projectRoot = process.cwd();
      const packageJsonPath = path.join(projectRoot, "package.json");
      const srcDir = path.join(projectRoot, "src");
      const tempDir = path.join(projectRoot, ".swiss-temp");

      if (!(await fs.pathExists(packageJsonPath))) {
        console.error(
          chalk.red("❌ No package.json found. Are you in a SwissJS project?"),
        );
        process.exit(1);
      }

      if (!(await fs.pathExists(srcDir))) {
        console.error(chalk.red("❌ src directory not found."));
        process.exit(1);
      }

      // Load and validate project config
      const packageJson = await fs.readJson(packageJsonPath);
      if (
        !packageJson.dependencies?.["@swissjs/core"] &&
        !packageJson.peerDependencies?.["@swissjs/core"] &&
        !packageJson.devDependencies?.["@swissjs/core"]
      ) {
        console.error(
          chalk.red(
            "❌ Not a SwissJS project. Missing @swissjs/core dependency.",
          ),
        );
        process.exit(1);
      }

      const projectType = detectProjectType(packageJson, projectRoot);
      const swissConfig: SwissJSConfig = packageJson.swissjs || {};

      console.log(chalk.cyan(`📦 Project type: ${projectType}`));

      // Setup output directory
      // const outputStructure = getOutputStructure(projectType);
      const outDir = path.resolve(
        projectRoot,
        String(
          options.outDir ?? swissConfig.build?.outDir ?? "dist", // outputStructure.outDir is always "dist"
        ),
      );

      // Clean output and temp directories if requested
      const clean = options.clean !== false;
      if (clean && (await fs.pathExists(outDir))) {
        console.log(chalk.blue("🧹 Cleaning output directory..."));
        await fs.remove(outDir);
      }
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
      await fs.ensureDir(outDir);
      await fs.ensureDir(tempDir);

      // Step 1: Copy all .ts files from src to .swiss-temp
      console.log(chalk.blue("📋 Copying TypeScript files to build temp..."));
      await copyTypeScriptFilesToTemp(srcDir, tempDir, options.debug === true);

      // Step 2: Process .ui and .uix files to .swiss-temp as TypeScript
      console.log(
        chalk.blue("🔨 Processing .ui and .uix files to TypeScript in temp..."),
      );
      await compileUiFilesToTemp(srcDir, tempDir, options.debug === true);

      // Step 3: Write a temporary tsconfig for .swiss-temp build
      // Read user's root tsconfig.json to determine moduleResolution
      let userModuleResolution = "node";
      try {
        const userTsConfig = await fs.readJson(
          path.join(projectRoot, "tsconfig.json"),
        );
        userModuleResolution =
          userTsConfig.compilerOptions?.moduleResolution?.toLowerCase() ||
          "node";
      } catch (_err) {
        // Ignore missing or invalid tsconfig.json
        void _err;
      }
      let module = "ESNext";
      let moduleResolution = "node";
      if (userModuleResolution === "nodenext") {
        module = "NodeNext";
        moduleResolution = "NodeNext";
      }
      const tempTsConfigPath = path.join(
        projectRoot,
        "tsconfig.sjs-build.json",
      );
      const tempTsConfig = {
        extends: "./tsconfig.json",
        compilerOptions: {
          rootDir: ".swiss-temp",
          outDir: path.relative(projectRoot, outDir),
          jsx: "react-jsx",
          jsxImportSource: "@swissjs/core",
          types: ["@swissjs/core"],
          module,
          moduleResolution,
        },
        include: [".swiss-temp/**/*"],
      };
      await fs.writeJson(tempTsConfigPath, tempTsConfig, { spaces: 2 });

      // Step 4: Compile TypeScript to JavaScript using SWISS compiler
      console.log(
        chalk.blue(
          "📦 Compiling TypeScript (.ts/.tsx) in .swiss-temp to JavaScript in dist/ ...",
        ),
      );
      const { UiCompiler } = await import("@swissjs/compiler");
      const compiler = new UiCompiler();
      const success = await compiler.compileTypeScriptToJavaScript(
        tempDir,
        outDir,
      );

      // Clean up the temp tsconfig
      await fs.remove(tempTsConfigPath);

      if (!success) {
        console.error(chalk.red("❌ TypeScript compilation failed."));
        process.exit(1);
      }
      console.log(chalk.green("✅ TypeScript compiled to dist/"));

      // Step 5: Copy public directory if it exists
      const publicDir = path.join(projectRoot, "public");
      if (await fs.pathExists(publicDir)) {
        console.log(chalk.blue("📁 Copying public assets..."));
        await fs.copy(publicDir, outDir);
        console.log(chalk.green("✅ Public assets copied to dist/"));
      }

      // Step 6: Build with Vite (from dist)
      console.log(chalk.blue("⚡ Building with Vite from dist/ ..."));
      // const buildConfig = createBuildConfig(
      //   projectType,
      //   swissConfig,
      //   outDir,
      //   outDir,
      //   {
      //     mode: String(options.mode ?? "production"),
      //     minify: options.minify !== false,
      //     sourcemap: options.sourcemap === true,
      //   },
      // );
      // await viteBuild(buildConfig as InlineConfig); // Deprecated - using SWITE now
      console.warn('[DEPRECATED] Build command is deprecated. Use SWITE build (coming soon)');

      // Step 7: Generate additional files for libraries/plugins
      if (projectType === "library" || projectType === "plugin") {
        await generateLibraryFiles(
          projectType,
          packageJson,
          outDir,
          swissConfig,
        );
      }

      // Step 8: Show build results
      const stats = await getBuildStats(outDir);
      console.log(chalk.green("✅ Build completed successfully!"));
      console.log(chalk.cyan("\n📊 Build Statistics:"));
      console.log(chalk.white(`  Project type: ${projectType}`));
      console.log(chalk.white(`  Output directory: ${outDir}`));
      console.log(chalk.white(`  Total size: ${formatBytes(stats.totalSize)}`));
      console.log(chalk.white(`  Files: ${stats.fileCount}`));

      if (options.analyze === true) {
        console.log(chalk.blue("\n📈 Bundle Analysis:"));
        await analyzeBundle(outDir);
      }

      // Step 9: Clean up .swiss-temp if not --no-clean-temp
      if (options.noCleanTemp !== true) {
        if (await fs.pathExists(tempDir)) {
          console.log(chalk.blue("🧹 Cleaning up .swiss-temp directory..."));
          await fs.remove(tempDir);
          console.log(chalk.green("✅ .swiss-temp cleaned up"));
        }
      } else {
        console.log(
          chalk.yellow("⚠️  .swiss-temp directory preserved for debugging."),
        );
      }

      showNextSteps(projectType, outDir);
    } catch (error: unknown) {
      console.error(chalk.red("❌ Build failed:"), error);
      process.exit(1);
    }
  });

// Removed unused function: copyPublicAssets

// Detect project type from package.json and file structure
function detectProjectType(
  packageJson: Record<string, unknown>,
  projectRoot: string,
): ProjectType {
  // Check explicit type declaration
  const swiss = (
    packageJson as { swissjs?: { type?: unknown; plugin?: unknown } }
  ).swissjs;
  const allowedTypes: readonly ProjectType[] = [
    "component",
    "library",
    "plugin",
  ];
  if (swiss && typeof swiss === "object") {
    const swissType = (swiss as { type?: unknown }).type;
    if (
      typeof swissType === "string" &&
      (allowedTypes as readonly string[]).includes(swissType)
    ) {
      return swissType as ProjectType;
    }
  }

  // Check package.json indicators
  const hasMainModule =
    (packageJson as Record<string, unknown>).main ||
    (packageJson as Record<string, unknown>).module;
  const hasPublicFolder = fs.existsSync(path.join(projectRoot, "public"));
  const hasDevScript = (packageJson as { scripts?: Record<string, unknown> })
    .scripts?.dev;
  const hasServeScript = (packageJson as { scripts?: Record<string, unknown> })
    .scripts?.serve;
  const hasPeerDeps = (
    packageJson as { peerDependencies?: Record<string, unknown> }
  ).peerDependencies?.["@swissjs/core"];
  const keywordsVal = (packageJson as { keywords?: unknown }).keywords;
  const hasPluginKeyword =
    Array.isArray(keywordsVal) &&
    keywordsVal.some(
      (k: unknown) => typeof k === "string" && k.includes("swissjs-plugin"),
    );
  const nameVal = (packageJson as { name?: unknown }).name;
  const hasPluginInName =
    typeof nameVal === "string" && nameVal.includes("plugin-");

  // Plugin detection
  if (
    hasPluginKeyword ||
    hasPluginInName ||
    (swiss && (swiss as { plugin?: unknown }).plugin)
  ) {
    return "plugin";
  }

  // Library detection
  if (
    hasMainModule &&
    hasPeerDeps &&
    !hasPublicFolder &&
    !hasDevScript &&
    !hasServeScript
  ) {
    return "library";
  }

  // Component detection (default for apps with public folder or dev scripts)
  return "component";
}

// Get clear output structure for each project type
// Get clear output structure for each project type
// function getOutputStructure(projectType: ProjectType): {
//   outDir: string;
//   publicDir?: string;
//   buildType: "app" | "lib";
// } {
//   switch (projectType) {
//     case "component":
//       return {
//         outDir: "dist",
//         publicDir: "public",
//         buildType: "app",
//       };
// 
//     case "library":
//       return {
//         outDir: "dist",
//         buildType: "lib",
//       };
// 
//     case "plugin":
//       return {
//         outDir: "dist",
//         buildType: "lib",
//       };
// 
//     default:
//       throw new Error(`Unknown project type: ${projectType}`);
//   }
// }

// Find entry point for the project
// Find entry point for the project
// function getEntryPoint(
//   projectType: ProjectType,
//   swissConfig: SwissJSConfig,
//   srcDir: string,
// ): string {
//   // Use explicit config first
//   if (swissConfig.build?.entry) {
//     const configEntry = path.join(srcDir, swissConfig.build.entry);
//     if (fs.existsSync(configEntry)) {
//       return configEntry;
//     }
//   }
//   // Project-specific entry file priorities
//   const entryOptions = {
//     component: [
//       "main.tsx",
//       "main.ts",
//       "main.js",
//       "index.tsx",
//       "index.ts",
//       "index.js",
//       "app.tsx",
//       "app.ts",
//       "app.js",
//     ],
//     library: [
//       "index.ts",
//       "index.tsx",
//       "index.js",
//       "lib.ts",
//       "lib.tsx",
//       "lib.js",
//     ],
//     plugin: ["index.ts", "plugin.ts", "index.js", "plugin.js"],
//   };
//   for (const entry of entryOptions[projectType]) {
//     const entryPath = path.join(srcDir, entry);
//     if (fs.existsSync(entryPath)) {
//       return entryPath;
//     }
//   }
//   throw new Error(
//     `No entry point found for ${projectType} project. Expected one of: ${entryOptions[projectType].join(", ")}`,
//   );
// }

// Create Vite build configuration
// Create Vite build configuration
// function createBuildConfig(
//   projectType: ProjectType,
//   swissConfig: SwissJSConfig,
//   srcDir: string,
//   outDir: string,
//   options: { mode: string; minify: boolean; sourcemap: boolean },
// ) {
//   const entryPoint = getEntryPoint(projectType, swissConfig, srcDir);
//   const outputStructure = getOutputStructure(projectType);
// 
//   const baseConfig = {
//     root: process.cwd(),
//     mode: options.mode,
//     plugins: [/* swissPlugin() */], // Removed - using SWITE now
//     esbuild: {
//       jsx: "transform",
//     },
//     build: {
//       outDir: path.relative(process.cwd(), outDir),
//       minify: options.minify,
//       sourcemap: options.sourcemap,
//       emptyOutDir: false, // We already cleaned
//     },
//   };
// 
//   if (outputStructure.buildType === "app") {
//     // Component/App build
//     return {
//       ...baseConfig,
//       publicDir: outputStructure.publicDir,
//       build: {
//         ...baseConfig.build,
//         rollupOptions: {
//           input: entryPoint,
//           output: {
//             entryFileNames: "assets/[name].[hash].js",
//             chunkFileNames: "assets/[name].[hash].js",
//             assetFileNames: "assets/[name].[hash].[ext]",
//             manualChunks: {
//               "swissjs-core": ["@swissjs/core"],
//             },
//           },
//         },
//       },
//     };
//   } else {
//     // Library/Plugin build
//     return {
//       ...baseConfig,
//       build: {
//         ...baseConfig.build,
//         lib: {
//           entry: entryPoint,
//           name: projectType === "plugin" ? "SwissJSPlugin" : "SwissJSLibrary",
//           // formats: sanitizeFormats(swissConfig.build?.formats),
//           formats: ["es", "cjs"], // Default formats since build is deprecated
//         },
//         rollupOptions: {
//           external: swissConfig.build?.external || ["@swissjs/core"],
//           output: {
//             globals: {
//               "@swissjs/core": "SwissJS",
//             },
//           },
//         },
//       },
//     };
//   }
// }

// Generate additional files for libraries and plugins
async function generateLibraryFiles(
  projectType: ProjectType,
  packageJson: Record<string, unknown>,
  outDir: string,
  swissConfig: SwissJSConfig,
): Promise<void> {
  console.log(chalk.blue("📝 Generating library files..."));

  // Generate README for the built package
  if (projectType === "library") {
    const readmePath = path.join(outDir, "README.md");
    if (!(await fs.pathExists(readmePath))) {
      const readme = `# ${(packageJson as Record<string, unknown>).name}

Built with SwissJS

## Installation

\`\`\`bash
npm install ${packageJson.name}
\`\`\`

## Usage

\`\`\`typescript
import { /* your exports */ } from '${packageJson.name}';
\`\`\`
`;
      await fs.writeFile(readmePath, readme);
    }
  }

  // Generate plugin manifest for plugins
  if (projectType === "plugin" && swissConfig.plugin) {
    const manifestPath = path.join(outDir, "plugin.json");
    const manifest = {
      name:
        swissConfig.plugin.name ||
        (packageJson as Record<string, unknown>).name,
      version: (packageJson as Record<string, unknown>).version,
      install: swissConfig.plugin.install || "manual",
      config: swissConfig.plugin.config || {},
    };
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(chalk.green("✅ Generated plugin manifest"));
  }
}

// Show next steps based on project type
function showNextSteps(projectType: ProjectType, outDir: string): void {
  console.log(chalk.cyan("\n🚀 Next Steps:"));

  switch (projectType) {
    case "component":
      console.log(chalk.white(`  • Test build: serve files from ${outDir}`));
      console.log(
        chalk.white(`  • Deploy: Upload ${outDir} to your hosting service`),
      );
      break;

    case "library":
      console.log(
        chalk.white(`  • Test locally: npm pack && npm install ./package.tgz`),
      );
      console.log(chalk.white(`  • Publish: npm publish`));
      break;

    case "plugin":
      console.log(
        chalk.white(`  • Test: Create example project and install locally`),
      );
      console.log(chalk.white(`  • Publish: npm publish`));
      break;
  }
}

// (removed) findFiles was unused

async function getBuildStats(
  outDir: string,
): Promise<{ totalSize: number; fileCount: number }> {
  let totalSize = 0;
  let fileCount = 0;

  async function calculateSize(dir: string) {
    try {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await calculateSize(fullPath);
        } else {
          totalSize += stat.size;
          fileCount++;
        }
      }
    } catch (_error) {
      // Ignore errors in stats calculation
      void _error;
    }
  }

  await calculateSize(outDir);
  return { totalSize, fileCount };
}

function formatBytes(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

async function analyzeBundle(outDir: string): Promise<void> {
  try {
    const files = await fs.readdir(outDir);
    const jsFiles = files.filter((f) => f.endsWith(".js"));

    for (const file of jsFiles) {
      const filePath = path.join(outDir, file);
      const stats = await fs.stat(filePath);
      console.log(chalk.white(`  ${file}: ${formatBytes(stats.size)}`));
    }
  } catch (_error) {
    console.warn(chalk.yellow("⚠️  Could not analyze bundle"));
    void _error;
  }
}

// const allowedFormats: readonly LibraryFormats[] = ["es", "cjs", "umd", "iife"];
// function sanitizeFormats(formats: unknown): LibraryFormats[] {
//   if (!Array.isArray(formats)) return ["es", "cjs"];
//   return (formats as unknown[])
//     .filter(
//       (f: unknown): f is LibraryFormats =>
//         typeof f === "string" &&
//         (allowedFormats as readonly string[]).includes(f),
//     )
//     .slice();
// }

// Copy .ts and .uix files from src to .swiss-temp
async function copyTypeScriptFilesToTemp(
  srcDir: string,
  tempDir: string,
  debug = false,
): Promise<void> {
  const copyRecursive = async (src: string, dest: string) => {
    const entries = await fs.readdir(src, { withFileTypes: true });
    await fs.ensureDir(dest);

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyRecursive(srcPath, destPath);
      } else if (
        (entry.name.endsWith(".ts") ||
          entry.name.endsWith(".uix") ||
          entry.name.endsWith(".ui")) &&
        !entry.name.endsWith(".d.ts") &&
        !entry.name.endsWith(".test.ts") &&
        !entry.name.endsWith(".spec.ts") &&
        !entry.name.endsWith(".test.uix") &&
        !entry.name.endsWith(".spec.uix")
      ) {
        await fs.copyFile(srcPath, destPath);
        if (debug)
          console.log(
            `  📄 ${path.relative(srcDir, srcPath)} → ${path.relative(tempDir, destPath)}`,
          );
      }
    }
  };

  await copyRecursive(srcDir, tempDir);
  console.log(chalk.green("✅ TypeScript files copied"));
}

// Process .ui and .uix files to TypeScript in .swiss-temp
export async function compileUiFilesToTemp(
  srcDir: string,
  tempDir: string,
  debug = false,
): Promise<void> {
  const { UiCompiler } = await import("@swissjs/compiler");
  const compiler = new UiCompiler({ outputFormat: "typescript" });

  const findUiFiles = async (dir: string): Promise<string[]> => {
    const files: string[] = [];
    const items = await fs.readdir(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        files.push(...(await findUiFiles(fullPath)));
      } else if (item.endsWith(".ui") || item.endsWith(".uix")) {
        files.push(fullPath);
      }
    }
    return files;
  };

  const uiFiles = await findUiFiles(srcDir);
  for (const file of uiFiles) {
    const relPath = path.relative(srcDir, file);
    const outputPath = path.join(tempDir, relPath.replace(/\.u?ix$/, ".ts"));
    await fs.ensureDir(path.dirname(outputPath));
    const tsCode = await compiler.compileFile(file);
    await fs.writeFile(outputPath, tsCode);
    if (debug)
      console.log(`  ✅ ${relPath} → ${path.relative(tempDir, outputPath)}`);
  }
  console.log(chalk.green("✅ UI files processed to TypeScript"));
}
