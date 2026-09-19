
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface APIRequest {
    method: HTTPMethod;
    url: string;
    params: Record<string, string>;
    query: Record<string, string>;
    body?: any;
    headers: Record<string, string>;
}

export interface APIResponse {
    status(code: number): APIResponse;
    json(data: any): void;
    send(data: string): void;
    setHeader(key: string, value: string): APIResponse;
}

export type APIHandler = (req: APIRequest, res: APIResponse) => Promise<void> | void;
export type Middleware = (req: APIRequest, res: APIResponse, next: () => void) => Promise<void> | void;

export interface APIRoute {
    path: string;
    method: HTTPMethod;
    handler: APIHandler;
    middleware?: Middleware[];
}

export class APIRouteHandler {
    private routes: APIRoute[] = [];

    register(route: APIRoute) {
        this.routes.push(route);
    }

    async handle(req: APIRequest): Promise<APIResponse> {
        const matchedRoute = this.findRoute(req.method, req.url);

        if (!matchedRoute) {
            return this.createResponse(404, { error: 'Not Found' });
        }

        // Execute middleware chain
        if (matchedRoute.middleware) {
            for (const mw of matchedRoute.middleware) {
                let nextCalled = false;
                const next = () => { nextCalled = true; };

                const res = this.createResponseObject();
                await mw(req, res, next);

                if (!nextCalled) {
                    return res;
                }
            }
        }

        // Execute handler
        const res = this.createResponseObject();
        await matchedRoute.handler(req, res);
        return res;
    }

    private findRoute(method: HTTPMethod, url: string): APIRoute | undefined {
        return this.routes.find(r => r.method === method && this.matchPath(r.path, url));
    }

    private matchPath(pattern: string, url: string): boolean {
        const patternParts = pattern.split('/').filter(Boolean);
        const urlParts = url.split('/').filter(Boolean);

        if (patternParts.length !== urlParts.length) return false;

        return patternParts.every((part, i) =>
            part.startsWith(':') || part === urlParts[i]
        );
    }

    private createResponseObject(): APIResponse {
        let statusCode = 200;
        let body: any = null;
        const headers: Record<string, string> = {};

        return {
            status(code: number) {
                statusCode = code;
                return this;
            },
            json(data: any) {
                body = JSON.stringify(data);
                headers['Content-Type'] = 'application/json';
            },
            send(data: string) {
                body = data;
            },
            setHeader(key: string, value: string) {
                headers[key] = value;
                return this;
            }
        };
    }

    private createResponse(status: number, data: any): APIResponse {
        const res = this.createResponseObject();
        res.status(status);
        res.json(data);
        return res;
    }
}

export function createAPIHandler(): APIRouteHandler {
    return new APIRouteHandler();
}
