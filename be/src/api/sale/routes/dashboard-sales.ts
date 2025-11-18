/**
 * Custom dashboard routes for sales analytics
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/dashboard/sales/overview',
            handler: 'api::sale.sale.dashboardOverview',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/dashboard/sales/store/:storeSlug',
            handler: 'api::sale.sale.storeDashboard',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/dashboard/sales/store-comparison',
            handler: 'api::sale.sale.storeComparison',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};

