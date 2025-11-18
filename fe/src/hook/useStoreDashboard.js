"use client";

import { useQuery } from "@tanstack/react-query";
import strapiApi from "@/lib/strapi";

export function useStoreDashboard(storeSlug, params = {}, options = {}) {
  return useQuery({
    queryKey: ["store-dashboard", storeSlug, params],
    queryFn: async ({ queryKey }) => {
      const [, slug, queryParams] = queryKey;
      if (!slug) {
        throw new Error("Store slug is required");
      }
      const encodedStoreSlug = encodeURIComponent(slug);
      const response = await strapiApi.get(
        `/dashboard/sales/store/${encodedStoreSlug}`,
        {
          params: queryParams,
        }
      );
      return response.data;
    },
    enabled: !!storeSlug,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
