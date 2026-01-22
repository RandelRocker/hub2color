/**
 * Utility for loading and caching translations from translations.conf
 */
import * as config from "../../../config";

type TranslationsMap = Record<string, string>;

let translationsCache: TranslationsMap | null = null;
let loadingPromise: Promise<TranslationsMap> | null = null;

/**
 * Load translations from the server (only once)
 * Subsequent calls return the cached version
 */
export async function loadTranslations(): Promise<TranslationsMap> {
    // Return cached translations if already loaded
    if (translationsCache) {
        return translationsCache;
    }

    // If already loading, return the existing promise
    if (loadingPromise) {
        return loadingPromise;
    }

    // Start loading
    loadingPromise = fetch(`${config.HUB2COLOR_PUBLIC_PATH}/config/translations.json`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to load translations: ${response.statusText}`
                );
            }
            return response.json();
        })
        .catch((error) => {
            loadingPromise = null;
            console.error("Error loading translations:", error);
            throw error;
        });

    return loadingPromise;
}

/**
 * Get cached translations (returns null if not loaded yet)
 */
export function getCachedTranslations(): TranslationsMap | null {
    return translationsCache;
}

/**
 * Clear the translations cache (useful for testing or force reload)
 */
export function clearTranslationsCache(): void {
    translationsCache = null;
    loadingPromise = null;
}
