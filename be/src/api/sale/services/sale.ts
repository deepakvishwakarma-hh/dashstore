/**
 * sale service
 */

import { factories } from '@strapi/strapi';

const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
] as const;

const WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

const FILTER_TYPES = new Set([
    'yearly',
    'monthly',
    'weekly',
    'daily',
    'tomorrow',
    'custom',
    'all',
]);

type DashboardRange = {
    startDate: string | null;
    endDate: string | null;
};

type Metadata = {
    availableYears: number[];
    availableMonthsByYear: Record<string, number[]>;
};

type NormalizedParams = {
    filterType: string;
    year?: number;
    month?: number;
    range: DashboardRange;
    storeIds: number[];
    defaults: {
        year: number | null;
        month: number | null;
    };
};

type SalesRow = {
    id: number;
    date: string;
    qty: number;
};

type DetailedSalesRow = SalesRow & {
    store_id: number | null;
    store_name: string | null;
    store_slug: string | null;
    category_id: number | null;
    category_name: string | null;
    product_id: number | null;
    product_name: string | null;
};

type StoreTotalsRow = {
    id: number | null;
    name: string | null;
    slug: string | null;
    totalSales: number;
};

type StorePerformance = {
    storeId: number | null;
    storename: string;
    storeSlug: string | null;
    totalSales: number;
    categories: Map<string, number>;
    products: Map<string, number>;
    monthly: Map<string, number>;
};

const formatFromParts = (year: number, monthIndex: number, day: number): string => {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
};

const getDaysInMonth = (year: number, monthIndex: number): number =>
    new Date(year, monthIndex + 1, 0).getDate();

const sanitizeDateInput = (value?: string | null): string | null => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return null;
    }

    return trimmed;
};

const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toIntegerOrUndefined = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseStoreIds = (input?: string | string[]): number[] => {
    if (!input) {
        return [];
    }

    const rawList = Array.isArray(input)
        ? input
        : input
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);

    const ids = rawList
        .map((entry) => Number(entry))
        .filter((num) => Number.isInteger(num));

    return Array.from(new Set(ids));
};

const parseDateParts = (dateStr?: string | null): { year: number; month: number; day: number } | null => {
    if (!dateStr) {
        return null;
    }

    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const day = Number(dayStr);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return null;
    }

    return { year, month, day };
};

const buildMetadata = (rows: SalesRow[]): Metadata => {
    const years = new Set<number>();
    const monthsByYear = new Map<number, Set<number>>();

    rows.forEach((row) => {
        const parts = parseDateParts(row.date);
        if (!parts) {
            return;
        }

        years.add(parts.year);
        if (!monthsByYear.has(parts.year)) {
            monthsByYear.set(parts.year, new Set());
        }
        monthsByYear.get(parts.year)?.add(parts.month);
    });

    const availableYears = Array.from(years).sort((a, b) => b - a);
    const availableMonthsByYear: Record<string, number[]> = {};

    monthsByYear.forEach((monthSet, year) => {
        availableMonthsByYear[year.toString()] = Array.from(monthSet).sort((a, b) => a - b);
    });

    return { availableYears, availableMonthsByYear };
};

const getMonthsForYear = (map: Record<string, number[]>, year?: number | null): number[] => {
    if (typeof year !== 'number') {
        return [];
    }
    return map[year.toString()]?.slice() ?? [];
};

const parseFilterType = (value?: string): string => {
    if (!value) {
        return 'yearly';
    }

    const normalized = value.toLowerCase();
    return FILTER_TYPES.has(normalized) ? normalized : 'yearly';
};

