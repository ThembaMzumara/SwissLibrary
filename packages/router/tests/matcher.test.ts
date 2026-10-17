import { describe, it, expect, beforeEach } from 'vitest';
import { matchRoute } from '../src/core/matcher';

describe('Route Matcher - Comprehensive Tests', () => {
    describe('Static Routes', () => {
        it('should match exact static paths', () => {
            const routes = [
                { path: '/', component: 'Home' },
                { path: '/about', component: 'About' },
                { path: '/contact', component: 'Contact' }
            ];

            const match = matchRoute(routes, '/about');
            expect(match).toBeDefined();
            expect(match).toHaveLength(1);
            expect(match![0].route.component).toBe('About');
        });

        it('should return undefined for non-matching paths', () => {
            const routes = [{ path: '/home', component: 'Home' }];
            const match = matchRoute(routes, '/nonexistent');
            expect(match).toBeUndefined();
        });

        it('should handle root path correctly', () => {
            const routes = [{ path: '/', component: 'Root' }];
            const match = matchRoute(routes, '/');
            expect(match).toBeDefined();
            expect(match![0].route.component).toBe('Root');
        });
    });

    describe('Dynamic Routes', () => {
        it('should match single parameter routes', () => {
            const routes = [{ path: '/user/:id', component: 'User' }];
            const match = matchRoute(routes, '/user/123');

            expect(match).toBeDefined();
            expect(match![0].params.id).toBe('123');
        });

        it('should match multiple parameters', () => {
            const routes = [{ path: '/blog/:category/:slug', component: 'Post' }];
            const match = matchRoute(routes, '/blog/tech/react-hooks');

            expect(match).toBeDefined();
            expect(match![0].params.category).toBe('tech');
            expect(match![0].params.slug).toBe('react-hooks');
        });

        it('should handle numeric parameters', () => {
            const routes = [{ path: '/product/:id', component: 'Product' }];
            const match = matchRoute(routes, '/product/42');

            expect(match![0].params.id).toBe('42');
        });
    });

    describe('Nested Routes', () => {
        it('should match nested route structures', () => {
            const routes = [
                {
                    path: '/dashboard',
                    component: 'Dashboard',
                    children: [
                        { path: 'settings', component: 'Settings' },
                        { path: 'profile', component: 'Profile' }
                    ]
                }
            ];

            const match = matchRoute(routes, '/dashboard/settings');
            expect(match).toBeDefined();
            expect(match).toHaveLength(2);
            expect(match![0].route.component).toBe('Dashboard');
            expect(match![1].route.component).toBe('Settings');
        });

        it('should match deeply nested routes', () => {
            const routes = [
                {
                    path: '/app',
                    component: 'App',
                    children: [
                        {
                            path: 'admin',
                            component: 'Admin',
                            children: [
                                { path: 'users', component: 'Users' }
                            ]
                        }
                    ]
                }
            ];

            const match = matchRoute(routes, '/app/admin/users');
            expect(match).toHaveLength(3);
            expect(match![2].route.component).toBe('Users');
        });

        it('should match nested routes with parameters', () => {
            const routes = [
                {
                    path: '/org/:orgId',
                    component: 'Org',
                    children: [
                        { path: 'team/:teamId', component: 'Team' }
                    ]
                }
            ];

            const match = matchRoute(routes, '/org/acme/team/eng');
            expect(match).toBeDefined();
            expect(match![0].params.orgId).toBe('acme');
            expect(match![1].params.teamId).toBe('eng');
        });
    });

    describe('Edge Cases', () => {
        it('should handle trailing slashes', () => {
            const routes = [{ path: '/about', component: 'About' }];
            const match = matchRoute(routes, '/about');
            expect(match).toBeDefined();
        });

        it('should handle empty parameter values', () => {
            const routes = [{ path: '/search/:query', component: 'Search' }];
            const match = matchRoute(routes, '/search/');
            // Should not match - empty param
            expect(match).toBeUndefined();
        });

        it('should prioritize exact matches over dynamic', () => {
            const routes = [
                { path: '/user/new', component: 'NewUser' },
                { path: '/user/:id', component: 'User' }
            ];

            const match = matchRoute(routes, '/user/new');
            expect(match![0].route.component).toBe('NewUser');
        });
    });
});
