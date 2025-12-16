import { useEffect, useRef, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";

import * as helpers from "./helpers";
import { RootState } from "../../../store";
import { setComponentSchema } from "../../../store/actions";

export const PreviewFrame = () => {
    const dispatch = useDispatch();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const {
        currentPage,
        zoom,
        viewport,
        direction,
        customCss,
        customJs,
        loading,
        styleTabValues,
        savedTheme,
        controlsTabValues,
        portalTags,
        portalTagsEnabled
    } = useSelector((state: RootState) => state.app);

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

    const loadComponentSchema = useCallback(
        async (pagePath: string) => {
            try {
                const schemaPath = pagePath.replace(/\.html$/, ".schema.json");
                const response = await fetch(`/${schemaPath}`);

                if (response.ok) {
                    const schema = await response.json();
                    dispatch(setComponentSchema(schema));
                } else {
                    dispatch(setComponentSchema(null));
                }
            } catch (error) {
                dispatch(setComponentSchema(null));
            }
        },
        [dispatch]
    );

    const handleIframeLoad = useCallback(() => {
        if (!currentPage) return;

        sendMessageToFrame("NAVIGATED", { path: currentPage });
        sendMessageToFrame("DIR_CHANGE", { dir: direction });
        sendMessageToFrame("SET_ZOOM", { scale: zoom });

        if (customCss) {
            sendMessageToFrame("CUSTOM_CSS_CHANGE", { css: customCss });
        }

        if (customJs) {
            sendMessageToFrame("CUSTOM_JS_CHANGE", { js: customJs });
        }

        // Send styling theme
        if (savedTheme) {
            sendMessageToFrame("STYLING_CHANGE", {
                styles: helpers.prepareStylingTheme(savedTheme)
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
            sendMessageToFrame("PORTAL_TAGS_CHANGE", { tags: portalTags });
        } else {
            sendMessageToFrame("PORTAL_TAGS_CHANGE", { tags: [] });
        }
    }, [currentPage, sendMessageToFrame, direction, zoom, customCss, customJs, savedTheme, controlsTabValues, portalTagsEnabled, portalTags]);

    useEffect(() => {
        if (currentPage) {
            loadComponentSchema(currentPage);
        }
    }, [currentPage, loadComponentSchema]);

    useEffect(() => {
        sendMessageToFrame("DIR_CHANGE", { dir: direction });
    }, [direction, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("SET_ZOOM", { scale: zoom });
    }, [zoom, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("CUSTOM_CSS_CHANGE", { css: customCss || '' });
    }, [customCss, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("CUSTOM_JS_CHANGE", { js: customJs || '' });
    }, [customJs, sendMessageToFrame]);

    useEffect(() => {
        const processedValues: Record<string, unknown> = {};

        Object.entries(controlsTabValues).forEach(([name, value]) => {
            processedValues[name] = helpers.removeUnitsFromValue(value);
        });

        sendMessageToFrame("CONTROLS_CHANGE", { values: processedValues });
    }, [controlsTabValues, sendMessageToFrame]);

    useEffect(() => {
        if (styleTabValues) {
            sendMessageToFrame("STYLING_CHANGE", {
                styles: helpers.prepareStylingTheme({ ...savedTheme, ...styleTabValues })
            });
        }
    }, [styleTabValues, sendMessageToFrame, savedTheme]);

    useEffect(() => {
        if (portalTagsEnabled) {
            sendMessageToFrame("PORTAL_TAGS_CHANGE", { tags: portalTags });
        } else {
            sendMessageToFrame("PORTAL_TAGS_CHANGE", { tags: [] });
        }
    }, [portalTags, portalTagsEnabled, sendMessageToFrame]);

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
                return 375;
            case "tablet":
                return 768;
            default:
                return "100%";
        }
    };

    const getViewportHeight = () => {
        switch (viewport) {
            case "mobile":
                return 812;
            case "tablet":
                return 1024;
            default:
                return "100%";
        }
    };

    const getIframeSrc = () => {
        if (!currentPage) return "";
        
        const baseUrl = `/${currentPage}`;
        
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
                bgcolor: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
            }}
        >
            <Box
                sx={{
                    width: getViewportWidth(),
                    height: getViewportHeight(),
                    bgcolor: "white",
                    overflow: "hidden",
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center"
                }}
            >
                <iframe
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
        </Box>
    );
};
