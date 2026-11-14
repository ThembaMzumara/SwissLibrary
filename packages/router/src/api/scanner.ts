
import { APIRoute, HTTPMethod } from './handler';

export interface APIRouteFile {
    GET?: Function;
    POST?: Function;
    PUT?: Function;
    DELETE?: Function;
    PATCH?: Function;
    middleware?: Function[];
}

export class APIRouteScanner {
    async scanAPIRoutes(apiDir: string): Promise<APIRoute[]> {
        // TODO: Implement file system scanning
        // For now, return empty array as placeholder
        // In real implementation, would:
        // 1. Scan apiDir for .ts/.js files
        // 2. Import each file
        // 3. Extract exported HTTP method handlers
        // 4. Convert file path to route pattern (e.g., /api/users/[id].ts -> /api/users/:id)

        console.log(`[API Scanner] Would scan directory: ${apiDir}`);
        return [];
    }

    filePathToAPIRoute(filePath: string): string {
        // Convert file path to API route pattern
        // /api/users/[id].ts -> /api/users/:id
        return filePath
            .replace(/\.(ts|js)$/, '')
            .replace(/\[([^\]]+)\]/g, ':$1')
            .replace(/\/index$/, '');
    }
}

export function createAPIScanner(): APIRouteScanner {
    return new APIRouteScanner();
}
