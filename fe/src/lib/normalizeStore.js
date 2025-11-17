/**
 * Normalize a Strapi store response so components don't have to deal
 * with the mixed v4/v5 shapes (attributes vs. flat).
 *
 * @param {any} storeEntry
 * @returns {object|null}
 */
export function normalizeStore(storeEntry) {
  if (!storeEntry) {
    return null;
  }

  const baseAttributes = storeEntry.attributes
    ? { ...storeEntry.attributes }
    : { ...storeEntry };

  const { administrators, ...rest } = baseAttributes;

  const administratorsData = extractRelationArray(administrators);

  return {
    id: storeEntry.id ?? baseAttributes.id ?? null,
    documentId: storeEntry.documentId ?? baseAttributes.documentId ?? null,
    name: baseAttributes.name || "",
    slug: baseAttributes.slug || storeEntry.slug || "",
    address: baseAttributes.address || "",
    ...rest,
    administrators: administratorsData,
  };
}

function extractRelationArray(relation) {
  if (!relation) {
    return [];
  }

  const relationData = relation.data ?? relation;
  const entries = Array.isArray(relationData)
    ? relationData
    : relationData
    ? [relationData]
    : [];

  return entries
    .map((entry) => {
      if (!entry) {
        return null;
      }
      const attrs = entry.attributes ? { ...entry.attributes } : { ...entry };
      return {
        id: entry.id ?? attrs.id ?? null,
        documentId: entry.documentId ?? attrs.documentId ?? null,
        name: attrs.name || attrs.username || "",
        email: attrs.email || "",
        mobile: attrs.mobile || "",
        type: attrs.type || "",
        ...attrs,
      };
    })
    .filter(Boolean);
}
