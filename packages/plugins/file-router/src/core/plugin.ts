/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Plugin, PluginContext, RouteDefinition } from '@swissjs/core';
import type { FileRouterOptions } from '../types/index.js';
import { RouteScanner } from './scanner.js';

export const fileRouterPlugin = (options: FileRouterOptions = {}): Plugin => {
  const config = {
    routesDir: './routes',
    extensions: ['.ui', '.js', '.ts'],
    layouts: true,
    lazyLoading: true,
    preloading: false,
    ...options
  };

  let pluginContext: PluginContext | null = null;
  let appContext: unknown = null;
  let routes: RouteDefinition[] = [];

  return {
    name: 'file-router',
    version: '1.0.0',
    requiredCapabilities: ['filesystem', 'imports'],
    
    providesService(name: string): boolean {
      return name === 'fileRouter';
    },

    getService(name: string): unknown {
      if (name === 'fileRouter') {
        return {
          scanRoutes: async (routesDir: string) => {
            const scanner = new RouteScanner(config);
            return await scanner.scanRoutes(routesDir);
          },
          registerRoute: (route: RouteDefinition) => {
            const app = appContext as { registerRoute?: (path: string, handler: unknown) => void } | null;
            if (app && typeof app.registerRoute === 'function') {
              // RouteDefinition.component may be a constructor or dynamic import function; handler here is the component
              app.registerRoute(route.path, route.component);
            }
          },
          getRoutes: () => routes
        };
      }
      return null;
    },

    init(context: PluginContext): void {
      pluginContext = context;
      
      // Hook into route resolution
      context.registerHook({
        name: 'beforeRouteResolve',
        handler: async (routePath: string) => {
          const route = routes.find(r => r.path === routePath);
          if (route) {
            if (typeof route.component === 'function') {
              // Dynamic import function
              const componentModule = await (route.component as () => Promise<{ default: unknown }>)();
              return componentModule.default;
            }
            return route.component;
          }
          return null;
        },
        priority: 'high'
      });

      // Hook into component mounting for route context
      context.registerHook({
        name: 'beforeComponentMount',
        handler: (componentContext: unknown) => {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const route = routes.find(r => r.path === currentPath);
          
          if (route) {
            if (componentContext && typeof componentContext === 'object') {
              (componentContext as Record<string, unknown>).route = {
                path: currentPath,
                params: extractParams(route.path, currentPath),
                meta: route.meta
              };
            }
          }
        },
        priority: 'normal'
      });
    },

    async onLoad(context: PluginContext): Promise<void> {
      if (context.app) {
        appContext = context.app;
      }

      const scanner = new RouteScanner(config);
      const app = appContext as { name?: string } | null;
      const routesPath = app?.name ? 
        `${app.name}/${config.routesDir}` : 
        config.routesDir;
      
      try {
        routes = await scanner.scanRoutes(routesPath || config.routesDir);
        
        routes.forEach(route => {
          const app2 = appContext as { registerRoute?: (path: string, handler: unknown) => void } | null;
          if (app2 && typeof app2.registerRoute === 'function') {
            const register = app2.registerRoute;
            register(route.path, route.component);
          }
        });

        console.log(`✅ File Router: Registered ${routes.length} routes`);

        if (context.dev?.isDevMode && context.dev?.hotReload !== false) {
          await setupHotReload(context, config);
        }

      } catch (error) {
        console.error('❌ File Router: Failed to scan routes:', error);
        throw error;
      }
    },

    onUnload(context: PluginContext): void {
      void context;
      routes = [];
      pluginContext = null;
      appContext = null;
    },

    onDevServerStart(context: PluginContext, server: unknown): void {
      console.log('🔄 File Router: Development server started');
      
      const srv = server as { registerRoute?: (path: string, handler: unknown) => void } | null;
      if (srv && typeof srv.registerRoute === 'function' && routes.length > 0) {
        const register = srv.registerRoute;
        routes.forEach(route => {
          register(route.path, route.component);
        });
      }
    },

    onDevServerStop(context: PluginContext): void {
      void context;
      console.log('🛑 File Router: Development server stopped');
    }
  };

  function extractParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternSegments = pattern.split('/');
    const pathSegments = path.split('/');

    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i];
      const pathSegment = pathSegments[i];

      if (patternSegment?.startsWith(':')) {
        const paramName = patternSegment.slice(1);
        params[paramName] = pathSegment || '';
      }
    }

    return params;
  }

  async function setupHotReload(context: PluginContext, config: FileRouterOptions): Promise<void> {
    if (context.dev?.watchFiles) {
      const app = appContext as { name?: string; registerRoute?: (path: string, handler: unknown) => void } | null;
      const routesPath = app?.name ? 
        `${app.name}/${config.routesDir || './routes'}` : 
        (config.routesDir || './routes');
      
      const finalRoutesPath = routesPath;

      context.dev.watchFiles([finalRoutesPath], async (_event: string, file: string) => {
        console.log(`🔄 File Router: Route file changed: ${file}`);
        
        const scanner = new RouteScanner(config);
        routes = await scanner.scanRoutes(finalRoutesPath);
        
        routes.forEach(route => {
          const app2 = appContext as { registerRoute?: (path: string, handler: unknown) => void } | null;
          if (app2 && typeof app2.registerRoute === 'function') {
            app2.registerRoute(route.path, route.component);
          }
        });
        
        if (pluginContext) {
          const hooksObj = (pluginContext as unknown as { hooks: { callHook: (name: string, payload: unknown) => void } }).hooks;
          hooksObj.callHook('routeRegistryUpdated', { routes });
        }
      });
    }
  }
}; 