const buildDateRange = (
    filterType: string,
    options: { year?: number; month?: number; fromDate?: string | null; toDate?: string | null },
): DashboardRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === 'yearly') {
        if (typeof options.year !== 'number') {
            return { startDate: null, endDate: null };
        }
        return {
            startDate: formatFromParts(options.year, 0, 1),
            endDate: formatFromParts(options.year, 11, 31),
        };
    }

    if (filterType === 'monthly') {
        if (typeof options.year !== 'number' || typeof options.month !== 'number') {
            return { startDate: null, endDate: null };
        }
        const daysInMonth = getDaysInMonth(options.year, options.month);
        return {
            startDate: formatFromParts(options.year, options.month, 1),
            endDate: formatFromParts(options.year, options.month, daysInMonth),
        };
    }

    if (filterType === 'weekly') {
        const start = new Date(today);
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return {
            startDate: formatFromParts(start.getFullYear(), start.getMonth(), start.getDate()),
            endDate: formatFromParts(end.getFullYear(), end.getMonth(), end.getDate()),
        };
    }

    if (filterType === 'daily') {
        return {
            startDate: formatFromParts(today.getFullYear(), today.getMonth(), today.getDate()),
            endDate: formatFromParts(today.getFullYear(), today.getMonth(), today.getDate()),
        };
    }

    if (filterType === 'tomorrow') {
        const nextDay = new Date(today);
        nextDay.setDate(nextDay.getDate() + 1);
        return {
            startDate: formatFromParts(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate()),
            endDate: formatFromParts(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate()),
        };
    }

    if (filterType === 'custom') {
        const startDate = sanitizeDateInput(options.fromDate);
        const endDate = sanitizeDateInput(options.toDate);

        if (!startDate || !endDate) {
            throw new Error('Both fromDate and toDate are required in YYYY-MM-DD format for custom filters.');
        }

        if (startDate > endDate) {
            throw new Error('fromDate cannot be after toDate.');
        }

        return { startDate, endDate };
    }

    return { startDate: null, endDate: null };
};

const normalizeParams = (rawParams: Record<string, any>, metadata: Metadata): NormalizedParams => {
    const filterType = parseFilterType(rawParams.filterType);

    const providedYear =
        toIntegerOrUndefined(rawParams.year) ?? toIntegerOrUndefined(rawParams.selectedYear);
    const providedMonth =
        toIntegerOrUndefined(rawParams.month) ?? toIntegerOrUndefined(rawParams.selectedMonth);

    const defaultYear = metadata.availableYears.length > 0 ? metadata.availableYears[0] : null;
    let year = providedYear;

    if ((filterType === 'yearly' || filterType === 'monthly') && typeof year !== 'number') {
        year = defaultYear ?? undefined;
    }

    let month = providedMonth;
    if (filterType === 'monthly') {
        const months =
            typeof year === 'number'
                ? metadata.availableMonthsByYear[year.toString()]?.slice() ?? []
                : [];
        if (typeof month !== 'number' && months.length > 0) {
            month = months[0];
        }
    } else {
        month = undefined;
    }

    const range = buildDateRange(filterType, {
        year,
        month,
        fromDate: rawParams.fromDate ?? rawParams.startDate ?? null,
        toDate: rawParams.toDate ?? rawParams.endDate ?? null,
    });

    const storeIds = parseStoreIds(rawParams.storeIds ?? rawParams.storeId ?? rawParams.stores);

    return {
        filterType,
        year,
        month,
        range,
        storeIds,
        defaults: {
            year: defaultYear,
            month:
                defaultYear !== null
                    ? metadata.availableMonthsByYear[defaultYear.toString()]?.[0] ?? null
                    : null,
        },
    };
};

const sumRowsInRange = (rows: SalesRow[], range: DashboardRange | null): number => {
    if (!range?.startDate || !range.endDate) {
        return 0;
    }

    return rows.reduce((total, row) => {
        if (row.date >= range.startDate && row.date <= range.endDate) {
            return total + toNumber(row.qty);
        }
        return total;
    }, 0);
};

const getWeekInMonth = (year: number, monthIndex: number, day: number): number => {
    const firstOfMonth = new Date(year, monthIndex, 1);
    const firstDayOfWeek = firstOfMonth.getDay();
    return Math.ceil((day + firstDayOfWeek) / 7);
};

