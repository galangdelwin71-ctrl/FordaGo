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
  /** CoachingPanelComponent -- last-known coaches list */
  COACHES: 'fordago.cache.coaches',
  /** CoachingPanelComponent -- last-known coach profile */
  COACH_PROFILE: 'fordago.cache.coach_profile',
  /** CoachingPanelComponent -- last-known conversations list */
  COACH_CONVERSATIONS: 'fordago.cache.conversations',
  /** CoachingPanelComponent -- last-known public group classes */
  COACH_CLASSES: 'fordago.cache.classes',
  /** CoachingPanelComponent -- last-known coach dashboard stats */
  COACH_STATS: 'fordago.cache.coach_stats',
} as const;
