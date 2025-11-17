"use client";
import { useQuery } from "@tanstack/react-query";
import strapiApi from "@/lib/strapi";
import { normalizeStore } from "@/lib/normalizeStore";
import { useSession } from "./useSession";

/**
 * Hook to fetch stores data from Strapi API
 * Cached for 1 hour to avoid multiple requests
 *
 * @param {Object} options - Query options
 * @param {boolean} options.filterByUserStores - If true, only return stores the user has access to (from session)
 * @param {boolean} options.useSessionStores - If true, use stores from session instead of fetching from API (default: false)
 * @param {boolean} options.enabled - Whether the query should run (default: true)
 * @returns {Object} Query result with stores data
 */
export function useStores(options = {}) {
  const {
    filterByUserStores = false,
    useSessionStores = false,
    enabled = true,
  } = options;
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();

  // If using session stores, return stores from session
  const sessionStores = useSessionStores && user?.stores ? user.stores : null;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      try {
        const response = await strapiApi.get("/stores?pagination[limit]=1000");

        // Handle Strapi response structure
        const stores = response.data?.data || response.data || [];

        return stores
          .map((store) => normalizeStore(store))
          .filter((store) => store);
      } catch (error) {
        console.error("Error fetching stores:", error);
        throw error;
      }
    },
    enabled: enabled && !useSessionStores, // Don't fetch if using session stores
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour (React Query v5 uses gcTime instead of cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Use session stores if requested, otherwise use fetched data
  const allStoresData = useSessionStores ? sessionStores : data;

  // Filter stores by user's accessible stores if requested
  let filteredStores = allStoresData || [];
  if (filterByUserStores && isLoggedIn && user?.stores) {
    const userStoreIds = user.stores.map((store) => store.id);
    filteredStores = filteredStores.filter((store) =>
      userStoreIds.includes(store.id)
    );
  }

  // Determine loading state
  const isLoadingStores = useSessionStores ? sessionLoading : isLoading;

  return {
    stores: filteredStores,
    allStores: allStoresData || [],
    isLoading: isLoadingStores,
    isError,
    error,
    refetch,
    // Helper functions
    getStoreById: (id) => filteredStores.find((store) => store.id === id),
    getStoreBySlug: (slug) =>
      filteredStores.find((store) => store.slug === slug),
    hasAccessToStore: (storeId) => {
      if (!filterByUserStores) return true;
      if (!isLoggedIn || !user?.stores) return false;
      return user.stores.some((store) => store.id === storeId);
    },
  };
}
