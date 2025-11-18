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
            const storeName = ctx.params.storeName || ctx.request.query.storeName;
            if (!storeName) {
                ctx.throw(400, 'Store name is required');
            }
            const decodedStoreName = decodeURIComponent(storeName);
            const data = await strapi.service('api::sale.sale').getStoreDashboardOverview(decodedStoreName, ctx.request.query);
            ctx.body = data;
        } catch (error: any) {
            strapi.log.error('Store dashboard error', error);
            const message = error?.message || 'Failed to fetch store dashboard data';
            ctx.throw(error?.status || 400, message);
        }
    },
}));
