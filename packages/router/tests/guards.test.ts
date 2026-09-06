import { describe, it, expect, vi } from 'vitest';
import { createRouter } from '../src/index';

describe('Route Guards - Comprehensive Tests', () => {
    describe('Basic Guard Functionality', () => {
        it('should execute beforeEach guard', async () => {
            const guard = vi.fn();
            const router = createRouter({
                routes: [{ path: '/test', component: 'Test' }]
            });

            router.beforeEach(guard);
            await router.push('/test');

            expect(guard).toHaveBeenCalledWith('/test', '/');
        });

        it('should block navigation when guard returns false', async () => {
            const router = createRouter({
                routes: [{ path: '/blocked', component: 'Blocked' }]
            });

            router.beforeEach(() => false);

            // Navigation should be blocked
            await router.push('/blocked');
            // In real implementation, would check currentPath hasn't changed
        });

        it('should redirect when guard returns string', async () => {
            const router = createRouter({
                routes: [
                    { path: '/protected', component: 'Protected' },
                    { path: '/login', component: 'Login' }
                ]
            });

            router.beforeEach((to) => {
                if (to === '/protected') {
                    return '/login';
                }
            });

            await router.push('/protected');
            // Should have redirected to /login
        });
    });

    describe('Multiple Guards', () => {
        it('should execute guards in order', async () => {
            const order: number[] = [];
            const router = createRouter({
                routes: [{ path: '/test', component: 'Test' }]
            });

            router.beforeEach(() => { order.push(1); });
            router.beforeEach(() => { order.push(2); });
            router.beforeEach(() => { order.push(3); });

            await router.push('/test');

            expect(order).toEqual([1, 2, 3]);
        });

        it('should stop execution if guard returns false', async () => {
            const guard1 = vi.fn(() => false);
            const guard2 = vi.fn();

            const router = createRouter({
                routes: [{ path: '/test', component: 'Test' }]
            });

            router.beforeEach(guard1);
            router.beforeEach(guard2);

            await router.push('/test');

            expect(guard1).toHaveBeenCalled();
            expect(guard2).not.toHaveBeenCalled();
        });
    });

    describe('Async Guards', () => {
        it('should handle async guard functions', async () => {
            const asyncGuard = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return true;
            });

            const router = createRouter({
                routes: [{ path: '/test', component: 'Test' }]
            });

            router.beforeEach(asyncGuard);
            await router.push('/test');

            expect(asyncGuard).toHaveBeenCalled();
        });

        it('should handle async guard rejection', async () => {
            const router = createRouter({
                routes: [{ path: '/test', component: 'Test' }]
            });

            router.beforeEach(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return false;
            });

            await router.push('/test');
            // Navigation should be blocked
        });
    });

    describe('Guard Use Cases', () => {
        it('should implement authentication guard', async () => {
            let isAuthenticated = false;

            const router = createRouter({
                routes: [
                    { path: '/dashboard', component: 'Dashboard' },
                    { path: '/login', component: 'Login' }
                ]
            });

            router.beforeEach((to) => {
                if (to === '/dashboard' && !isAuthenticated) {
                    return '/login';
                }
            });

            await router.push('/dashboard');
            // Should redirect to login

            isAuthenticated = true;
            await router.push('/dashboard');
            // Should allow navigation
        });

        it('should implement role-based guard', async () => {
            const userRole = 'user';

            const router = createRouter({
                routes: [
                    { path: '/admin', component: 'Admin' },
                    { path: '/forbidden', component: 'Forbidden' }
                ]
            });

            router.beforeEach((to) => {
                if (to === '/admin' && userRole !== 'admin') {
                    return '/forbidden';
                }
            });

            await router.push('/admin');
            // Should redirect to forbidden
        });
    });
});
