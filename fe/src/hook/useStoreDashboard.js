"use client";

import { useQuery } from "@tanstack/react-query";
import strapiApi from "@/lib/strapi";

export function useStoreDashboard(storeName, params = {}, options = {}) {
  return useQuery({
    queryKey: ["store-dashboard", storeName, params],
    queryFn: async ({ queryKey }) => {
      const [, store, queryParams] = queryKey;
      if (!store) {
        throw new Error("Store name is required");
      }
      const encodedStoreName = encodeURIComponent(store);
      const response = await strapiApi.get(
        `/dashboard/sales/store/${encodedStoreName}`,
        {
          params: queryParams,
        }
      );
      return response.data;
    },
    enabled: !!storeName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
