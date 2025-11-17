import strapiApi from "@/lib/strapi";
import { normalizeStore } from "@/lib/normalizeStore";

export async function fetchStoreById(storeId) {
  if (!storeId) return null;
  const response = await strapiApi.get(`/stores/${storeId}?populate=*`);
  const storeData = response.data?.data || response.data || null;
  return normalizeStore(storeData);
}
