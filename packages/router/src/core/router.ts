import { matchRoute, RouteMatch } from "./matcher";

export type LoaderFunction = (params: any) => Promise<any>;
export type ActionFunction = (params: any) => Promise<any>;

export interface Route {
  path: string;
  component: any;
  layout?: any;
  children?: Route[];
  loader?: LoaderFunction;
  action?: ActionFunction;
}

export interface RouterOptions {
  routes: Route[];
  mode?: "history" | "hash";
  base?: string;
}

export type NavigationGuard = (
  to: string,
  from: string,
) => Promise<boolean | string | void> | boolean | string | void;

export class Router {
  private routes: Route[];
  private mode: "history" | "hash";
  private base: string;
  private currentPath: string;
  private beforeHooks: NavigationGuard[] = [];

  constructor(options: RouterOptions) {
    this.routes = options.routes;
    this.mode = options.mode || "history";
    this.base = options.base || "/";
    this.currentPath = this.getCurrentPath();

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", this.handlePopState.bind(this));
    }
  }

  private getCurrentPath(): string {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
  }

  private handlePopState() {
    this.currentPath = this.getCurrentPath();
    // TODO: Trigger re-render or signal update
  }

  public beforeEach(guard: NavigationGuard) {
    this.beforeHooks.push(guard);
  }

  private async runGuards(to: string): Promise<boolean> {
    for (const guard of this.beforeHooks) {
      const result = await guard(to, this.currentPath);
      if (result === false) return false;
      if (typeof result === "string") {
        this.push(result);
        return false;
      }
    }
    return true;
  }

  public async push(path: string) {
    if (await this.runGuards(path)) {
      if (typeof window !== "undefined") {
        history.pushState(null, "", path);
        this.handlePopState();
      }
    }
  }

  public async replace(path: string) {
    if (await this.runGuards(path)) {
      if (typeof window !== "undefined") {
        history.replaceState(null, "", path);
        this.handlePopState();
      }
    }
  }

  public addRoute(path: string, component: any) {
    this.routes.push({
      path,
      component,
    });
  }

  public match(path: string): RouteMatch[] | undefined {
    return matchRoute(this.routes, path);
  }

  public async loadRouteData(path: string): Promise<Record<string, any>> {
    const matches = this.match(path);
    if (!matches) return {};

    const data: Record<string, any> = {};

    // Run loaders in parallel
    await Promise.all(
      matches.map(async (match) => {
        if (match.route.loader) {
          try {
            const result = await match.route.loader({
              params: match.params,
              request: new Request("http://localhost" + path), // Mock request for now
            });
            // Key data by route path or some ID?
            // For now, let's just merge it, but ideally we need per-component data
            // Let's key it by the route path pattern to be unique enough for this simple implementation
            data[match.route.path] = result;
          } catch (err) {
            console.error(`Loader failed for ${match.route.path}`, err);
            data[match.route.path] = { error: err };
          }
        }
      }),
    );

    return data;
  }
}

export * from "./matcher";
export * from "./link";
export * from "./outlet";

export function createRouter(options: RouterOptions): Router {
  return new Router(options);
}
