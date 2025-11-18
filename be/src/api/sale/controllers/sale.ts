/**
 * sale controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::sale.sale', ({ strapi }) => ({
    async dashboardOverview(ctx) {
        try {
            const data = await strapi.service('api::sale.sale').getDashboardOverview(ctx.request.query);
            ctx.body = data;
        } catch (error: any) {
            strapi.log.error('Dashboard overview error', error);
            const message = error?.message || 'Failed to fetch dashboard data';
            ctx.throw(error?.status || 400, message);
        }
    },

    async storeDashboard(ctx) {
        try {
            const storeSlug = ctx.params.storeSlug || ctx.request.query.storeSlug;
            if (!storeSlug) {
                ctx.throw(400, 'Store slug is required');
            }
            const decodedStoreSlug = decodeURIComponent(storeSlug);
            const data = await strapi.service('api::sale.sale').getStoreDashboardOverview(decodedStoreSlug, ctx.request.query);
            ctx.body = data;
        } catch (error: any) {
            strapi.log.error('Store dashboard error', error);
            const message = error?.message || 'Failed to fetch store dashboard data';
            ctx.throw(error?.status || 400, message);
        }
    },
}));
