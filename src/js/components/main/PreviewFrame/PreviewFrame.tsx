import { useEffect, useRef, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import { setControlsSchema } from "../../../store/actions";

export const PreviewFrame = () => {
    const dispatch = useDispatch();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const {
        currentPage,
        zoom,
        viewport,
        direction,
        controlValues,
        customCss,
        customJs,
        loading
    } = useSelector((state: RootState) => state.app);

    const sendMessageToFrame = useCallback(
        (type: string, payload?: unknown) => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    {
                        source: "mini-storybook",
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
                const schemaPath = pagePath.replace(/\.html$/, ".props.schema.json");
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

        Object.entries(controlValues).forEach(([name, value]) => {
            sendMessageToFrame("CONTROL_CHANGE", { name, value });
        });
    }, [
        currentPage,
        direction,
        zoom,
        customCss,
        customJs,
        controlValues,
        sendMessageToFrame
    ]);

    useEffect(() => {
        if (currentPage) {
            loadControlsSchema(currentPage);
        }
    }, [currentPage, loadControlsSchema]);

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
            sendMessageToFrame("CONTROL_CHANGE", { name, value });
        });
    }, [controlValues, sendMessageToFrame]);

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
