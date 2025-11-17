/**
 * stack controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::stack.stack', ({ strapi }) => ({
    processSheet: async (ctx) => {
        try {
            const { fileName, fromDate, toDate, headers, rawData, processedData } =
                ctx.request.body;

            console.log('=== Receiving JSON Data from Frontend ===');
            console.log('File Name:', fileName);
            console.log('From Date:', fromDate);
            console.log('To Date:', toDate);
            console.log('Total Processed Rows:', processedData?.length || 0);

            if (!processedData || !Array.isArray(processedData) || processedData.length === 0) {
                return ctx.badRequest({
                    error: 'Validation failed',
                    message: 'Processed data is required and must not be empty',
                });
            }

            if (!fromDate || !toDate) {
                return ctx.badRequest({
                    error: 'Validation failed',
                    message: 'From date and To date are required',
                });
            }

            // Extract unique values for validation
            const uniqueStores = [...new Set(processedData.map((row) => row.store?.trim()).filter(Boolean))];
            const uniqueCategories = [...new Set(processedData.map((row) => row.category?.trim()).filter(Boolean))];
            const uniqueProducts = [...new Set(processedData.map((row) => row.product?.trim()).filter(Boolean))];

            console.log('=== Validation ===');
            console.log('Unique Stores:', uniqueStores);
            console.log('Unique Categories:', uniqueCategories);
            console.log('Unique Products:', uniqueProducts);

            // Validate Stores
            const existingStores = await strapi.entityService.findMany('api::store.store', {
                filters: {
                    name: {
                        $in: uniqueStores,
                    },
                },
                fields: ['id', 'name'],
            });

            const existingStoreNames = existingStores.map((store) => store.name);
            const missingStores = uniqueStores.filter((store) => !existingStoreNames.includes(store));

            if (missingStores.length > 0) {
                console.log('❌ Missing Stores:', missingStores);
                return ctx.badRequest({
                    error: 'Validation failed',
                    message: 'The following stores are not found in the database. Please create them first.',
                    missingStores,
                });
            }

            // Validate Categories
            const existingCategories = await strapi.entityService.findMany('api::category.category', {
                filters: {
                    name: {
                        $in: uniqueCategories,
                    },
                },
                fields: ['id', 'name'],
            });

            const existingCategoryNames = existingCategories.map((cat) => cat.name);
            const missingCategories = uniqueCategories.filter((cat) => !existingCategoryNames.includes(cat));

            if (missingCategories.length > 0) {
                console.log('❌ Missing Categories:', missingCategories);
                return ctx.badRequest({
                    error: 'Validation failed',
                    message: 'The following categories are not found in the database. Please create them first.',
                    missingCategories,
                });
            }

            // Validate Products
            const existingProducts = await strapi.entityService.findMany('api::product.product', {
                filters: {
                    name: {
                        $in: uniqueProducts,
                    },
                },
                fields: ['id', 'name'],
            });

            const existingProductNames = existingProducts.map((prod) => prod.name);
            const missingProducts = uniqueProducts.filter((prod) => !existingProductNames.includes(prod));

            if (missingProducts.length > 0) {
                console.log('❌ Missing Products:', missingProducts);
                return ctx.badRequest({
                    error: 'Validation failed',
                    message: 'The following products are not found in the database. Please create them first.',
                    missingProducts,
                });
            }

            console.log('✅ All validations passed');


            // Create a map for quick lookup
            const storeMap = new Map(existingStores.map((store) => [store.name, store.id]));
            const categoryMap = new Map(existingCategories.map((cat) => [cat.name, cat.id]));
            const productMap = new Map(existingProducts.map((prod) => [prod.name, prod.id]));

            // Create Stack entry
            const stackEntry = await strapi.entityService.create('api::stack.stack', {
                data: {
                    label: `${fromDate}_to_${toDate}`,
                    data: {
                        fileName: fileName || 'unknown',
                        fromDate,
                        toDate,
                        headers: headers || [],
                        rawData: rawData || [],
                        processedData: processedData,
                        totalRows: processedData.length,
                        processedAt: new Date().toISOString(),
                    },
                },
            });

            console.log('=== Stack Entry Created ===');
            console.log('Stack ID:', stackEntry.id);
            console.log('Stack Label:', stackEntry.label);

            // Convert dd-mm-yyyy to YYYY-MM-DD for date field
            const convertToYYYYMMDD = (dateString: string) => {
                if (!dateString) return null;
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    return `${year}-${month}-${day}`;
                }
                return null;
            };

            // Create Sales entries
            console.log('=== Creating Sales Entries ===');
            const salesEntries = [];
            const salesErrors: Array<{ row: any; error: string; rowNumber: number }> = [];
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < processedData.length; i++) {
                const row = processedData[i];
                const rowNumber = i + 2; // +2 because row 1 is header, and array is 0-indexed

                try {
                    const storeId = storeMap.get(row.store?.trim());
                    const categoryId = categoryMap.get(row.category?.trim());
                    const productId = productMap.get(row.product?.trim());
                    const quantity = parseInt(row.quantity) || 0;
                    const dateStr = convertToYYYYMMDD(row.date?.trim());

                    // Collect missing data errors
                    const missingFields: string[] = [];
                    if (!storeId) missingFields.push(`Store: "${row.store}"`);
                    if (!categoryId) missingFields.push(`Category: "${row.category}"`);
                    if (!productId) missingFields.push(`Product: "${row.product}"`);
                    if (!dateStr) missingFields.push(`Date: "${row.date}"`);

                    if (missingFields.length > 0) {
                        const errorMsg = `Missing or invalid data: ${missingFields.join(', ')}`;
                        console.warn(`⚠️ Row ${rowNumber}: ${errorMsg}`, row);
                        salesErrors.push({
                            row,
                            error: errorMsg,
                            rowNumber,
                        });
                        errorCount++;
                        continue;
                    }

                    if (quantity <= 0) {
                        const errorMsg = `Invalid quantity: ${row.quantity}`;
                        console.warn(`⚠️ Row ${rowNumber}: ${errorMsg}`, row);
                        salesErrors.push({
                            row,
                            error: errorMsg,
                            rowNumber,
                        });
                        errorCount++;
                        continue;
                    }

                    const saleEntry = await strapi.entityService.create('api::sale.sale', {
                        data: {
                            store: storeId,
                            category: categoryId,
                            product: productId,
                            qty: quantity,
                            date: dateStr,
                        },
                    });

                    salesEntries.push(saleEntry.id);
                    successCount++;
                } catch (error: any) {
                    const errorMsg = error?.message || 'Unknown error creating sale entry';
                    console.error(`❌ Row ${rowNumber}: Error creating sale entry:`, errorMsg, row);
                    salesErrors.push({
                        row,
                        error: errorMsg,
                        rowNumber,
                    });
                    errorCount++;
                }
            }

            console.log('=== Sales Entries Created ===');
            console.log('Success:', successCount);
            console.log('Errors:', errorCount);
            console.log('Total Sales IDs:', salesEntries.length);

            // Prepare response with all information
            const response: any = {
                success: successCount > 0,
                message:
                    successCount > 0
                        ? `Processed ${successCount} sales entries successfully${errorCount > 0 ? ` with ${errorCount} errors` : ''}`
                        : 'Failed to create any sales entries',
                data: {
                    stackId: stackEntry.id,
                    stackLabel: stackEntry.label,
                    totalRows: processedData.length,
                    salesCreated: successCount,
                    salesErrors: errorCount,
                    salesIds: salesEntries.slice(0, 100), // Return first 100 IDs for preview
                },
            };

            // Include errors in response if any
            if (salesErrors.length > 0) {
                response.errors = salesErrors;
                response.data.errorDetails = salesErrors.map((err) => ({
                    rowNumber: err.rowNumber,
                    error: err.error,
                    rowData: err.row,
                }));
            }

            // If no sales were created, return error status
            if (successCount === 0) {
                return ctx.badRequest(response);
            }

            return ctx.send(response);
        } catch (error: any) {
            console.error('Error processing sheet data:', error);
            return ctx.internalServerError('Failed to process sheet data', {
                error: error?.message || 'Unknown error',
                details: error,
            });
        }
    },
}));
