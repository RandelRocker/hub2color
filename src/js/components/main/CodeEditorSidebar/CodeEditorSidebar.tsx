import { useState, useCallback, useRef, useEffect } from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    IconButton,
    Toolbar,
    Tooltip,
} from "@mui/material";
import { Save, Close } from "@mui/icons-material";
import { useDispatch } from "react-redux";

import {
    toggleCodeEditorSidebar
} from "../../../store/actions";
import { CustomCssTab } from "./CustomCssTab/CustomCssTab";
import { CustomJsTab } from "./CustomJsTab/CustomJsTab";

const MIN_WIDTH = 300;
const MAX_WIDTH = 1000;
const DEFAULT_WIDTH = 420;

export const CodeEditorSidebar = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);

    // Refs for optimized drag handling
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);

    // Handle mouse move with RAF for smooth updates
    const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
        // Cancel any pending RAF to prevent buildup
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
            const deltaX = startXRef.current - e.clientX;
            const newWidth = Math.min(
                MAX_WIDTH,
                Math.max(MIN_WIDTH, startWidthRef.current + deltaX)
            );
            setSidebarWidth(newWidth);
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        startXRef.current = e.clientX;
        startWidthRef.current = sidebarWidth;
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
    }, [sidebarWidth]);

    const handleSave = useCallback(() => {
        // Open the create tag dialog based on active tab
        setDialogOpen(true);
    }, []);

    const handleDialogClose = useCallback(() => {
        setDialogOpen(false);
    }, []);

    const handleClose = () => {
        dispatch(toggleCodeEditorSidebar());
    };

    return (
        <>
            {/* Full-screen overlay during drag to capture all mouse events */}
            {isDragging && (
                <Box
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        cursor: "ew-resize",
                        zIndex: 9999
                    }}
                />
            )}
            <Paper
                sx={{
                    width: sidebarWidth,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "white",
                    borderRadius: 0,
                    borderTop: 0,
                    borderLeft: 1,
                    borderColor: "divider",
                    overflow: "hidden",
                    boxShadow: "none",
                    position: "relative"
                }}
            >
                {/* Resize Handle */}
                <Box
                    onMouseDown={handleResizeStart}
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: 6,
                        cursor: "ew-resize",
                        zIndex: 10,
                        "&:hover": {
                            "&::after": {
                                opacity: 1
                            }
                        },
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: 3,
                            backgroundColor: "primary.main",
                            opacity: 0,
                            transition: "opacity 0.15s ease"
                        }
                    }}
                />
                {/* Header */}
            <Toolbar
                variant="dense"
                sx={{
                    minHeight: 40,
                    borderBottom: 1,
                    borderColor: "divider",
                    justifyContent: "space-between",
                    backgroundColor: "#F7F9FC",
                    "@media (min-width:600px)": {
                        paddingRight: "16px",
                        paddingLeft: "16px"
                    }
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => {
                            setActiveTab(newValue);
                        }}
                        variant="scrollable"
                        scrollButtons={false}
                        sx={{
                            minHeight: 36,
                            "& .MuiTab-root": {
                                minHeight: 36,
                                fontSize: 12,
                                fontWeight: 500,
                                textTransform: "none",
                                px: 2
                            }
                        }}
                    >
                        <Tab label="Custom CSS" />
                        <Tab label="Custom JS" />
                    </Tabs>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title={activeTab === 0 ? "Create CSS Tag" : "Create JS Tag"}>
                        <IconButton size="small" onClick={handleSave}>
                            <Save fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Close">
                        <IconButton size="small" onClick={handleClose}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>

                {/* Tab Content */}
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                    {activeTab === 0 && <CustomCssTab dialogOpen={dialogOpen} onDialogClose={handleDialogClose} />}
                    {activeTab === 1 && <CustomJsTab dialogOpen={dialogOpen} onDialogClose={handleDialogClose} />}
                </Box>
            </Paper>
        </>
    );
};

