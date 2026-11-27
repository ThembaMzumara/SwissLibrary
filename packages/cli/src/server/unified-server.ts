/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import express from "express";
import { join } from "path";
import fs from "fs-extra";
import chalk from "chalk";
import type { Request, Response, NextFunction } from "express";

export interface UnifiedServerOptions {
  port: number;
  host: string;
  buildDir: string;
  projectRoot: string;
  apiDir?: string;
  pagesDir?: string;
  middlewareFile?: string;
  enableSSR?: boolean;
  enableAPI?: boolean;
  enableFileRouting?: boolean;
  // Development mode options
  mode?: "development" | "production";
  enableVite?: boolean;
  viteConfig?: string;
  open?: boolean;
}

export interface APIHandler {
  default?: (req: Request, res: Response) => void | Promise<void>;
  GET?: (req: Request, res: Response) => void | Promise<void>;
  POST?: (req: Request, res: Response) => void | Promise<void>;
  PUT?: (req: Request, res: Response) => void | Promise<void>;
  DELETE?: (req: Request, res: Response) => void | Promise<void>;
  PATCH?: (req: Request, res: Response) => void | Promise<void>;
}

export interface RouteHandler {
  default?: unknown; // SwissComponent class
  getServerSideProps?: (
    context: Record<string, unknown>,
  ) => Promise<{ props: Record<string, unknown> }>;
}

export interface MiddlewareConfig {
  matcher?: string | string[] | RegExp;
}

export interface SwissMiddleware {
  default: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void | Promise<void>;
  config?: MiddlewareConfig;
}

export class UnifiedServer {
  private app: express.Application;
  private options: UnifiedServerOptions;
  private routes: Map<string, RouteHandler> = new Map();
  private middlewares: Array<{
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => void | Promise<void>;
    config?: MiddlewareConfig;
  }> = [];
  private vite: unknown = null; // ViteDevServer instance

  constructor(options: UnifiedServerOptions) {
    this.options = options;
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Load custom middleware
    if (this.options.middlewareFile) {
      this.loadMiddleware();
    }
  }

