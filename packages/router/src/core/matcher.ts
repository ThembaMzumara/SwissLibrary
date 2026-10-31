export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  route: any; // TODO: Type as Route
  branches?: RouteMatch[]; // Helper for nested matches if needed
}

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  route: any; // TODO: Type as Route
}

export function matchRoute(
  routes: any[],
  path: string,
  basePath = "",
): RouteMatch[] | undefined {
  for (const route of routes) {
    const fullPath = (basePath + "/" + route.path).replace(/\/+/g, "/");

    // Check if current path matches this route segment
    const match = matchPath(fullPath, path, !route.children);

    if (match) {
      const currentMatch: RouteMatch = {
        path: fullPath,
        params: match.params,
        route,
      };

      // If exact match or no children, we found a leaf (or exact parent match if allowed)
      if (match.isExact) {
        return [currentMatch];
      }

      // If not exact, we must look into children
      if (route.children) {
        const childBranch = matchRoute(route.children, path, fullPath);
        if (childBranch) {
          return [currentMatch, ...childBranch];
        }
      }
    }
  }
  return undefined;
}

function matchPath(
  routePath: string,
  currentPath: string,
  end: boolean,
): { params: Record<string, string>; isExact: boolean } | null {
  // Normalize paths
  const routeParts = routePath.split("/").filter(Boolean);
  const currentParts = currentPath.split("/").filter(Boolean);

  // If strict match requested (end=true), lengths must match
  if (end && routeParts.length !== currentParts.length) {
    return null;
  }

  // If prefix match allowed (end=false), route must be shorter or equal
  if (!end && routeParts.length > currentParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const currentPart = currentParts[i];

    if (routePart.startsWith(":")) {
      const paramName = routePart.slice(1);
      params[paramName] = currentPart;
    } else if (routePart !== currentPart) {
      return null;
    }
  }

  return {
    params,
    isExact: routeParts.length === currentParts.length,
  };
}
