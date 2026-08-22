// utils/local-cache.util.ts
//
// Stage 3 (Loading Speed Plan) -- thin wrapper around @capacitor/preferences
// giving pages a local-first "last known list" to show instantly on launch/
// re-entry, before the network request even starts (stale-while-revalidate).
//
// Every function here is deliberately NEVER allowed to throw. A page calling
// getCachedData()/setCachedData()/clearCachedData() must always be able to
// fall back to its normal network-only behavior -- corrupted JSON, the
// Preferences plugin being unavailable (e.g. running in a plain browser tab
// without Capacitor's web fallback wired up), or a full/denied storage quota
// must never crash or block the page. Every failure mode below is swallowed
// and logged, not re-thrown.
import { Preferences } from '@capacitor/preferences';

/**
 * Reads and JSON-parses a cached value. Returns null on any failure
 * (missing key, corrupted JSON, plugin error) -- callers should treat null
 * exactly like "no cache yet" and fall back to their normal load path.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const { value } = await Preferences.get({ key });
    if (value === null || value === undefined) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`[local-cache] Failed to read cache for "${key}":`, error);
    return null;
  }
}

/**
 * JSON-stringifies and writes a value to local storage. Fire-and-forget by
 * design (callers use `void setCachedData(...)`) -- a failed write here
 * must never block or fail the page itself, it just means the next cold
 * start won't have a snapshot to hydrate from.
 */
export async function setCachedData<T>(key: string, value: T): Promise<void> {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch (error: any) {
    // If quota exceeded, clean up stale fordago cache keys and retry
    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('CapacitorStorage.fordago.cache') && !k.includes(key)) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
        await Preferences.set({ key, value: JSON.stringify(value) });
      }
    } catch {
      // Swallowed safely - caching is optional
    }
  }
}

/**
 * Removes a single cached key. Also fire-and-forget -- see setCachedData()
 * above. Used by AuthService.logout() so a different member logging in on
 * the same device never briefly sees the previous member's last-cached
 * list before the real fetch completes.
 */
export async function clearCachedData(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
  } catch (error) {
    console.warn(`[local-cache] Failed to clear cache for "${key}":`, error);
  }
}
