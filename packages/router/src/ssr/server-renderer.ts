

import { Router, RouteMatch } from '../core/router';


export interface SSRContext {
    url: string;
    data?: Record<string, any>;
}

export interface SSRResult {
    html: string;
    data: Record<string, any>;
    statusCode: number;
    redirect?: string;
}

export class ServerRenderer {
    constructor(private router: Router) { }

    async render(url: string): Promise<SSRResult> {
        // Match routes
        const matches = this.router.match(url);

        if (!matches) {
            return {
                html: '<h1>404 - Not Found</h1>',
                data: {},
                statusCode: 404
            };
        }

        // Load data for all matched routes
        const data = await this.router.loadRouteData(url);

        // Get the leaf component (last in branch)
        const leafMatch = matches[matches.length - 1];
        const Component = leafMatch.route.component;

        // TODO: Integrate with @swissjs/core renderToString
        // For now, return a placeholder
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Swiss App</title>
        </head>
        <body>
          <div id="app">
            <!-- Component: ${Component.name || 'Unknown'} -->
            <!-- Route: ${url} -->
            <!-- Data: ${JSON.stringify(data)} -->
          </div>
          <script>
            window.__SWISS_DATA__ = ${JSON.stringify(data)};
          </script>
        </body>
      </html>
    `;

        return {
            html,
            data,
            statusCode: 200
        };
    }
}

export function createServerRenderer(router: Router): ServerRenderer {
    return new ServerRenderer(router);
}
