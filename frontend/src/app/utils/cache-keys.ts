// utils/cache-keys.ts
//
// Stage 3 (Loading Speed Plan) -- central registry of local-cache.util.ts
// storage keys, so every page reads/writes the SAME key for the same data
// instead of ad-hoc string literals drifting apart across files over time.
//
// Add a new entry here whenever a page adopts the Stage 3 local-first
// pattern (getCachedData/setCachedData from local-cache.util.ts) for a new
// list -- never inline a raw string key at the call site.
export const CACHE_KEYS = {
  /** InventoryPage (Shop) -- last-known products list, see inventory.page.ts loadProducts(). */
  PRODUCTS: 'fordago.cache.products',
  /** EquipmentPage -- last-known equipment list, see equipment.page.ts loadEquipment(). */
  EQUIPMENT: 'fordago.cache.equipment',
} as const;
