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
import { Save, Close, SellOutlined } from "@mui/icons-material";
import { useDispatch } from "react-redux";

import {
    toggleCodeEditorSidebar
} from "../../../store/actions";
import { CustomHtmlPayload } from "../../../store/types";
import { CustomCssTab, CustomCssTabHandle } from "./CustomCssTab/CustomCssTab";
import { CustomHTMLTab, CustomHTMLTabHandle } from "./CustomHTMLTab/CustomHTMLTab";
import { CustomJsTab, CustomJsTabHandle } from "./CustomJsTab/CustomJsTab";
import { TagsSelectDialog } from "./TagsSelectDialog/TagsSelectDialog";

const MIN_WIDTH = 300;
const MAX_WIDTH = 1000;
const DEFAULT_WIDTH = 450;

export const CodeEditorSidebar = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);

    // Refs for optimized drag handling
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);
    
    // Refs for tab components to call loadTag
    const cssTabRef = useRef<CustomCssTabHandle>(null);
    const jsTabRef = useRef<CustomJsTabHandle>(null);
    const htmlTabRef = useRef<CustomHTMLTabHandle>(null);

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

    const handleOpenTagsDialog = () => {
        setTagsDialogOpen(true);
    };

    const handleTagSelect = useCallback(
        (value: string | CustomHtmlPayload) => {
            if (activeTab === 0) {
                cssTabRef.current?.loadTag(value as string);
            } else if (activeTab === 1) {
                jsTabRef.current?.loadTag(value as string);
            } else {
                htmlTabRef.current?.loadTag(value as CustomHtmlPayload);
            }
        },
        [activeTab]
    );

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
                        <Tab label="Custom HTML" />
                    </Tabs>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip
                        title={
                            activeTab === 0
                                ? "Create CSS Tag"
                                : activeTab === 1
                                  ? "Create JS Tag"
                                  : "Create HTML Tag"
                        }
                    >
                        <IconButton size="small" onClick={handleSave}>
                            <Save fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Load Tag">
                        <IconButton size="small" onClick={handleOpenTagsDialog}>
                            <SellOutlined fontSize="small" />
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
                    {activeTab === 0 && (
                        <CustomCssTab
                            ref={cssTabRef}
                            dialogOpen={dialogOpen}
                            onDialogClose={handleDialogClose}
                        />
                    )}
                    {activeTab === 1 && (
                        <CustomJsTab
                            ref={jsTabRef}
                            dialogOpen={dialogOpen}
                            onDialogClose={handleDialogClose}
                        />
                    )}
                    {activeTab === 2 && (
                        <CustomHTMLTab
                            ref={htmlTabRef}
                            dialogOpen={dialogOpen}
                            onDialogClose={handleDialogClose}
                        />
                    )}
                </Box>
            </Paper>

            <TagsSelectDialog
                open={tagsDialogOpen}
                onClose={() => setTagsDialogOpen(false)}
                tagTypeId={
                    activeTab === 0
                        ? "custom_css"
                        : activeTab === 1
                          ? "custom_js"
                          : "custom_tag_type"
                }
                onTagSelect={handleTagSelect}
            />
        </>
    );
};

