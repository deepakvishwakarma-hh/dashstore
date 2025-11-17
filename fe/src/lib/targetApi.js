"use client";
import strapiApi from "@/lib/strapi";

const RELATION_KEYS = ["store", "category", "product", "employee"];

const TARGET_RELATION_FIELDS = {
  store: ["name", "slug", "address"],
  category: ["name", "slug"],
  product: ["name", "slug"],
  employee: ["name", "email", "mobile", "username"],
};

const TARGET_POPULATE_QUERY = [
  "populate[store][fields][0]=name",
  "populate[store][fields][1]=slug",
  "populate[store][fields][2]=address",
  "populate[category][fields][0]=name",
  "populate[category][fields][1]=slug",
  "populate[product][fields][0]=name",
  "populate[product][fields][1]=slug",
  "populate[employee][fields][0]=name",
  "populate[employee][fields][1]=email",
  "populate[employee][fields][2]=mobile",
  "populate[employee][fields][3]=username",
].join("&");

function extractRelation(relation, relationKey) {
  if (!relation) return null;

  const relationData = relation.data ?? relation;
  if (!relationData) return null;

  const attributes = relationData.attributes
    ? { ...relationData.attributes }
    : { ...relationData };

  const allowedFields = TARGET_RELATION_FIELDS[relationKey] || [];

  const filteredAttributes = Object.fromEntries(
    Object.entries(attributes).filter(
      ([key]) => allowedFields.length === 0 || allowedFields.includes(key)
    )
  );

  return {
    id: relationData.id ?? attributes.id ?? null,
    documentId: relationData.documentId ?? attributes.documentId ?? null,
    name:
      attributes.name ||
      attributes.username ||
      attributes.storeName ||
      attributes.title ||
      "",
    slug: attributes.slug || "",
    ...filteredAttributes,
  };
}

export function normalizeTarget(targetEntry) {
  if (!targetEntry) return null;

  const attributes = targetEntry.attributes
    ? { ...targetEntry.attributes }
    : { ...targetEntry };

  const normalized = {
    id: targetEntry.id ?? attributes.id ?? null,
    documentId: targetEntry.documentId ?? attributes.documentId ?? null,
    type: attributes.type || "",
    period_type: attributes.period_type || "",
    year: attributes.year || "",
    month: attributes.month || "",
    target_quantity:
      attributes.target_quantity !== undefined
        ? Number(attributes.target_quantity)
        : null,
    target_revenue_achieved:
      attributes.target_revenue_achieved !== undefined
        ? Number(attributes.target_revenue_achieved)
        : null,
  };

  RELATION_KEYS.forEach((key) => {
    normalized[key] = extractRelation(attributes[key] ?? targetEntry[key], key);
  });

  return normalized;
}

export async function fetchTargetById(targetId) {
  if (!targetId) return null;
  const response = await strapiApi.get(
    `/targets/${targetId}?${TARGET_POPULATE_QUERY}`
  );
  const targetData = response.data?.data || response.data || null;
  return normalizeTarget(targetData);
}

export const targetPopulateQuery = TARGET_POPULATE_QUERY;