  private async loadMiddleware() {
    const middlewarePath = join(
      this.options.projectRoot,
      this.options.middlewareFile!,
    );
    if (await fs.pathExists(middlewarePath)) {
      try {
        const middlewareModule: SwissMiddleware = await import(middlewarePath);
        if (middlewareModule.default) {
          this.middlewares.push({
            handler: middlewareModule.default,
            config: middlewareModule.config,
          });
          console.log(chalk.blue("🔧 Custom middleware loaded"));
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Failed to load middleware: ${error}`));
      }
    }
  }

  private matchesPattern(
    path: string,
    pattern: string | string[] | RegExp,
  ): boolean {
    if (typeof pattern === "string") {
      return path.startsWith(pattern);
    }
    if (Array.isArray(pattern)) {
      return pattern.some((p) => path.startsWith(p));
    }
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    return false;
  }

  private applyCustomMiddleware() {
    this.middlewares.forEach(({ handler, config }) => {
      if (config?.matcher) {
        this.app.use((req, res, next) => {
          if (this.matchesPattern(req.path, config.matcher!)) {
            return handler(req, res, next);
          }
          next();
        });
      } else {
        this.app.use(handler as express.RequestHandler);
      }
    });
  }

  async setupAPIRoutes() {
    if (!this.options.enableAPI) return;

    const apiDir = this.options.apiDir || join(this.options.projectRoot, "api");
    if (!(await fs.pathExists(apiDir))) {
      console.log(chalk.gray("📁 No API directory found, skipping API routes"));
      return;
    }

    console.log(chalk.blue("🔗 Setting up API routes..."));
    await this.scanAPIRoutes(apiDir, "");
  }

  private async scanAPIRoutes(dir: string, routePrefix: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanAPIRoutes(fullPath, `${routePrefix}/${entry.name}`);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".js") || entry.name.endsWith(".ts"))
      ) {
        const routeName = entry.name.replace(/\.(js|ts)$/, "");
        const apiPath =
          routeName === "index"
            ? `/api${routePrefix}`
            : `/api${routePrefix}/${routeName}`;

        try {
          const handler: APIHandler = await import(fullPath);
          this.setupAPIRoute(apiPath, handler);
          console.log(chalk.green(`  ✅ ${apiPath}`));
        } catch (error) {
          console.warn(
            chalk.yellow(`  ⚠️  Failed to load ${apiPath}: ${error}`),
          );
        }
      }
    }
  }

  private setupAPIRoute(path: string, handler: APIHandler) {
    // Support method-specific handlers
    if (handler.GET) this.app.get(path, handler.GET as express.RequestHandler);
    if (handler.POST)
      this.app.post(path, handler.POST as express.RequestHandler);
    if (handler.PUT) this.app.put(path, handler.PUT as express.RequestHandler);
    if (handler.DELETE)
      this.app.delete(path, handler.DELETE as express.RequestHandler);
    if (handler.PATCH)
      this.app.patch(path, handler.PATCH as express.RequestHandler);

    // Support default handler for all methods
    if (handler.default) {
      this.app.all(path, handler.default as express.RequestHandler);
    }
  }

  async setupFileBasedRouting() {
    if (!this.options.enableFileRouting) return;

    const pagesDir =
      this.options.pagesDir || join(this.options.projectRoot, "pages");
    if (!(await fs.pathExists(pagesDir))) {
      console.log(
        chalk.gray("📁 No pages directory found, skipping file-based routing"),
      );
      return;
    }

    console.log(chalk.blue("📄 Setting up file-based routing..."));
    await this.scanPageRoutes(pagesDir, "");
  }

  private async scanPageRoutes(dir: string, routePrefix: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanPageRoutes(fullPath, `${routePrefix}/${entry.name}`);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ui") ||
          entry.name.endsWith(".js") ||
          entry.name.endsWith(".ts"))
      ) {
        const routeName = entry.name.replace(/\.(ui|js|ts)$/, "");
        const pagePath =
          routeName === "index"
            ? routePrefix || "/"
            : `${routePrefix}/${routeName}`;

        try {
          const handler: RouteHandler = await import(fullPath);
          this.routes.set(pagePath, handler);
          this.setupPageRoute(pagePath, handler);
          console.log(chalk.green(`  ✅ ${pagePath}`));
        } catch (error) {
          console.warn(
            chalk.yellow(`  ⚠️  Failed to load ${pagePath}: ${error}`),
          );
        }
      }
    }
  }

  private setupPageRoute(path: string, handler: RouteHandler) {
    this.app.get(path, async (req, res) => {
      try {
        if (this.options.enableSSR && handler.getServerSideProps) {
          // SSR with data fetching
          const context = { req, res, params: req.params, query: req.query };
          const { props } = await handler.getServerSideProps(context);
          await this.renderSSR(handler.default, props, req, res);
        } else if (this.options.enableSSR && handler.default) {
          // SSR without data fetching
          await this.renderSSR(handler.default, {}, req, res);
        } else {
          // Client-side routing fallback
          const indexPath = join(this.options.buildDir, "index.html");
          if (await fs.pathExists(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send("Page not found");
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error rendering ${path}:`), error);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  private async renderSSR(
    Component: unknown,
    props: Record<string, unknown>,
    req: Request,
    res: Response,
  ) {
    if (!Component) {
      throw new Error("Component not found");
    }

    try {
      // Create component instance
      const instance = new (Component as new (
        props: Record<string, unknown>,
      ) => unknown)(props);

      // Render to string (this would need to be implemented in SwissJS core)
      const html = await this.renderComponentToString(instance);

      // Send HTML response
      res.setHeader("Content-Type", "text/html");
      res.send(this.wrapInHTML(html, props));
    } catch (error) {
      throw new Error(`SSR rendering failed: ${error}`);
    }
  }

  private async renderComponentToString(component: unknown): Promise<string> {
    // This would need to be implemented in SwissJS core
    // For now, return a placeholder
    if (
      (component as { render?: () => unknown }).render &&
      typeof (component as { render?: () => unknown }).render === "function"
    ) {
      const result = (component as { render: () => unknown }).render();
      return typeof result === "string" ? result : JSON.stringify(result);
    }
    return "<div>SSR Component</div>";
  }

  private wrapInHTML(content: string, props: Record<string, unknown>): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SwissJS App</title>
  <script>
    window.__SWISS_PROPS__ = ${JSON.stringify(props)};
  </script>
</head>
<body>
  <div id="app">${content}</div>
  <script type="module" src="/main.js"></script>
</body>
</html>`;
  }

  private async setupViteMiddleware() {
    if (!this.options.enableVite) return;

    try {
      // Dynamically import Vite (only in development)
      const { createServer: createViteServer } = await import("vite");

      console.log(chalk.blue("⚡ Setting up Vite dev server middleware..."));

      // Create Vite dev server in middleware mode
      this.vite = (await createViteServer({
        configFile:
          this.options.viteConfig ||
          join(this.options.projectRoot, "vite.config.js"),
        server: {
          middlewareMode: true, // Run as middleware in our Express server
          hmr: false, // Disable HMR to prevent auto-refresh
          watch: {
            // Reduce watch aggressiveness
            ignored: ["**/node_modules/**", "**/.git/**"],
          },
        },
        appType: "custom", // We handle the HTML serving
        root: this.options.projectRoot,
      })) as unknown;

      // Use Vite's connect instance as middleware
      // This handles HMR, .ui file transformation, and module serving
      this.app.use(
        (this.vite as { middlewares: unknown })
          .middlewares as express.RequestHandler,
      );

      // Serve index.html for root path in dev mode
      // Vite will transform it and inject HMR client
      this.app.get("/", async (_req, res, next) => {
        try {
          const indexPath = join(this.options.buildDir, "index.html");
          if (await fs.pathExists(indexPath)) {
            // Read the HTML file
            let html = await fs.readFile(indexPath, "utf-8");

            // Let Vite transform the HTML
            const viteServer = this.vite as {
              transformIndexHtml: (
                url: string,
                html: string,
              ) => Promise<string>;
            };
            html = await viteServer.transformIndexHtml("/", html);

            res.setHeader("Content-Type", "text/html");
            res.send(html);
          } else {
            next();
          }
        } catch (error) {
          next(error);
        }
      });

      console.log(chalk.green("✅ Vite middleware initialized"));
      console.log(chalk.gray("   • Hot Module Replacement (HMR) disabled"));
      console.log(chalk.gray("   • .ui file transformation via swissPlugin"));
      console.log(
        chalk.gray("   • Auto-refresh disabled for stable development"),
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to setup Vite middleware:"), error);
      throw error;
    }
  }

  async setupStaticFiles() {
    // Check if public directory exists within build directory
    const publicDir = join(this.options.buildDir, "public");
    const hasPublicDir = await fs.pathExists(publicDir);

    if (hasPublicDir) {
      // Serve static files from public subdirectory
      console.log(chalk.gray(`📁 Serving static files from: ${publicDir}`));
      this.app.use(
        express.static(publicDir, {
          maxAge: "1y",
          etag: true,
          lastModified: true,
          setHeaders: (res: Response, filePath: string) => {
            if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
              res.setHeader("Cache-Control", "public, max-age=31536000");
            }
          },
        }),
      );
    } else {
      // Fallback to serve from build directory root
      console.log(
        chalk.gray(`📁 Serving static files from: ${this.options.buildDir}`),
      );
      this.app.use(
        express.static(this.options.buildDir, {
          maxAge: "1y",
          etag: true,
          lastModified: true,
          setHeaders: (res: Response, filePath: string) => {
            if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
              res.setHeader("Cache-Control", "public, max-age=31536000");
            }
          },
        }),
      );
    }

    // Also serve other build assets (JS, API, etc.) from build directory root
    this.app.use("/api", express.static(join(this.options.buildDir, "api")));
    this.app.use(
      "/components",
      express.static(join(this.options.buildDir, "components")),
    );
    this.app.use(
      "/pages",
      express.static(join(this.options.buildDir, "pages")),
    );
    this.app.use(
      "/dependencies",
      express.static(join(this.options.buildDir, "dependencies")),
    );

    // Serve JavaScript files from build root with correct MIME type
    this.app.get("/*.js", (req, res, next) => {
      const filePath = join(this.options.buildDir, req.path);
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "application/javascript");
        res.sendFile(filePath);
      } else {
        next();
      }
    });

    // Serve .ui files as JavaScript (for source imports)
    this.app.get("/*.ui", (req, res, next) => {
      const filePath = join(this.options.buildDir, req.path);
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "application/javascript");
        res.sendFile(filePath);
      } else {
        next();
      }
    });
  }

  async start(): Promise<void> {
    const isDev = this.options.mode === "development";

    // Apply custom middleware first
    this.applyCustomMiddleware();

    // In development mode, setup Vite middleware BEFORE other routes
    if (isDev && this.options.enableVite) {
      await this.setupViteMiddleware();
    }

    // Setup API routes
    await this.setupAPIRoutes();

    // Setup file-based routing
    await this.setupFileBasedRouting();

    // Setup static file serving (only in production or if Vite is disabled)
    if (!isDev || !this.options.enableVite) {
      await this.setupStaticFiles();
    }

    // Fallback for SPA routing (only in production or if Vite is disabled)
    // In dev mode with Vite, Vite middleware handles all requests including HTML
    if (!isDev || !this.options.enableVite) {
      this.app.get("*", async (_req, res) => {
        const indexPath = join(this.options.buildDir, "index.html");
        if (await fs.pathExists(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Not found");
        }
      });
    }

    // Start server
    this.app.listen(this.options.port, this.options.host, async () => {
      const serverUrl = `http://${this.options.host}:${this.options.port}`;

      console.log(
        chalk.green(`🚀 SwissJS Unified Server running at ${serverUrl}`),
      );

      if (isDev && this.options.enableVite) {
        console.log(chalk.blue(`⚡ Mode: Development (Vite middleware)`));
      } else {
        console.log(chalk.blue(`📦 Mode: Production`));
        console.log(chalk.blue(`📁 Serving from: ${this.options.buildDir}`));
      }

      if (this.options.enableAPI)
        console.log(chalk.blue("🔗 API routes enabled"));
      if (this.options.enableFileRouting)
        console.log(chalk.blue("📄 File-based routing enabled"));
      if (this.options.enableSSR) console.log(chalk.blue("⚡ SSR enabled"));

      // Open browser if requested
      if (this.options.open) {
        console.log(chalk.cyan(`\n🌐 Opening browser at ${serverUrl}...`));
        await this.openBrowser(serverUrl);
      }
    });
  }

  private async openBrowser(url: string): Promise<void> {
    const open = await import("open");
    try {
      await open.default(url);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Failed to open browser: ${error}`));
      console.log(chalk.cyan(`Please open ${url} manually`));
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}
