import { useState, useCallback, useRef, useEffect } from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    IconButton,
    Toolbar,
    Tooltip,
    Menu,
    MenuItem
} from "@mui/material";
import { Restore, RestartAlt, Save, MoreVert } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import {
    saveStylingTheme,
    updateStylingTabToDefaultValues,
    updateStylingTabToPreviousValues,
    updateStyleSchemaDefaults
} from "../../../store/actions";
import { ControlsTab } from "./ControlsTab/ControlsTab";
import { StylingTab } from "./StylingTab/StylingTab";

const MIN_HEIGHT = 320;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = MIN_HEIGHT;

export const SettingsPanel = () => {
    const dispatch = useDispatch();
    const { currentPage, styleTabValues } = useSelector(
        (state: RootState) => state.app
    );
    const [activeTab, setActiveTab] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs for optimized drag handling
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);

    // Handle mouse move with RAF for smooth updates
    const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
        // Cancel any pending RAF to prevent buildup
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
        }
        
        rafIdRef.current = requestAnimationFrame(() => {
            const deltaY = startYRef.current - e.clientY;
            const newHeight = Math.min(
                MAX_HEIGHT,
                Math.max(MIN_HEIGHT, startHeightRef.current + deltaY)
            );
            setPanelHeight(newHeight);
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
        startYRef.current = e.clientY;
        startHeightRef.current = panelHeight;
        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";
    }, [panelHeight]);

    const handleResetToPreviousSaved = useCallback(() => {
        dispatch(updateStylingTabToPreviousValues());
    }, [dispatch]);

    const handleResetToDefault = useCallback(() => {
       dispatch(updateStylingTabToDefaultValues());
    }, [dispatch]);

    const handleSave = useCallback(() => {
        if (!currentPage) return;

        try {
            const filteredEntries = Object.entries(styleTabValues).filter(([, value]) => {
                return value && value.isEnabled === true;
              });
            
            const stylingTheme = Object.fromEntries(filteredEntries);

            localStorage.setItem("stylingTheme", JSON.stringify(stylingTheme));

            dispatch(saveStylingTheme(stylingTheme));
        } catch (error) {
            console.error("Failed to save styling data:", error);
        }
    }, [currentPage, styleTabValues, dispatch]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuResetToPreviousSaved = useCallback(() => {
        handleResetToPreviousSaved();
        handleMenuClose();
    }, [handleResetToPreviousSaved]);

    const handleMenuResetToDefault = () => {
        handleResetToDefault();
        handleMenuClose();
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
                        cursor: "ns-resize",
                        zIndex: 9999
                    }}
                />
            )}
            <Paper
                sx={{
                    width: "100%",
                    height: panelHeight,
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "white",
                    borderRadius: 0,
                    borderTop: 1,
                    borderLeft: 0,
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
                        right: 0,
                        height: 6,
                        cursor: "ns-resize",
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
                            right: 0,
                            height: 3,
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
                            dispatch(updateStyleSchemaDefaults());
                        }}
                        variant="scrollable"
                        scrollButtons={false}
                        sx={{
                            minHeight: 36,
                            width: "auto",
                            "& .MuiTab-root": {
                                minHeight: 36,
                                fontSize: 12,
                                fontWeight: 500,
                                textTransform: "none",
                                px: 2
                            }
                        }}
                    >
                        <Tab label="Controls" />
                        <Tab label="Styling" />
                    </Tabs>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title="Save Styling">
                        <IconButton size="small" onClick={handleSave}>
                            <Save fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Options">
                        <IconButton size="small" onClick={handleMenuOpen}>
                            <MoreVert fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right"
                        }}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right"
                        }}
                    >
                        <MenuItem
                            onClick={handleMenuResetToPreviousSaved}
                            sx={{ fontSize: "0.875rem" }}
                        >
                            <Restore sx={{ mr: 1, fontSize: "1rem" }} />
                            Reset to Previous Saved
                        </MenuItem>
                        <MenuItem
                            onClick={handleMenuResetToDefault}
                            sx={{ fontSize: "0.875rem" }}
                        >
                            <RestartAlt sx={{ mr: 1, fontSize: "1rem" }} />
                            Reset to Default
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>

                {/* Tab Content */}
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                    {activeTab === 0 && <ControlsTab />}
                    {activeTab === 1 && <StylingTab />}
                </Box>
            </Paper>
        </>
    );
};
