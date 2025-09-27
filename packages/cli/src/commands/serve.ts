/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { createServer as createHttpsServer, Server as HttpsServer } from 'https';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';

export const serveCommand = new Command('serve')
  .description('Serve the production build')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .option('--https', 'Enable HTTPS', false)
  .option('--cert <path>', 'SSL certificate path')
  .option('--key <path>', 'SSL private key path')
  .option('--build-dir <dir>', 'Build directory to serve', 'dist')
  .option('--api-proxy <url>', 'Proxy API requests to URL')
  .option('--spa', 'Enable SPA mode (serve index.html for all routes)', true)
  .action(async (options: Record<string, unknown>) => {
    try {
      console.log(chalk.blue('🧀 SwissJS Production Server'));
      console.log(chalk.gray('Starting production server...\n'));

      const projectRoot = process.cwd();
      const buildDir = path.resolve(projectRoot, String(options.buildDir ?? 'dist'));

      // Check if build directory exists
      if (!await fs.pathExists(buildDir)) {
        console.error(chalk.red(`❌ Build directory "${options.buildDir}" not found. Run 'swissjs build' first.`));
        process.exit(1);
      }

      // Check if build directory has content
      const buildFiles = await fs.readdir(buildDir);
      if (buildFiles.length === 0) {
        console.error(chalk.red(`❌ Build directory "${options.buildDir}" is empty. Run 'swissjs build' first.`));
        process.exit(1);
      }

      console.log(chalk.blue(`📁 Serving from: ${buildDir}`));

      // Create Express app
      const app = express();

      // Security middleware
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        }
      }));

      // CORS
      app.use(cors({
        origin: process.env.NODE_ENV === 'production' ? false : true,
        credentials: true
      }));

      // Compression (ensure correct RequestHandler type)
      app.use(compression() as unknown as express.RequestHandler);

      // API proxy if specified
      const apiProxy = options.apiProxy ? String(options.apiProxy) : '';
      if (apiProxy) {
        console.log(chalk.blue(`🔗 API proxy enabled: ${apiProxy}`));
        
        const { createProxyMiddleware } = await import('http-proxy-middleware');
        
        app.use('/api', createProxyMiddleware({
          target: apiProxy,
          changeOrigin: true,
          pathRewrite: {
            '^/api': ''
          },
          logLevel: 'silent'
        }) as unknown as express.RequestHandler);
      }

      // Serve static files
      app.use(express.static(buildDir, {
        maxAge: '1y',
        etag: true,
        lastModified: true,
        setHeaders: (res: express.Response, p: string) => {
          // Cache static assets
          if (p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.gif') || p.endsWith('.svg')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
          }
        }
      }));

      // SPA mode - serve index.html for all routes
      const spa = Boolean(options.spa ?? true);
      if (spa) {
        app.get('*', async (_req: express.Request, res: express.Response) => {
          const indexPath = path.join(buildDir, 'index.html');
          if (await fs.pathExists(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send('Not found');
          }
        });
      }

      // Create server
      let server: HttpServer | HttpsServer;
      const useHttps = Boolean(options.https ?? false);
      if (useHttps) {
        const certPath = options.cert ? String(options.cert) : '';
        const keyPath = options.key ? String(options.key) : '';
        if (!certPath || !keyPath) {
          console.error(chalk.red('❌ HTTPS requires --cert and --key options'));
          process.exit(1);
        }

        const httpsOptions = {
          cert: await fs.readFile(certPath),
          key: await fs.readFile(keyPath)
        };

        server = createHttpsServer(httpsOptions, app);
        console.log(chalk.blue('🔒 HTTPS enabled'));
      } else {
        server = createServer(app);
      }

      // Start server
      const port = parseInt(String(options.port ?? '3000'), 10);
      const host = String(options.host ?? 'localhost');
      server.listen(port, host, () => {
        const protocol = useHttps ? 'https' : 'http';
        const serverUrl = `${protocol}://${host}:${port}`;
        
        console.log(chalk.green(`✅ Production server running at ${serverUrl}`));
        console.log(chalk.cyan('\n📊 Server Information:'));
        console.log(chalk.white(`  Build directory: ${buildDir}`));
        console.log(chalk.white(`  SPA mode: ${spa ? 'enabled' : 'disabled'}`));
        if (apiProxy) {
          console.log(chalk.white(`  API proxy: ${apiProxy}`));
        }
        console.log(chalk.white(`  HTTPS: ${useHttps ? 'enabled' : 'disabled'}`));
        console.log(chalk.cyan('\n📝 Available commands:'));
        console.log(chalk.white('  Press Ctrl+C to stop the server'));
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Shutting down production server...'));
        server.close(() => {
          console.log(chalk.green('✅ Server stopped'));
          process.exit(0);
        });
      });

      process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n🛑 Shutting down production server...'));
        server.close(() => {
          console.log(chalk.green('✅ Server stopped'));
          process.exit(0);
        });
      });

      // Error handling
      server.on('error', (error: unknown) => {
        const err = error as NodeJS.ErrnoException | undefined;
        if (err && err.code === 'EADDRINUSE') {
          console.error(chalk.red(`❌ Port ${String(options.port ?? '3000')} is already in use`));
          console.log(chalk.cyan('Try using a different port with --port option'));
        } else {
          console.error(chalk.red('❌ Server error:'), error);
        }
        process.exit(1);
      });

    } catch (error) {
      console.error(chalk.red('❌ Production server failed:'), error);
      process.exit(1);
    }
  });