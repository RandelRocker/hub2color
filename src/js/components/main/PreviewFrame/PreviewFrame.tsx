import { useEffect, useRef, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";

import * as helpers from "./helpers";
import { RootState } from "../../../store";
import * as config from "../../../../../config";
import { setComponentSchema, setReferenceOverlay } from "../../../store/actions";
import { PageItem, PageSection, ComponentSchema, StyleField, StyleGroup, ControlField } from "../../../store/types";
import { createReferenceOverlayFromFile, getFirstImageFromClipboard } from "../../../utils/referenceOverlay";
import { loadTranslations } from "../../../utils/translationsLoader";
import { ReferenceOverlay } from "./ReferenceOverlay/ReferenceOverlay";

export const PreviewFrame = () => {
    const iframeRefreshKeyRef = useRef(0);
    const dispatch = useDispatch();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const translationsRef = useRef<Record<string, string> | null>(null);
    const {
        currentPage,
        pages,
        zoom,
        viewport,
        viewportRotated,
        direction,
        customCss,
        customJs,
        customHtml,
        loading,
        styleTabValues,
        savedTheme,
        controlsTabValues,
        serverResponsesMocks,
        portalTags,
        portalTagsEnabled,
        previewBackgroundColor,
        themeName,
        themeUrl,
        referenceOverlay,
        iframeRefreshKey,
        showTranslationKeys
    } = useSelector((state: RootState) => state.app);

    const handleReferenceOverlayChange = useCallback((nextOverlay: NonNullable<typeof referenceOverlay>) => {
        dispatch(setReferenceOverlay(nextOverlay));
    }, [dispatch]);

    const handleReferenceOverlayDelete = useCallback(() => {
        dispatch(setReferenceOverlay(null));
    }, [dispatch]);

    const handleClipboardImage = useCallback(async (event: ClipboardEvent) => {
        const imageFile = getFirstImageFromClipboard(event);
        if (!imageFile) {
            return;
        }

        event.preventDefault();
        const nextOverlay = await createReferenceOverlayFromFile(imageFile);
        if (!nextOverlay) {
            return;
        }

        dispatch(setReferenceOverlay(nextOverlay));
    }, [dispatch]);

    useEffect(() => {
        let detachIframePasteListener: () => void = () => undefined;
        let cancelled = false;

        const attachIframePasteListener = (): (() => void) => {
            let frameDocument: Document | null = null;
            try {
                frameDocument = iframeRef.current?.contentWindow?.document ?? null;
            } catch {
                return () => undefined;
            }

            if (!frameDocument) {
                return () => undefined;
            }

            const handler = (event: ClipboardEvent) => {
                handleClipboardImage(event);
            };

            frameDocument.addEventListener("paste", handler, true);

            return () => {
                try {
                    frameDocument?.removeEventListener("paste", handler, true);
                } catch {
                    // ignore when document is gone
                }
            };
        };

        const tryAttach = () => {
            if (cancelled) return;
            detachIframePasteListener();
            detachIframePasteListener = attachIframePasteListener();
        };

        tryAttach();

        const timeouts: ReturnType<typeof setTimeout>[] = [100, 300, 800].map((ms) =>
            setTimeout(tryAttach, ms)
        );

        const iframeEl = iframeRef.current;
        const handleIframeLoad = () => {
            tryAttach();
        };

        iframeEl?.addEventListener("load", handleIframeLoad);

        return () => {
            cancelled = true;
            detachIframePasteListener();
            timeouts.forEach(clearTimeout);
            iframeEl?.removeEventListener("load", handleIframeLoad);
        };
    }, [currentPage, handleClipboardImage]);

    // Load translations once on mount
    useEffect(() => {
        loadTranslations()
            .then((translations) => {
                translationsRef.current = translations;
            })
            .catch((error) => {
                console.error("Failed to load translations:", error);
            });
    }, []);

    const sendMessageToFrame = useCallback(
        (type: string, payload?: unknown) => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    {
                        source: "hub2color",
                        type,
                        payload
                    },
                    "*"
                );
            }
        },
        []
    );

    // Helper function to recursively find a page item by path
    const findPageItemByPath = useCallback(
        (sections: PageSection[], path: string): PageItem | null => {
            for (const section of sections) {
                const findInItems = (items: PageItem[]): PageItem | null => {
                    for (const item of items) {
                        if (item.path === path) {
                            return item;
                        }
                        if (item.items) {
                            const found = findInItems(item.items);
                            if (found) {
                                return found;
                            }
                        }
                    }
                    return null;
                };

                const found = findInItems(section.items);
                if (found) {
                    return found;
                }
            }
            return null;
        },
        []
    );

    // Helper function to merge multiple schemas
    const mergeSchemas = useCallback(
        (schemas: ComponentSchema[]): ComponentSchema => {
            if (schemas.length === 0) {
                return { controls: [], styles: [] };
            }

            if (schemas.length === 1) {
                return schemas[0];
            }

            const merged: ComponentSchema = {
                controls: [],
                styles: []
            };

            // First, collect all control IDs that should be deleted
            const controlsToDelete = new Set<string>();
            schemas.forEach((schema) => {
                if (schema.controls) {
                    schema.controls.forEach((control: { type?: string; id?: string }) => {
                        if (control.type === "delete" && control.id) {
                            controlsToDelete.add(control.id);
                        }
                    });
                }
            });

            // Merge controls arrays, replacing controls with the same ID
            schemas.forEach((schema) => {
                if (schema.controls) {
                    schema.controls.forEach((control: ControlField | { type?: string; id?: string }) => {
                        const controlId = control.id;
                        // Exclude controls marked for deletion or with type "delete"
                        if ((control as { type?: string }).type === "delete" || (controlId && controlsToDelete.has(controlId))) {
                            return;
                        }
                        // Type guard: ensure it's a valid ControlField
                        if (!controlId || !("label" in control)) {
                            return;
                        }
                        const validControl = control as ControlField;
                        // Find existing control with the same ID
                        const existingIndex = merged.controls.findIndex(
                            (c) => c.id === validControl.id
                        );
                        if (existingIndex !== -1) {
                            // Replace existing control
                            merged.controls[existingIndex] = validControl;
                        } else {
                            // Add new control
                            merged.controls.push(validControl);
                        }
                    });
                }
            });

            // After all schemas are processed, filter out any controls that should be deleted
            // This ensures deletion works regardless of schema load order
            merged.controls = merged.controls.filter(
                (control) => !controlsToDelete.has(control.id)
            );

            // First, collect all style field/group IDs that should be deleted
            const stylesToDelete = new Set<string>();
            const collectStylesToDelete = (items: (StyleField | StyleGroup)[]): void => {
                items.forEach((item) => {
                    if ((item as { type?: string }).type === "delete" && item.id) {
                        stylesToDelete.add(item.id);
                    }
                    // Recursively check nested fields in groups
                    if ("fields" in item && item.fields) {
                        collectStylesToDelete(item.fields);
                    }
                });
            };
            schemas.forEach((schema) => {
                if (schema.styles) {
                    collectStylesToDelete(schema.styles);
                }
            });

            // Helper function to merge style items (groups and fields)
            const mergeStyleItems = (
                existing: (StyleField | StyleGroup)[],
                newItems: (StyleField | StyleGroup)[]
            ): (StyleField | StyleGroup)[] => {
                const result = [...existing];
                
                newItems.forEach((newItem) => {
                    // Exclude items marked for deletion or with type "delete"
                    const itemId = newItem.id;
                    if ((newItem as { type?: string }).type === "delete" || (itemId && stylesToDelete.has(itemId))) {
                        return;
                    }
                    
                    // Check if it's a group with an ID
                    if (newItem.type === "group" && newItem.id) {
                        // Find existing group with the same ID
                        const existingGroupIndex = result.findIndex(
                            (item) => item.type === "group" && item.id === newItem.id
                        );
                        
                        if (existingGroupIndex !== -1) {
                            // Merge the group: append fields from newItem to existing group
                            const existingGroup = result[existingGroupIndex] as StyleGroup;
                            const newGroup = newItem as StyleGroup;
                            
                            if (existingGroup.fields && newGroup.fields) {
                                // Recursively merge nested fields/groups
                                existingGroup.fields = mergeStyleItems(
                                    existingGroup.fields,
                                    newGroup.fields
                                );
                            } else if (newGroup.fields) {
                                // If existing group has no fields, just use new group's fields
                                existingGroup.fields = [...newGroup.fields];
                            }
                        } else {
                            // No existing group with this ID, add it (with recursively merged fields if it has nested groups)
                            const newGroup = newItem as StyleGroup;
                            if (newGroup.fields) {
                                const mergedNewItem: StyleGroup = {
                                    ...newGroup,
                                    fields: mergeStyleItems([], newGroup.fields)
                                };
                                result.push(mergedNewItem);
                            } else {
                                result.push(newItem);
                            }
                        }
                    } else {
                        // Not a group with ID, or it's a sectionTitle/groupTitle, just append
                        result.push(newItem);
                    }
                });
                
                return result;
            };

            // Merge styles arrays, handling groups with equal IDs
            schemas.forEach((schema) => {
                if (schema.styles) {
                    merged.styles = mergeStyleItems(merged.styles, schema.styles);
                }
            });

            // Helper function to recursively filter out deleted style items
            const filterDeletedStyles = (
                items: (StyleField | StyleGroup)[]
            ): (StyleField | StyleGroup)[] => {
                return items
                    .filter((item) => {
                        // Remove items that should be deleted
                        if (item.id && stylesToDelete.has(item.id)) {
                            return false;
                        }
                        return true;
                    })
                    .map((item) => {
                        // Recursively filter nested fields in groups
                        if ("fields" in item && item.fields) {
                            return {
                                ...item,
                                fields: filterDeletedStyles(item.fields)
                            } as StyleGroup;
                        }
                        return item;
                    });
            };

            // After all schemas are processed, filter out any styles that should be deleted
            // This ensures deletion works regardless of schema load order
            merged.styles = filterDeletedStyles(merged.styles);

            // Deep merge other properties
            const deepMerge = (
                target: Record<string, unknown>,
                source: Record<string, unknown>
            ) => {
                for (const key in source) {
                    if (key === "controls" || key === "styles") {
                        continue; // Already handled above
                    }
                    if (
                        typeof source[key] === "object" &&
                        source[key] !== null &&
                        !Array.isArray(source[key]) &&
                        typeof target[key] === "object" &&
                        target[key] !== null &&
                        !Array.isArray(target[key])
                    ) {
                        target[key] = deepMerge(
                            { ...(target[key] as Record<string, unknown>) },
                            source[key] as Record<string, unknown>
                        );
                    } else {
                        target[key] = source[key];
                    }
                }
                return target;
            };

            schemas.forEach((schema) => {
                deepMerge(
                    merged as unknown as Record<string, unknown>,
                    schema as unknown as Record<string, unknown>
                );
            });

            return merged;
        },
        []
    );

    const loadComponentSchema = useCallback(
        async (pagePath: string) => {
            try {
                // Find the page item to check for schemaPath
                const pageItem = findPageItemByPath(pages, pagePath);

                let schemaPaths: string[];

                if (pageItem?.schemaPath) {
                    // Use schemaPath from menu config
                    if (Array.isArray(pageItem.schemaPath)) {
                        schemaPaths = pageItem.schemaPath;
                    } else {
                        schemaPaths = [pageItem.schemaPath];
                    }
                } else {
                    // Fall back to default behavior: replace .html with .schema.json
                    schemaPaths = [pagePath.replace(/\.html$/, ".schema.json")];
                }

                // Load all schema files
                const schemaPromises = schemaPaths.map(async (schemaPath) => {
                    try {
                        const response = await fetch(`${config.HUB2COLOR_PUBLIC_PATH}/${schemaPath}`);

                        if (!response.ok) {
                            throw new Error(`Failed to load schema: ${schemaPath}`);
                        }

                        return response.json() as Promise<ComponentSchema>;
                    } catch (error) {
                        throw new Error(`Failed to fetch schema: ${schemaPath}`);
                    }
                });

                const schemas = await Promise.all(schemaPromises);

                // Merge schemas if multiple were loaded
                const mergedSchema = mergeSchemas(schemas);
                dispatch(setComponentSchema(mergedSchema));
            } catch (error) {
                // console.error("Error loading component schema:", error);
                dispatch(setComponentSchema(null));
            }
        },
        [dispatch, pages, findPageItemByPath, mergeSchemas]
    );

    const handleIframeLoad = useCallback(() => {
        if (!currentPage) return;

        sendMessageToFrame("NAVIGATED", { path: currentPage });
        sendMessageToFrame("DIR_CHANGE", { dir: direction });
        sendMessageToFrame("SET_ZOOM", { scale: zoom });

        // Send translations to iframe
        if (translationsRef.current) {
            sendMessageToFrame("TRANSLATIONS_LOADED", {
                translations: translationsRef.current
            });
        }

        if (customCss) {
            sendMessageToFrame("CUSTOM_CSS_CHANGE", { css: customCss });
        }

        if (customJs) {
            sendMessageToFrame("CUSTOM_JS_CHANGE", { js: customJs });
        }

        if (customHtml.beforeEndHead || customHtml.beforeEndBody) {
            sendMessageToFrame("CUSTOM_HTML_CHANGE", {
                beforeEndHead: customHtml.beforeEndHead,
                beforeEndBody: customHtml.beforeEndBody
            });
        }

        // Send styling theme
        if (styleTabValues || savedTheme) {
            sendMessageToFrame("STYLING_CHANGE", {
                styles: helpers.prepareStylingTheme({
                    savedTheme,
                    styleTabValues
                })
            });
        }

        // Send control values
        const processedValues: Record<string, unknown> = {};

        Object.entries(controlsTabValues).forEach(([name, value]) => {
            processedValues[name] = helpers.removeUnitsFromValue(value);
        });

        sendMessageToFrame("CONTROLS_CHANGE", { values: processedValues });

        // Send portal tags if enabled
        if (portalTagsEnabled) {
            portalTags && portalTags.length > 0 && sendMessageToFrame("PORTAL_TAGS_CHANGE", { tags: portalTags });
        }

        // Send preview background color
        sendMessageToFrame("PREVIEW_BACKGROUND_COLOR_CHANGE", { color: previewBackgroundColor });

        // Send portal theme info
        sendMessageToFrame("PORTAL_INFO_UPDATE", { themeName, themeUrl });

        sendMessageToFrame("TOGGLE_SHOW_TRANSLATION_KEYS", showTranslationKeys);

        sendMessageToFrame("MOCKS_CHANGE", serverResponsesMocks);

        sendMessageToFrame("CMSR_READY");
    }, [
        currentPage,
        styleTabValues,
        sendMessageToFrame,
        direction,
        zoom,
        customCss,
        customJs,
        customHtml,
        savedTheme,
        controlsTabValues,
        portalTagsEnabled,
        portalTags,
        previewBackgroundColor,
        themeName,
        themeUrl,
        showTranslationKeys,
        serverResponsesMocks,
    ]);

    useEffect(() => {
        if (currentPage) {
            loadComponentSchema(currentPage);
        }
    }, [currentPage, loadComponentSchema, dispatch]);

    useEffect(() => {
        if (iframeRefreshKeyRef.current !== iframeRefreshKey) {
            handleIframeLoad();
            iframeRefreshKeyRef.current = iframeRefreshKey;
        }
    }, [handleIframeLoad, iframeRefreshKey]);

    useEffect(() => {
        sendMessageToFrame("DIR_CHANGE", { dir: direction });
    }, [direction, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("SET_ZOOM", { scale: zoom });
    }, [zoom, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("CUSTOM_CSS_CHANGE", { css: customCss || "" });
    }, [customCss, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("CUSTOM_JS_CHANGE", { js: customJs || "" });
    }, [customJs, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("CUSTOM_HTML_CHANGE", {
            beforeEndHead: customHtml.beforeEndHead,
            beforeEndBody: customHtml.beforeEndBody
        });
    }, [customHtml, sendMessageToFrame]);

    useEffect(() => {
        const processedValues: Record<string, unknown> = {};

        Object.entries(controlsTabValues).forEach(([name, value]) => {
            processedValues[name] = helpers.removeUnitsFromValue(value);
        });

        sendMessageToFrame("CONTROLS_CHANGE", { values: processedValues });
    }, [controlsTabValues, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("MOCKS_CHANGE", serverResponsesMocks);
    }, [serverResponsesMocks, sendMessageToFrame]);

    useEffect(() => {
        if (styleTabValues) {
            sendMessageToFrame("STYLING_CHANGE", {
                styles: helpers.prepareStylingTheme({
                    savedTheme,
                    styleTabValues
                })
            });
        }
    }, [styleTabValues, sendMessageToFrame, savedTheme, viewport]);

    useEffect(() => {
        if (portalTagsEnabled) {
            sendMessageToFrame("PORTAL_TAGS_CHANGE", { tags: portalTags });
        } else {
            sendMessageToFrame("PORTAL_TAGS_CHANGE", { tags: [] });
        }
    }, [portalTags, portalTagsEnabled, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("PREVIEW_BACKGROUND_COLOR_CHANGE", { color: previewBackgroundColor });
    }, [previewBackgroundColor, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("PORTAL_INFO_UPDATE", { themeName, themeUrl });
    }, [themeName, themeUrl, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("ORIENTATION_CHANGE");
    }, [viewportRotated, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("TOGGLE_SHOW_TRANSLATION_KEYS", showTranslationKeys);
    }, [showTranslationKeys, sendMessageToFrame]);

    // Listen for PORTAL_READY message from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verify message is from our iframe
            if (
                iframeRef.current?.contentWindow &&
                event.source === iframeRef.current.contentWindow &&
                event.data?.type === "PORTAL_READY"
            ) {
                handleIframeLoad();
            }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [handleIframeLoad]);

    const getViewportWidth = () => {
        switch (viewport) {
            case "mobile":
                return viewportRotated ? 812 : 376;
            case "tablet":
                return viewportRotated ? 1024 : 768;
            default:
                return "100%";
        }
    };

    const getViewportHeight = () => {
        switch (viewport) {
            case "mobile":
                return viewportRotated ? 376 : 812;
            case "tablet":
                return viewportRotated ? 768 : 1024;
            default:
                return "100%";
        }
    };

    const viewportWidthPx =
        viewport === "desktop" ? undefined : (getViewportWidth() as number);
    const viewportHeightPx =
        viewport === "desktop" ? undefined : (getViewportHeight() as number);

    const getIframeSrc = () => {
        if (!currentPage) return "";

        const baseUrl = `${config.HUB2COLOR_PUBLIC_PATH}/${currentPage}`;

        if (viewport === "mobile") {
            return `${baseUrl}?hideAdminControls=1&emulate=mobile`;
        } else if (viewport === "tablet") {
            return `${baseUrl}?hideAdminControls=1&emulate=tablet`;
        }

        return baseUrl;
    };

    if (loading) {
        return (
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#f5f5f5"
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!currentPage) {
        return (
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#f5f5f5",
                    flexDirection: "column",
                    gap: 2
                }}
            >
                <Typography variant="h6" color="text.secondary">
                    Select a page to preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Choose a component from the sidebar to get started
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                bgcolor: "#f5f5f5",
                overflow: "auto"
            }}
        >
            <Box
                sx={{
                    ...(viewport === "desktop"
                        ? { width: "100%", height: "100%" }
                        : {
                              minWidth: `max(100%, ${viewportWidthPx}px)`,
                              minHeight: `max(100%, ${viewportHeightPx}px)`
                          }),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                }}
            >
                <Box
                    sx={{
                        width: getViewportWidth(),
                        height: getViewportHeight(),
                        flexShrink: 0,
                        transform: `scale(${zoom})`,
                        position: "relative",
                        overflow: "visible",
                        transformOrigin: "center center"
                    }}
                >
                    <Box
                        sx={{
                            inset: 0,
                            overflow: "hidden",
                            position: "absolute",
                            bgcolor: previewBackgroundColor
                        }}
                    >
                        <iframe
                            key={iframeRefreshKey}
                            ref={iframeRef}
                            src={getIframeSrc()}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                display: "block"
                            }}
                            title="Component Preview"
                        />
                    </Box>

                    {referenceOverlay && (
                        <ReferenceOverlay
                            overlay={referenceOverlay}
                            onDelete={handleReferenceOverlayDelete}
                            onChange={handleReferenceOverlayChange}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};
