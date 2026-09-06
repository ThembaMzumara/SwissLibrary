import { describe, it, expect, vi } from 'vitest';
import { createRouter } from '../src/index';

describe('Data Loaders - Comprehensive Tests', () => {
    describe('Basic Loader Execution', () => {
        it('should execute loader for matched route', async () => {
            const loader = vi.fn(async () => ({ data: 'test' }));

            const router = createRouter({
                routes: [
                    { path: '/test', component: 'Test', loader }
                ]
            });

            const data = await router.loadRouteData('/test');

            expect(loader).toHaveBeenCalled();
            expect(data['/test']).toEqual({ data: 'test' });
        });

        it('should pass params to loader', async () => {
            const loader = vi.fn(async ({ params }) => ({ userId: params.id }));

            const router = createRouter({
                routes: [
                    { path: '/user/:id', component: 'User', loader }
                ]
            });

            await router.loadRouteData('/user/123');

            expect(loader).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: { id: '123' }
                })
            );
        });
    });

    describe('Nested Route Loaders', () => {
        it('should execute all loaders in route branch', async () => {
            const parentLoader = vi.fn(async () => ({ parent: true }));
            const childLoader = vi.fn(async () => ({ child: true }));

            const router = createRouter({
                routes: [
                    {
                        path: '/parent',
                        component: 'Parent',
                        loader: parentLoader,
                        children: [
                            { path: 'child', component: 'Child', loader: childLoader }
                        ]
                    }
                ]
            });

            const data = await router.loadRouteData('/parent/child');

            expect(parentLoader).toHaveBeenCalled();
            expect(childLoader).toHaveBeenCalled();
            expect(data['/parent']).toEqual({ parent: true });
            expect(data['/parent/child']).toEqual({ child: true });
        });

        it('should execute loaders in parallel', async () => {
            const delays: number[] = [];

            const slowLoader = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                delays.push(Date.now());
                return { slow: true };
            });

            const fastLoader = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                delays.push(Date.now());
                return { fast: true };
            });

            const router = createRouter({
                routes: [
                    {
                        path: '/parent',
                        component: 'Parent',
                        loader: slowLoader,
                        children: [
                            { path: 'child', component: 'Child', loader: fastLoader }
                        ]
                    }
                ]
            });

            await router.loadRouteData('/parent/child');

            // Fast loader should complete before slow loader
            expect(delays[0]).toBeLessThan(delays[1]);
        });
    });

    describe('Error Handling', () => {
        it('should handle loader errors gracefully', async () => {
            const errorLoader = vi.fn(async () => {
                throw new Error('Loader failed');
            });

            const router = createRouter({
                routes: [
                    { path: '/error', component: 'Error', loader: errorLoader }
                ]
            });

            const data = await router.loadRouteData('/error');

            expect(data['/error']).toHaveProperty('error');
        });

        it('should continue loading other loaders if one fails', async () => {
            const failingLoader = vi.fn(async () => {
                throw new Error('Failed');
            });
            const successLoader = vi.fn(async () => ({ success: true }));

            const router = createRouter({
                routes: [
                    {
                        path: '/parent',
                        component: 'Parent',
                        loader: failingLoader,
                        children: [
                            { path: 'child', component: 'Child', loader: successLoader }
                        ]
                    }
                ]
            });

            const data = await router.loadRouteData('/parent/child');

            expect(data['/parent']).toHaveProperty('error');
            expect(data['/parent/child']).toEqual({ success: true });
        });
    });

    describe('No Loader Cases', () => {
        it('should return empty object for routes without loaders', async () => {
            const router = createRouter({
                routes: [
                    { path: '/no-loader', component: 'NoLoader' }
                ]
            });

            const data = await router.loadRouteData('/no-loader');
            expect(data).toEqual({});
        });

        it('should return empty object for non-existent routes', async () => {
            const router = createRouter({
                routes: [{ path: '/exists', component: 'Exists' }]
            });

            const data = await router.loadRouteData('/does-not-exist');
            expect(data).toEqual({});
        });
    });
});
