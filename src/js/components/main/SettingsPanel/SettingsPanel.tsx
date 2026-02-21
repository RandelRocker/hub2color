import {
    useState,
    useCallback,
    useRef,
    useEffect,
    useMemo,
    lazy,
    Suspense
} from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    IconButton,
    Toolbar,
    Tooltip,
    Menu,
    MenuItem,
    CircularProgress
} from "@mui/material";
import {
    Restore,
    RestartAlt,
    Save,
    MoreHoriz,
    FilterList
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import {
    saveStylingTheme,
    updateStylingTabToDefaultValues,
    updateStylingTabToPreviousValues,
    updateStyleSchemaDefaults
} from "../../../store/actions";
import { TStoredThemeStyles } from "../../../store/types";

const ControlsTab = lazy(() =>
    import(
        /* webpackChunkName: "controls-tab" */ "./ControlsTab/ControlsTab"
    ).then((module) => {
        return { default: module.ControlsTab };
    })
);
const StylingTab = lazy(() =>
    import(
        /* webpackChunkName: "styling-tab" */ "./StylingTab/StylingTab"
    ).then((module) => {
        return { default: module.StylingTab };
    })
);
const ServerResponsesTab = lazy(() =>
    import(
        /* webpackChunkName: "server-responses-tab" */ "./ServerResponsesTab/ServerResponsesTab"
    ).then((module) => {
        return { default: module.ServerResponsesTab };
    })
);

const MIN_HEIGHT = 320;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = MIN_HEIGHT;

type SettingsTabKey = "controls" | "styling" | "serverResponses";

export const SettingsPanel = () => {
    const dispatch = useDispatch();
    const { currentPage, styleTabValues, savedTheme, componentSchema } = useSelector(
        (state: RootState) => state.app
    );
    
    // Check if each tab is available
    const hasControls = componentSchema?.controls && componentSchema.controls.length > 0;
    const hasStyles = componentSchema?.styles && componentSchema.styles.length > 0;
    const hasServerResponses = useMemo(() => {
        if (typeof window === "undefined") {
            return false;
        }

        const isServerResponsesTabEnabled =
            localStorage.getItem("isServerResponsesTabEnabled") !== null;
        const mocks = componentSchema?.mocks;
        const hasMocksSchema =
            Array.isArray(mocks) && mocks.length > 0;

        return isServerResponsesTabEnabled && hasMocksSchema;
    }, [componentSchema?.mocks]);

    const visibleTabs = useMemo(
        () => {
            const tabs: { key: SettingsTabKey; label: string }[] = [];

            if (hasControls) {
                tabs.push({ key: "controls", label: "Controls" });
            }

            if (hasStyles) {
                tabs.push({ key: "styling", label: "Styling" });
            }

            if (hasServerResponses) {
                tabs.push({ key: "serverResponses", label: "Server responses" });
            }

            return tabs;
        },
        [hasControls, hasServerResponses, hasStyles]
    );

    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (activeTab >= visibleTabs.length && visibleTabs.length > 0) {
            setActiveTab(0);
        }
    }, [activeTab, visibleTabs.length]);

    const activeTabConfig = visibleTabs[activeTab];
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
        null
    );
    const [stylesFilter, setStylesFilter] = useState<
        "all" | "colors" | "images" | "changed"
    >("all");
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

    const handleResizeStart = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            startYRef.current = e.clientY;
            startHeightRef.current = panelHeight;
            document.body.style.cursor = "ns-resize";
            document.body.style.userSelect = "none";
        },
        [panelHeight]
    );

    const handleResetToPreviousSaved = useCallback(() => {
        dispatch(updateStylingTabToPreviousValues());
    }, [dispatch]);

    const handleResetToDefault = useCallback(() => {
        dispatch(updateStylingTabToDefaultValues());
    }, [dispatch]);

    const handleSave = useCallback(() => {
        if (!currentPage) return;

        try {
            const stylingTheme: TStoredThemeStyles = { ...savedTheme };

            Object.entries(styleTabValues).forEach(([key, value]) => {
                if (value && value.isEnabled === true) {
                    stylingTheme[key] = String(value.value);
                } else {
                    delete stylingTheme[key];
                }
            });

            localStorage.setItem("stylingTheme", JSON.stringify(stylingTheme));
            dispatch(saveStylingTheme(stylingTheme));
        } catch (error) {
            console.error("Failed to save styling data:", error);
        }
    }, [currentPage, savedTheme, styleTabValues, dispatch]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterMenuClose = () => {
        setFilterAnchorEl(null);
    };

    const handleSetStylesFilter = (
        filter: "all" | "colors" | "images" | "changed"
    ) => {
        setStylesFilter(filter);
        handleFilterMenuClose();
    };

    const handleMenuResetToPreviousSaved = useCallback(() => {
        handleResetToPreviousSaved();
        handleMenuClose();
    }, [handleResetToPreviousSaved]);

    const handleMenuResetToDefault = () => {
        handleResetToDefault();
        handleMenuClose();
    };

    // Hide the entire panel if no tabs are available
    if (visibleTabs.length === 0) {
        return null;
    }

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
                            {visibleTabs.map((tab) => (
                                <Tab key={tab.key} label={tab.label} />
                            ))}
                        </Tabs>
                    </Box>

                    <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                        {activeTabConfig?.key === "styling" && (
                            <>
                                <Tooltip title="Filter Styles">
                                    <IconButton
                                        size="small"
                                        onClick={handleFilterMenuOpen}
                                    >
                                        <FilterList
                                            fontSize="small"
                                            sx={{
                                                color:
                                                    stylesFilter !== "all"
                                                        ? "#1976d2"
                                                        : "inherit"
                                            }}
                                        />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    anchorEl={filterAnchorEl}
                                    open={Boolean(filterAnchorEl)}
                                    onClose={handleFilterMenuClose}
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
                                        selected={stylesFilter === "all"}
                                        onClick={() =>
                                            handleSetStylesFilter("all")
                                        }
                                        sx={{
                                            fontSize: "0.875rem"
                                        }}
                                    >
                                        Show all styles
                                    </MenuItem>
                                    <MenuItem
                                        selected={stylesFilter === "colors"}
                                        onClick={() =>
                                            handleSetStylesFilter("colors")
                                        }
                                        sx={{
                                            fontSize: "0.875rem"
                                        }}
                                    >
                                        Show colors only
                                    </MenuItem>
                                    <MenuItem
                                        selected={stylesFilter === "images"}
                                        onClick={() =>
                                            handleSetStylesFilter("images")
                                        }
                                        sx={{
                                            fontSize: "0.875rem"
                                        }}
                                    >
                                        Show images only
                                    </MenuItem>
                                    <MenuItem
                                        selected={stylesFilter === "changed"}
                                        onClick={() =>
                                            handleSetStylesFilter("changed")
                                        }
                                        sx={{
                                            fontSize: "0.875rem"
                                        }}
                                    >
                                        Show changed styles only
                                    </MenuItem>
                                </Menu>
                                <Tooltip title="Save Styling">
                                    <IconButton
                                        size="small"
                                        onClick={handleSave}
                                    >
                                        <Save fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Reset Options">
                                    <IconButton
                                        size="small"
                                        onClick={handleMenuOpen}
                                    >
                                        <MoreHoriz fontSize="small" />
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
                                        <Restore
                                            sx={{ mr: 1, fontSize: "1rem" }}
                                        />
                                        Reset to Previous Saved
                                    </MenuItem>
                                    <MenuItem
                                        onClick={handleMenuResetToDefault}
                                        sx={{ fontSize: "0.875rem" }}
                                    >
                                        <RestartAlt
                                            sx={{ mr: 1, fontSize: "1rem" }}
                                        />
                                        Reset to Default
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                </Toolbar>

                {/* Tab Content */}
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                    <Suspense
                        fallback={
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "100%"
                                }}
                            >
                                <CircularProgress size={24} />
                            </Box>
                        }
                    >
                        {(() => {
                            if (activeTabConfig?.key === "controls" && hasControls) {
                                return <ControlsTab />;
                            } else if (
                                activeTabConfig?.key === "styling" &&
                                hasStyles
                            ) {
                                return <StylingTab stylesFilter={stylesFilter} />;
                            } else if (
                                activeTabConfig?.key === "serverResponses" &&
                                hasServerResponses
                            ) {
                                return <ServerResponsesTab />;
                            }
                            return null;
                        })()}
                    </Suspense>
                </Box>
            </Paper>
        </>
    );
};
