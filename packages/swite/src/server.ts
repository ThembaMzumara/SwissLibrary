/*
 * Copyright (c) 2024 Themba Mzumara
 * SWITE - SWISS Development Server
 * Licensed under the MIT License.
 */

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { UiCompiler } from "@swissjs/compiler";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ModuleResolver } from "./resolver.js";
import { rewriteImports } from "./import-rewriter.js";
import { HMREngine } from "./hmr.js";
import chalk from "chalk";

export interface SwiteConfig {
  root: string;
  publicDir: string;
  port: number;
  host: string;
  open: boolean;
}

export class SwiteServer {
  private app = express();
  private compiler = new UiCompiler();
  private resolver: ModuleResolver;
  private hmr: HMREngine;
  private config: SwiteConfig;

  constructor(config: Partial<SwiteConfig> = {}) {
    this.config = {
      root: process.cwd(),
      publicDir: "public",
      port: 3000,
      host: "localhost",
      open: true,
      ...config,
    };

    this.resolver = new ModuleResolver(this.config.root);
    this.hmr = new HMREngine(this.config.root);
  }

  async start() {
    const startTime = Date.now();
    console.log(chalk.cyan("\n⚡ SWITE - SWISS Development Server\n"));

    // Setup middleware
    this.setupMiddleware();

    // Start HMR
    await this.hmr.start();

    // Start HTTP server
    await new Promise<void>((resolve) => {
      this.app.listen(this.config.port, this.config.host, () => {
        console.log(
          chalk.green(
            `  ➜ Local:   http://${this.config.host}:${this.config.port}/`,
          ),
        );
        console.log(chalk.gray(`  ➜ Ready in ${Date.now() - startTime}ms\n`));
        resolve();
      });
    });
  }

  private setupMiddleware() {
    // HMR client injection
    this.app.get("/__swite_hmr_client", (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.send(this.hmr.getClientScript());
    });

    // Module transformation middleware
    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      const url = req.url.split("?")[0];

      try {
        // Handle .ui files
        if (url.endsWith(".ui")) {
          await this.handleUIFile(url, res);
          return;
        }

        // Handle .uix files
        if (url.endsWith(".uix")) {
          await this.handleUIXFile(url, res);
          return;
        }

        // Handle .ts files
        if (url.endsWith(".ts") && !url.endsWith(".d.ts")) {
          await this.handleTSFile(url, res);
          return;
        }

        // Handle .js/.mjs files from node_modules (rewrite imports)
        if (
          (url.endsWith(".js") || url.endsWith(".mjs")) &&
          url.includes("node_modules")
        ) {
          await this.handleNodeModuleFile(url, res);
          return;
        }

        // Handle .js files (rewrite imports)
        if (url.endsWith(".js")) {
          await this.handleJSFile(url, res);
          return;
        }

        next();
      } catch (error) {
        console.error(chalk.red(`Error processing ${url}:`), error);
        res
          .status(500)
          .send(
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          );
      }
    });

    // Static file serving
    const publicPath = path.join(this.config.root, this.config.publicDir);
    this.app.use(express.static(publicPath));

    // Serve node_modules as static files
    this.app.use(
      "/node_modules",
      express.static(path.join(this.config.root, "node_modules")),
    );

    // SPA fallback
    this.app.get("*", (req, res) => {
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  private async handleUIFile(url: string, res: Response) {
    const filePath = path.join(this.config.root, url);
    console.log(chalk.blue(`[.ui] ${url}`));

    const source = await fs.readFile(filePath, "utf-8");
    const compiled = await this.compiler.compileAsync(source, filePath);
    const rewritten = await rewriteImports(compiled, filePath, this.resolver);

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(rewritten);
  }

  private async handleUIXFile(url: string, res: Response) {
    const filePath = path.join(this.config.root, url);
    console.log(chalk.blue(`[.uix] ${url}`));

    const source = await fs.readFile(filePath, "utf-8");
    const compiled = await this.compiler.compileAsync(source, filePath);
    const rewritten = await rewriteImports(compiled, filePath, this.resolver);

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(rewritten);
  }

  private async handleTSFile(url: string, res: Response) {
    const filePath = path.join(this.config.root, url);
    console.log(chalk.gray(`[.ts] ${url}`));

    const source = await fs.readFile(filePath, "utf-8");

    // Use esbuild for fast TS transformation
    const esbuild = await import("esbuild");
    const result = await esbuild.transform(source, {
      loader: "ts",
      format: "esm",
      target: "esnext",
      sourcefile: filePath,
    });

    const rewritten = await rewriteImports(
      result.code,
      filePath,
      this.resolver,
    );

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(rewritten);
  }

  private async handleNodeModuleFile(url: string, res: Response) {
    let filePath = path.join(this.config.root, url);
    console.log(chalk.gray(`[node_modules] ${url}`));

    // Check if file exists, if .js doesn't exist try .ts, .ui, .uix
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist, try alternatives if it's a .js request
      if (url.endsWith(".js")) {
        const basePath = filePath.slice(0, -3); // Remove .js
        const alternatives = [
          { ext: ".ts", handler: () => this.handleTSFile(url.replace(/\.js$/, ".ts"), res) },
          { ext: ".ui", handler: () => this.handleUIFile(url.replace(/\.js$/, ".ui"), res) },
          { ext: ".uix", handler: () => this.handleUIXFile(url.replace(/\.js$/, ".uix"), res) },
        ];

        for (const alt of alternatives) {
          try {
            await fs.access(basePath + alt.ext);
            console.log(chalk.yellow(`[.js→${alt.ext}] ${url} → ${url.replace(/\.js$/, alt.ext)}`));
            return await alt.handler();
          } catch {
            // Try next alternative
          }
        }
      }

      // No alternatives found or not a .js file, throw error
      throw new Error(`File not found: ${url}`);
    }

    // File exists, process it normally
    const source = await fs.readFile(filePath, "utf-8");
    const rewritten = await rewriteImports(source, filePath, this.resolver);

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(rewritten);
  }

  private async handleJSFile(url: string, res: Response) {
    let filePath = path.join(this.config.root, url);

    // Check if .js file exists, if not try .ts, .ui, .uix
    try {
      await fs.access(filePath);
    } catch {
      // .js doesn't exist, try alternatives
      const basePath = filePath.slice(0, -3); // Remove .js
      const alternatives = [
        { ext: ".ts", handler: () => this.handleTSFile(url.replace(/\.js$/, ".ts"), res) },
        { ext: ".ui", handler: () => this.handleUIFile(url.replace(/\.js$/, ".ui"), res) },
        { ext: ".uix", handler: () => this.handleUIXFile(url.replace(/\.js$/, ".uix"), res) },
      ];

      for (const alt of alternatives) {
        try {
          await fs.access(basePath + alt.ext);
          console.log(`[.js→${alt.ext}] ${url} → ${url.replace(/\.js$/, alt.ext)}`);
          return await alt.handler();
        } catch {
          // Try next alternative
        }
      }

      // No alternatives found, throw error
      throw new Error(`File not found: ${url} (tried .js, .ts, .ui, .uix)`);
    }

    // .js file exists, process it normally
    const source = await fs.readFile(filePath, "utf-8");
    const rewritten = await rewriteImports(source, filePath, this.resolver);

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(rewritten);
  }
}
