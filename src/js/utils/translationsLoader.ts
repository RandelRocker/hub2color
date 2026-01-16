/**
 * Utility for loading and caching translations from translations.conf
 */

type TranslationsMap = Record<string, string>;

let translationsCache: TranslationsMap | null = null;
let loadingPromise: Promise<TranslationsMap> | null = null;

/**
 * Parse translations.conf format to JSON object
 * Format: "key"="""value"""
 */
function parseTranslationsConf(content: string): TranslationsMap {
    const translations: TranslationsMap = {};
    const regex = /"([^"]+)"\s*=\s*"""([^"]*)"""/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const [, key, value] = match;
        translations[key] = value;
    }

    return translations;
}

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
    loadingPromise = fetch("/api/translations.conf")
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to load translations: ${response.statusText}`
                );
            }
            return response.text();
        })
        .then((content) => {
            const parsed = parseTranslationsConf(content);
            translationsCache = parsed;
            loadingPromise = null;
            return parsed;
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
