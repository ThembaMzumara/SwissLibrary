
import { describe, it, expect } from 'vitest';
import { createAPIHandler, APIRequest } from '../src/api/handler';

describe('API Routes', () => {
    it('should handle GET requests', async () => {
        const handler = createAPIHandler();

        handler.register({
            path: '/api/users',
            method: 'GET',
            handler: async (req, res) => {
                res.json({ users: [] });
            }
        });

        const req: APIRequest = {
            method: 'GET',
            url: '/api/users',
            params: {},
            query: {},
            headers: {}
        };

        const res = await handler.handle(req);
        expect(res).toBeDefined();
    });

    it('should handle dynamic routes', async () => {
        const handler = createAPIHandler();

        handler.register({
            path: '/api/users/:id',
            method: 'GET',
            handler: async (req, res) => {
                res.json({ id: req.params.id });
            }
        });

        const req: APIRequest = {
            method: 'GET',
            url: '/api/users/123',
            params: { id: '123' },
            query: {},
            headers: {}
        };

        const res = await handler.handle(req);
        expect(res).toBeDefined();
    });

    it('should execute middleware', async () => {
        const handler = createAPIHandler();
        let middlewareExecuted = false;

        handler.register({
            path: '/api/protected',
            method: 'GET',
            middleware: [
                async (req, res, next) => {
                    middlewareExecuted = true;
                    next();
                }
            ],
            handler: async (req, res) => {
                res.json({ protected: true });
            }
        });

        const req: APIRequest = {
            method: 'GET',
            url: '/api/protected',
            params: {},
            query: {},
            headers: {}
        };

        await handler.handle(req);
        expect(middlewareExecuted).toBe(true);
    });
});
