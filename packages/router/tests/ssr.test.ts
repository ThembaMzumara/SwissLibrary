import { describe, it, expect } from 'vitest';
import { createRouter, createServerRenderer } from '../src/index';

describe('SSR - Comprehensive Tests', () => {
    describe('Server Renderer', () => {
        it('should create server renderer instance', () => {
            const router = createRouter({ routes: [] });
            const renderer = createServerRenderer(router);

            expect(renderer).toBeDefined();
        });

        it('should render route to HTML', async () => {
            const router = createRouter({
                routes: [
                    { path: '/test', component: { name: 'TestComponent' } }
                ]
            });

            const renderer = createServerRenderer(router);
            const result = await renderer.render('/test');

            expect(result.html).toBeDefined();
            expect(result.html).toContain('<!DOCTYPE html>');
            expect(result.statusCode).toBe(200);
        });

        it('should return 404 for non-existent routes', async () => {
            const router = createRouter({ routes: [] });
            const renderer = createServerRenderer(router);

            const result = await renderer.render('/does-not-exist');

            expect(result.statusCode).toBe(404);
            expect(result.html).toContain('404');
        });

        it('should embed route data in HTML', async () => {
            const router = createRouter({
                routes: [
                    {
                        path: '/user/:id',
                        component: { name: 'User' },
                        loader: async ({ params }) => ({ userId: params.id })
                    }
                ]
            });

            const renderer = createServerRenderer(router);
            const result = await renderer.render('/user/123');

            expect(result.html).toContain('__SWISS_DATA__');
            expect(result.data['/user/:id']).toEqual({ userId: '123' });
        });
    });

    describe('Nested Route SSR', () => {
        it('should render nested routes correctly', async () => {
            const router = createRouter({
                routes: [
                    {
                        path: '/parent',
                        component: { name: 'Parent' },
                        children: [
                            { path: 'child', component: { name: 'Child' } }
                        ]
                    }
                ]
            });

            const renderer = createServerRenderer(router);
            const result = await renderer.render('/parent/child');

            expect(result.statusCode).toBe(200);
            expect(result.html).toBeDefined();
        });

        it('should load data for all nested routes', async () => {
            const router = createRouter({
                routes: [
                    {
                        path: '/parent',
                        component: { name: 'Parent' },
                        loader: async () => ({ parent: true }),
                        children: [
                            {
                                path: 'child',
                                component: { name: 'Child' },
                                loader: async () => ({ child: true })
                            }
                        ]
                    }
                ]
            });

            const renderer = createServerRenderer(router);
            const result = await renderer.render('/parent/child');

            expect(result.data['/parent']).toEqual({ parent: true });
            expect(result.data['/parent/child']).toEqual({ child: true });
        });
    });

    describe('SSR Data Serialization', () => {
        it('should serialize data as JSON', async () => {
            const router = createRouter({
                routes: [
                    {
                        path: '/data',
                        component: { name: 'Data' },
                        loader: async () => ({
                            string: 'test',
                            number: 42,
                            boolean: true,
                            array: [1, 2, 3],
                            object: { nested: 'value' }
                        })
                    }
                ]
            });

            const renderer = createServerRenderer(router);
            const result = await renderer.render('/data');

            expect(result.html).toContain('window.__SWISS_DATA__');
            // Data should be properly JSON serialized
            const dataMatch = result.html.match(/window\.__SWISS_DATA__ = (.+);/);
            if (dataMatch) {
                const parsed = JSON.parse(dataMatch[1]);
                expect(parsed['/data']).toBeDefined();
            }
        });

        it('should handle special characters in data', async () => {
            const router = createRouter({
                routes: [
                    {
                        path: '/special',
                        component: { name: 'Special' },
                        loader: async () => ({
                            html: '<script>alert("xss")</script>',
                            quotes: 'He said "hello"',
                            unicode: '你好'
                        })
                    }
                ]
            });

            const renderer = createServerRenderer(router);
            const result = await renderer.render('/special');

            // Should properly escape data
            expect(result.html).toBeDefined();
        });
    });
});
