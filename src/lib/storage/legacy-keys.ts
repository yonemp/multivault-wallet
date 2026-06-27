/** One-time migration from multivault_* / mv_* / TACKERS_* keys to tackers_* */

function migrateItem(
  storage: Storage,
  key: string,
  legacyKeys: string[],
): string | null {
  const current = storage.getItem(key);
  if (current != null) return current;
  for (const legacyKey of legacyKeys) {
    const legacy = storage.getItem(legacyKey);
    if (legacy != null) {
      storage.setItem(key, legacy);
      storage.removeItem(legacyKey);
      return legacy;
    }
  }
  return null;
}

export function tackersLegacyKeys(key: string): string[] {
  if (!key.startsWith("tackers_")) return [];
  const suffix = key.slice("tackers_".length);
  return [`multivault_${suffix}`, `TACKERS_${suffix}`, `mv_${suffix}`];
}

export function getLegacyItem(key: string, ...extraLegacyKeys: string[]): string | null {
  if (typeof window === "undefined") return null;
  return migrateItem(localStorage, key, [...tackersLegacyKeys(key), ...extraLegacyKeys]);
}

export function getLegacySessionItem(key: string, ...extraLegacyKeys: string[]): string | null {
  if (typeof window === "undefined") return null;
  return migrateItem(sessionStorage, key, [...tackersLegacyKeys(key), ...extraLegacyKeys]);
}