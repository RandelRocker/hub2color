import { useEffect, useRef, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";

import * as helpers from "./helpers";
import { RootState } from "../../../store";
import { setControlsSchema, setStyleSchema } from "../../../store/actions";

export const PreviewFrame = () => {
    const dispatch = useDispatch();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const {
        currentPage,
        zoom,
        viewport,
        direction,
        controlValues,
        stylingTheme,
        customCss,
        customJs,
        loading,
        selectedTemplate
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

    const loadControlsSchema = useCallback(
        async (pagePath: string) => {
            try {
                const schemaPath = pagePath.replace(
                    /\.html$/,
                    ".props.schema.json"
                );
                const response = await fetch(`/${schemaPath}`);

                if (response.ok) {
                    const schema = await response.json();
                    dispatch(setControlsSchema(schema));
                } else {
                    dispatch(setControlsSchema(null));
                }
            } catch (error) {
                console.warn("Failed to load schema for", pagePath, error);
                dispatch(setControlsSchema(null));
            }
        },
        [dispatch]
    );

    const loadStyleSchema = useCallback(
        async (pagePath: string) => {
            try {
                const schemaPath = pagePath.replace(
                    /\.html$/,
                    ".style.schema.json"
                );
                const response = await fetch(`/${schemaPath}`);

                if (response.ok) {
                    const schema = await response.json();
                    dispatch(setStyleSchema(schema));
                } else {
                    dispatch(setStyleSchema(null));
                }
            } catch (error) {
                console.warn(
                    "Failed to load style schema for",
                    pagePath,
                    error
                );
                dispatch(setStyleSchema(null));
            }
        },
        [dispatch]
    );

    const handleIframeLoad = useCallback(() => {
        if (!currentPage) return;

        sendMessageToFrame("NAVIGATED", { path: currentPage });
        sendMessageToFrame("SET_DIR", { dir: direction });
        sendMessageToFrame("SET_ZOOM", { scale: zoom });

        if (customCss) {
            sendMessageToFrame("APPLY_CSS", { css: customCss });
        }

        if (customJs) {
            sendMessageToFrame("APPLY_JS", { js: customJs });
        }

        if (selectedTemplate) {
            sendMessageToFrame("TEMPLATE_CHANGE", {
                template: selectedTemplate
            });
        }

        // Send styling theme
        if (stylingTheme && Object.keys(stylingTheme).length > 0) {
            sendMessageToFrame("THEME_CHANGE", {
                theme: helpers.prepareThemeData(stylingTheme)
            });
        }

        Object.entries(controlValues).forEach(([name, value]) => {
            // Handle font field empty values (format "_px", "_rem", etc.)
            const textUnits = ["px", "rem", "em", "%", "pt"];
            const finalValue =
                typeof value === "string" &&
                textUnits.some((unit) => value === unit)
                    ? undefined
                    : value;

            sendMessageToFrame("CONTROL_CHANGE", { name, value: finalValue });
        });
    }, [
        currentPage,
        direction,
        zoom,
        customCss,
        customJs,
        selectedTemplate,
        controlValues,
        stylingTheme,
        sendMessageToFrame
    ]);

    useEffect(() => {
        if (currentPage) {
            loadControlsSchema(currentPage);
            loadStyleSchema(currentPage);
        }
    }, [currentPage, loadControlsSchema, loadStyleSchema]);

    useEffect(() => {
        sendMessageToFrame("SET_DIR", { dir: direction });
    }, [direction, sendMessageToFrame]);

    useEffect(() => {
        sendMessageToFrame("SET_ZOOM", { scale: zoom });
    }, [zoom, sendMessageToFrame]);

    useEffect(() => {
        if (customCss) {
            sendMessageToFrame("APPLY_CSS", { css: customCss });
        }
    }, [customCss, sendMessageToFrame]);

    useEffect(() => {
        if (customJs) {
            sendMessageToFrame("APPLY_JS", { js: customJs });
        }
    }, [customJs, sendMessageToFrame]);

    useEffect(() => {
        Object.entries(controlValues).forEach(([name, value]) => {
            // Handle font field empty values (format "_px", "_rem", etc.)
            const finalValue =
                typeof value === "string" && value.startsWith("_")
                    ? undefined
                    : value;

            sendMessageToFrame("CONTROL_CHANGE", { name, value: finalValue });
        });
    }, [controlValues, sendMessageToFrame]);

    useEffect(() => {
        if (stylingTheme) {
            sendMessageToFrame("THEME_CHANGE", {
                theme: helpers.prepareThemeData(stylingTheme)
            });
        }
    }, [stylingTheme, sendMessageToFrame]);

    useEffect(() => {
        if (selectedTemplate) {
            sendMessageToFrame("TEMPLATE_CHANGE", {
                template: selectedTemplate
            });
        }
    }, [selectedTemplate, sendMessageToFrame]);

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
                    height: "100%",
                    bgcolor: "white",
                    overflow: "hidden",
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center"
                }}
            >
                <iframe
                    ref={iframeRef}
                    src={`/${currentPage}`}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block"
                    }}
                    onLoad={handleIframeLoad}
                    title="Component Preview"
                />
            </Box>
        </Box>
    );
};
