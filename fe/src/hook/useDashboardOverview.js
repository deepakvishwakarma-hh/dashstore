"use client";

import { useQuery } from "@tanstack/react-query";
import strapiApi from "@/lib/strapi";

export function useDashboardOverview(params = {}, options = {}) {
  return useQuery({
    queryKey: ["dashboard-overview", params],
    queryFn: async ({ queryKey }) => {
      const [, queryParams] = queryKey;
      const response = await strapiApi.get("/dashboard/sales/overview", {
        params: queryParams,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