const buildSalesStats = (
    filterType: string,
    year: number | undefined,
    month: number | undefined,
    filteredRows: DetailedSalesRow[],
    allRows: SalesRow[],
    availableYears: number[],
) => {
    if (filterType === 'yearly' && availableYears.length > 0) {
        const sortedYears = [...availableYears].sort((a, b) => a - b);
        const series = sortedYears.map((targetYear) => {
            const monthlyData = new Array(12).fill(0);
            allRows.forEach((row) => {
                const parts = parseDateParts(row.date);
                if (parts && parts.year === targetYear) {
                    monthlyData[parts.month] += toNumber(row.qty);
                }
            });
            return {
                name: targetYear.toString(),
                data: monthlyData,
            };
        });

        return {
            granularity: 'month',
            labels: MONTH_NAMES,
            isMultipleSeries: true,
            series,
        };
    }

    if (filterType === 'monthly' && typeof year === 'number') {
        const monthsSet = new Set<number>();
        allRows.forEach((row) => {
            const parts = parseDateParts(row.date);
            if (parts && parts.year === year) {
                monthsSet.add(parts.month);
            }
        });

        const months = Array.from(monthsSet).sort((a, b) => a - b);
        const series = months.map((targetMonth) => {
            const weekly = new Array(5).fill(0);
            allRows.forEach((row) => {
                const parts = parseDateParts(row.date);
                if (parts && parts.year === year && parts.month === targetMonth) {
                    const week = getWeekInMonth(parts.year, parts.month, parts.day);
                    if (week >= 1 && week <= 5) {
                        weekly[week - 1] += toNumber(row.qty);
                    }
                }
            });
            return {
                name: MONTH_NAMES[targetMonth],
                data: weekly,
            };
        });

        return {
            granularity: 'week',
            labels: WEEK_LABELS,
            isMultipleSeries: true,
            series,
        };
    }

    const dateTotals = new Map<string, number>();
    filteredRows.forEach((row) => {
        const qty = toNumber(row.qty);
        dateTotals.set(row.date, (dateTotals.get(row.date) ?? 0) + qty);
    });
    const sortedDates = Array.from(dateTotals.keys()).sort();

    return {
        granularity: 'day',
        labels: sortedDates,
        isMultipleSeries: false,
        series:
            sortedDates.length > 0
                ? [
                    {
                        name: 'Sales',
                        data: sortedDates.map((date) => dateTotals.get(date) ?? 0),
                    },
                ]
                : [],
    };
};

const buildRankings = (map: Map<string, number>, limit?: number) =>
    Array.from(map.entries())
        .filter(([label]) => Boolean(label))
        .sort((a, b) => b[1] - a[1])
        .slice(0, typeof limit === 'number' ? limit : undefined)
        .map(([label, sales]) => ({ label, sales }));

const buildChartData = (map: Map<string, number>) => {
    const sorted = buildRankings(map);
    return {
        labels: sorted.map((entry) => entry.label),
        values: sorted.map((entry) => entry.sales),
    };
};

const buildMonthlySeries = (map: Map<string, number>) => {
    const sorted = Array.from(map.entries()).sort(
        (a, b) =>
            MONTH_NAMES.indexOf(a[0] as (typeof MONTH_NAMES)[number]) -
            MONTH_NAMES.indexOf(b[0] as (typeof MONTH_NAMES)[number]),
    );

    return {
        months: sorted.map(([month]) => month),
        sales: sorted.map(([, sales]) => sales),
    };
};

const round = (value: number, decimals = 2): number => {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
};

const buildStorePerformance = (rows: DetailedSalesRow[]) => {
    const today = new Date();
    const todayStr = formatFromParts(today.getFullYear(), today.getMonth(), today.getDate());

    const categoryMap = new Map<string, number>();
    const productMap = new Map<string, number>();
    const monthMap = new Map<string, number>();
    const storeMap = new Map<string, StorePerformance>();
    let totalQuantity = 0;
    let todaySales = 0;

    rows.forEach((row) => {
        const qty = toNumber(row.qty);
        totalQuantity += qty;

        if (row.date === todayStr) {
            todaySales += qty;
        }

        if (row.category_name) {
            categoryMap.set(row.category_name, (categoryMap.get(row.category_name) ?? 0) + qty);
        }

        if (row.product_name) {
            productMap.set(row.product_name, (productMap.get(row.product_name) ?? 0) + qty);
        }

        const parts = parseDateParts(row.date);
        if (parts) {
            const monthLabel = MONTH_NAMES[parts.month];
            monthMap.set(monthLabel, (monthMap.get(monthLabel) ?? 0) + qty);
        }

        const storeKey =
            row.store_id !== null && row.store_id !== undefined
                ? `id:${row.store_id}`
                : `name:${row.store_name ?? 'Unknown Store'}`;

        if (!storeMap.has(storeKey)) {
            storeMap.set(storeKey, {
                storeId: row.store_id ?? null,
                storename: row.store_name ?? 'Unknown Store',
                storeSlug: row.store_slug ?? null,
                totalSales: 0,
                categories: new Map(),
                products: new Map(),
                monthly: new Map(),
            });
        }

        const store = storeMap.get(storeKey)!;
        store.totalSales += qty;

        if (row.category_name) {
            store.categories.set(row.category_name, (store.categories.get(row.category_name) ?? 0) + qty);
        }

        if (row.product_name) {
            store.products.set(row.product_name, (store.products.get(row.product_name) ?? 0) + qty);
        }

        const monthLabel = parts ? MONTH_NAMES[parts.month] : null;
        if (monthLabel) {
            store.monthly.set(monthLabel, (store.monthly.get(monthLabel) ?? 0) + qty);
        }
    });

    const storePerformance = Array.from(storeMap.values()).sort(
        (a, b) => b.totalSales - a.totalSales,
    );

    return {
        totalQuantity,
        todaySales,
        categoryMap,
        productMap,
        monthMap,
        storePerformance,
    };
};

