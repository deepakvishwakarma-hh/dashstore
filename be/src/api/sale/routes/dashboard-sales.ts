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
            path: '/dashboard/sales/store/:storeName',
            handler: 'api::sale.sale.storeDashboard',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};

