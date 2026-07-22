/**
 * Utility for resolving element styles in element-picker (object) mode.
 *
 * A selected element's styles can be provided either inline as an array inside
 * the schema's `styles` object, or as a link to a JSON file (either in the
 * schema's `styles` object or in the global `style-schemas.json` config).
 * Fetched schemas are cached per-url so switching tabs/components or reselecting
 * the same element does not trigger a new request.
 */
import * as config from "../../../config";
import { StyleField, StyleGroup, StylesObjectMap, StyleSchemasConfig } from "../store/types";

type ResolvedStyles = (StyleField | StyleGroup)[];

const styleSchemaCache = new Map<string, Promise<ResolvedStyles>>();

const fetchStylesFromUrl = (schemaPath: string): Promise<ResolvedStyles> => {
    const cached = styleSchemaCache.get(schemaPath);

    if (cached) {
        return cached;
    }

    const request = fetch(`${config.HUB2COLOR_PUBLIC_PATH}/${schemaPath}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to load element style schema: ${schemaPath}`
                );
            }

            return response.json();
        })
        .then((data: { styles?: ResolvedStyles }) => data?.styles ?? [])
        .catch((error) => {
            styleSchemaCache.delete(schemaPath);
            throw error;
        });

    styleSchemaCache.set(schemaPath, request);

    return request;
};

/**
 * Resolve the styles array for the given element schema name.
 * Returns an empty array when the schema name cannot be resolved.
 */
export const resolveElementStyles = async (
    schemaName: string,
    stylesMap: StylesObjectMap | null,
    styleSchemasConfig: StyleSchemasConfig | null
): Promise<ResolvedStyles> => {
    const inlineStyles = stylesMap?.[schemaName];

    if (Array.isArray(inlineStyles)) {
        return inlineStyles;
    }

    const schemaPath =
        (typeof inlineStyles === "string" ? inlineStyles : undefined) ??
        styleSchemasConfig?.[schemaName];

    if (!schemaPath) {
        return [];
    }

    return fetchStylesFromUrl(schemaPath);
};

/**
 * Clear the resolved element styles cache (useful for testing or force reload).
 */
export const clearElementStylesCache = (): void => {
    styleSchemaCache.clear();
};