const computePreviousRange = (
    filterType: string,
    year?: number,
    month?: number,
): DashboardRange | null => {
    if (filterType === 'yearly' && typeof year === 'number') {
        const previousYear = year - 1;
        return {
            startDate: formatFromParts(previousYear, 0, 1),
            endDate: formatFromParts(previousYear, 11, 31),
        };
    }

    if (filterType === 'monthly' && typeof year === 'number' && typeof month === 'number') {
        const reference = new Date(year, month, 1);
        reference.setMonth(reference.getMonth() - 1);
        const prevYear = reference.getFullYear();
        const prevMonth = reference.getMonth();
        const days = getDaysInMonth(prevYear, prevMonth);
        return {
            startDate: formatFromParts(prevYear, prevMonth, 1),
            endDate: formatFromParts(prevYear, prevMonth, days),
        };
    }

    return null;
};

export default factories.createCoreService('api::sale.sale', ({ strapi }) => ({
    async getDashboardOverview(rawParams: Record<string, any> = {}) {
        const knex = strapi.db.connection;
        const [allSalesRows, storesTotalsRows]: [SalesRow[], StoreTotalsRow[]] = await Promise.all([
            knex('sales as s').select('s.id', 's.date', 's.qty'),
            knex('sales as s')
                .leftJoin('sales_store_lnk as storeLink', 'storeLink.sale_id', 's.id')
                .leftJoin('stores as store', 'storeLink.store_id', 'store.id')
                .select('store.id as id', 'store.name as name', 'store.slug as slug')
                .sum({ totalSales: 's.qty' })
                .groupBy('store.id', 'store.name', 'store.slug'),
        ]);

        const metadata = buildMetadata(allSalesRows);
        const normalized = normalizeParams(rawParams, metadata);

        const storesMetadata = storesTotalsRows
            .filter((row): row is StoreTotalsRow & { id: number; name: string; slug: string | null } => row.id !== null && !!row.name)
            .map((row) => ({
                id: row.id,
                name: row.name,
                slug: row.slug,
                totalSales: toNumber(row.totalSales),
            }))
            .sort((a, b) => b.totalSales - a.totalSales);

        const detailedQuery = knex('sales as s')
            .leftJoin('sales_store_lnk as storeLink', 'storeLink.sale_id', 's.id')
            .leftJoin('stores as store', 'storeLink.store_id', 'store.id')
            .leftJoin('sales_category_lnk as categoryLink', 'categoryLink.sale_id', 's.id')
            .leftJoin('categories as category', 'categoryLink.category_id', 'category.id')
            .leftJoin('sales_product_lnk as productLink', 'productLink.sale_id', 's.id')
            .leftJoin('products as product', 'productLink.product_id', 'product.id')
            .select(
                's.id',
                's.date',
                's.qty',
                'storeLink.store_id as store_id',
                'store.name as store_name',
                'store.slug as store_slug',
                'categoryLink.category_id as category_id',
                'category.name as category_name',
                'productLink.product_id as product_id',
                'product.name as product_name',
            );

        if (normalized.range.startDate && normalized.range.endDate) {
            detailedQuery.whereBetween('s.date', [normalized.range.startDate, normalized.range.endDate]);
        }

        if (normalized.storeIds.length > 0) {
            detailedQuery.whereIn('storeLink.store_id', normalized.storeIds);
        }

        const filteredRows: DetailedSalesRow[] = await detailedQuery;

        const performance = buildStorePerformance(filteredRows);
        const salesStats = buildSalesStats(
            normalized.filterType,
            normalized.year,
            normalized.month,
            filteredRows,
            allSalesRows,
            metadata.availableYears,
        );

        const previousRange = computePreviousRange(
            normalized.filterType,
            normalized.year,
            normalized.month,
        );
        const previousPeriodSales = sumRowsInRange(allSalesRows, previousRange);

        const percentageChange =
            previousPeriodSales === 0
                ? 0
                : round(((performance.totalQuantity - previousPeriodSales) / previousPeriodSales) * 100);

        const currentTarget =
            performance.totalQuantity > 0
                ? Math.max(1000, Math.ceil((performance.totalQuantity * 1.8) / 1000) * 1000)
                : 0;

        const targetProgress =
            currentTarget === 0
                ? 0
                : Math.min((performance.totalQuantity / currentTarget) * 100, 100);

        const topCategories = buildRankings(performance.categoryMap, 3).map(({ label, sales }) => ({
            category: label,
            sales,
        }));
        const topProducts = buildRankings(performance.productMap, 3).map(({ label, sales }) => ({
            product: label,
            sales,
        }));
        const topCategoriesBySales = buildRankings(performance.categoryMap, 10).map(
            ({ label, sales }) => ({
                category: label,
                sales,
            }),
        );
        const topProductsBySales = buildRankings(performance.productMap, 10).map(
            ({ label, sales }) => ({
                product: label,
                sales,
            }),
        );

        const topStores = performance.storePerformance.slice(0, 10).map((store) => ({
            storeId: store.storeId,
            storename: store.storename,
            storeSlug: store.storeSlug,
            sales: store.totalSales,
        }));

        const storeRanking = performance.storePerformance.slice(0, 10).map((store) => ({
            storeId: store.storeId,
            storename: store.storename,
            storeSlug: store.storeSlug,
            totalSales: store.totalSales,
            topCategory: buildRankings(store.categories, 1)[0]?.label ?? 'N/A',
            topProduct: buildRankings(store.products, 1)[0]?.label ?? 'N/A',
        }));

        const storeBreakdown = performance.storePerformance.slice(0, 5).map((store) => ({
            storeId: store.storeId,
            storename: store.storename,
            totalSales: store.totalSales,
            topCategory: buildRankings(store.categories, 1)[0]?.label ?? 'N/A',
            topProduct: buildRankings(store.products, 1)[0]?.label ?? 'N/A',
            categorySales: buildRankings(store.categories).map(({ label, sales }) => ({
                category: label,
                sales,
            })),
            productSales: buildRankings(store.products).map(({ label, sales }) => ({
                product: label,
                sales,
            })),
            monthlySales: buildMonthlySeries(store.monthly),
        }));

        const response = {
            filter: {
                type: normalized.filterType,
                year: normalized.year ?? null,
                month: normalized.month ?? null,
                range: normalized.range,
                appliedStoreIds: normalized.storeIds,
            },
            metadata: {
                availableYears: metadata.availableYears,
                availableMonthsByYear: metadata.availableMonthsByYear,
                monthsForSelectedYear: getMonthsForYear(metadata.availableMonthsByYear, normalized.year),
                defaultSelections: {
                    year: normalized.defaults.year,
                    month: normalized.defaults.month,
                    stores: storesMetadata.slice(0, 3).map((store) => store.id),
                },
                stores: storesMetadata,
                totalRecords: allSalesRows.length,
            },
            totals: {
                totalQuantity: performance.totalQuantity,
                totalStores: performance.storePerformance.length,
                todaySales: performance.todaySales,
                previousPeriodSales,
                percentageChange,
                currentTarget,
                targetProgress: round(targetProgress),
                remainingTarget:
                    currentTarget === 0 ? 0 : Math.max(currentTarget - performance.totalQuantity, 0),
            },
            highlights: {
                topCategories,
                topProducts,
            },
            charts: {
                salesStats,
                categoryDistribution: buildChartData(performance.categoryMap),
                topProducts: topProductsBySales,
                topCategories: topCategoriesBySales,
                topStores,
                monthlySales: buildMonthlySeries(performance.monthMap),
            },
            stores: {
                ranking: storeRanking,
                breakdown: storeBreakdown,
            },
            counts: {
                totalRows: filteredRows.length,
            },
        };

        return response;
    },

    async getStoreDashboardOverview(storeSlug: string, rawParams: Record<string, any> = {}) {
        const knex = strapi.db.connection;

        // First, find the store by slug to get its ID
        const store = await knex('stores')
            .where('slug', storeSlug)
            .first();

        if (!store) {
            throw new Error(`Store with slug "${storeSlug}" not found`);
        }

        const storeId = store.id;

        // Get all sales for this store
        const allSalesRows: SalesRow[] = await knex('sales as s')
            .leftJoin('sales_store_lnk as storeLink', 'storeLink.sale_id', 's.id')
            .where('storeLink.store_id', storeId)
            .select('s.id', 's.date', 's.qty');

        const metadata = buildMetadata(allSalesRows);
        const normalized = normalizeParams(rawParams, metadata);

        // Force store filter to only this store
        normalized.storeIds = [storeId];

        const detailedQuery = knex('sales as s')
            .leftJoin('sales_store_lnk as storeLink', 'storeLink.sale_id', 's.id')
            .leftJoin('stores as store', 'storeLink.store_id', 'store.id')
            .leftJoin('sales_category_lnk as categoryLink', 'categoryLink.sale_id', 's.id')
            .leftJoin('categories as category', 'categoryLink.category_id', 'category.id')
            .leftJoin('sales_product_lnk as productLink', 'productLink.sale_id', 's.id')
            .leftJoin('products as product', 'productLink.product_id', 'product.id')
            .where('storeLink.store_id', storeId)
            .select(
                's.id',
                's.date',
                's.qty',
                'storeLink.store_id as store_id',
                'store.name as store_name',
                'categoryLink.category_id as category_id',
                'category.name as category_name',
                'productLink.product_id as product_id',
                'product.name as product_name',
            );

        if (normalized.range.startDate && normalized.range.endDate) {
            detailedQuery.whereBetween('s.date', [normalized.range.startDate, normalized.range.endDate]);
        }

        const filteredRows: DetailedSalesRow[] = await detailedQuery;

        const performance = buildStorePerformance(filteredRows);
        const salesStats = buildSalesStats(
            normalized.filterType,
            normalized.year,
            normalized.month,
            filteredRows,
            allSalesRows,
            metadata.availableYears,
        );

        const previousRange = computePreviousRange(
            normalized.filterType,
            normalized.year,
            normalized.month,
        );
        const previousPeriodSales = sumRowsInRange(allSalesRows, previousRange);

        const percentageChange =
            previousPeriodSales === 0
                ? 0
                : round(((performance.totalQuantity - previousPeriodSales) / previousPeriodSales) * 100);

        const currentTarget =
            performance.totalQuantity > 0
                ? Math.max(1000, Math.ceil((performance.totalQuantity * 1.8) / 1000) * 1000)
                : 0;

        const targetProgress =
            currentTarget === 0
                ? 0
                : Math.min((performance.totalQuantity / currentTarget) * 100, 100);

        const topCategories = buildRankings(performance.categoryMap, 3).map(({ label, sales }) => ({
            category: label,
            sales,
        }));
        const topProducts = buildRankings(performance.productMap, 3).map(({ label, sales }) => ({
            product: label,
            sales,
        }));
        const topCategoriesBySales = buildRankings(performance.categoryMap, 10).map(
            ({ label, sales }) => ({
                category: label,
                sales,
            }),
        );
        const topProductsBySales = buildRankings(performance.productMap, 10).map(
            ({ label, sales }) => ({
                product: label,
                sales,
            }),
        );

        const response = {
            store: {
                id: store.id,
                name: store.name,
                slug: store.slug,
            },
            filter: {
                type: normalized.filterType,
                year: normalized.year ?? null,
                month: normalized.month ?? null,
                range: normalized.range,
            },
            metadata: {
                availableYears: metadata.availableYears,
                availableMonthsByYear: metadata.availableMonthsByYear,
                monthsForSelectedYear: getMonthsForYear(metadata.availableMonthsByYear, normalized.year),
                defaultSelections: {
                    year: normalized.defaults.year,
                    month: normalized.defaults.month,
                },
                totalRecords: allSalesRows.length,
            },
            totals: {
                totalQuantity: performance.totalQuantity,
                todaySales: performance.todaySales,
                previousPeriodSales,
                percentageChange,
                currentTarget,
                targetProgress: round(targetProgress),
                remainingTarget:
                    currentTarget === 0 ? 0 : Math.max(currentTarget - performance.totalQuantity, 0),
            },
            highlights: {
                topCategories,
                topProducts,
            },
            charts: {
                salesStats,
                categoryDistribution: buildChartData(performance.categoryMap),
                productDistribution: buildChartData(performance.productMap),
                topProducts: topProductsBySales,
                topCategories: topCategoriesBySales,
                monthlySales: buildMonthlySeries(performance.monthMap),
            },
            counts: {
                totalRows: filteredRows.length,
            },
        };

        return response;
    },
}));
