import { useState, useCallback } from "react";
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
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import CallToActionOutlinedIcon from "@mui/icons-material/CallToActionOutlined";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import {
    setPanelDock,
    setSavedTheme,
    updateStylingTheme,
    updateCssVariables,
    updateStyleSchemaDefaults
} from "../../../store/actions";
import { StyleField, StyleGroup, StylingTheme, CssVariables } from "../../../store/types";
import { ControlsTab } from "./ControlsTab/ControlsTab";
import { StylingTab } from "./StylingTab/StylingTab";
import { CustomCssTab } from "./CustomCssTab/CustomCssTab";
import { CustomJsTab } from "./CustomJsTab/CustomJsTab";

export const SettingsPanel = () => {
    const dispatch = useDispatch();
    const { panelDock, currentPage, stylingTheme, cssVariables, savedTheme, styleSchema } = useSelector(
        (state: RootState) => state.app
    );
    const [activeTab, setActiveTab] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const isBottomDock = panelDock === "bottom";

    const handleResetToPreviousSaved = useCallback(() => {
        if (savedTheme?.themeStyles) {
            dispatch(updateStylingTheme(savedTheme.themeStyles));
        }
        if (savedTheme?.cssVariableStyles) {
            dispatch(updateCssVariables(savedTheme.cssVariableStyles));
        }
        if (savedTheme?.themeStyles || savedTheme?.cssVariableStyles) {
            dispatch(updateStyleSchemaDefaults());
        }
    }, [savedTheme, dispatch]);

    const handleResetToDefault = useCallback(() => {
        if (!styleSchema?.style) return;

        const collectDefaultTheme = (items: (StyleField | StyleGroup)[]): StylingTheme => {
            const defaultTheme: StylingTheme = {};

            items.forEach((item) => {
                if (
                    "id" in item &&
                    item.type !== "group" &&
                    item.type !== "sectionTitle"
                ) {
                    const field = item as StyleField;

                    if (field.themeKey && field.defaultValue !== undefined) {
                        defaultTheme[field.themeKey] = {
                            value: field.defaultValue,
                            isEnabled: false
                        };
                    }
                }
                if ("fields" in item && item.fields) {
                    const nestedDefaults = collectDefaultTheme(item.fields);
                    Object.assign(defaultTheme, nestedDefaults);
                }
            });

            return defaultTheme;
        };

        const collectDefaultCssVariables = (items: (StyleField | StyleGroup)[]): CssVariables => {
            const defaultCssVars: CssVariables = {};

            items.forEach((item) => {
                if (
                    "id" in item &&
                    item.type !== "group" &&
                    item.type !== "sectionTitle"
                ) {
                    const field = item as StyleField;

                    if (field.cssVariable && field.defaultValue !== undefined) {
                        defaultCssVars[field.cssVariable] = {
                            value: field.defaultValue,
                            isEnabled: false
                        };
                    }
                }
                if ("fields" in item && item.fields) {
                    const nestedDefaults = collectDefaultCssVariables(item.fields);
                    Object.assign(defaultCssVars, nestedDefaults);
                }
            });

            return defaultCssVars;
        };

        const defaultTheme = collectDefaultTheme(styleSchema.style);
        const defaultCssVars = collectDefaultCssVariables(styleSchema.style);
        dispatch(updateStylingTheme(defaultTheme));
        dispatch(updateCssVariables(defaultCssVars));
        dispatch(updateStyleSchemaDefaults());
    }, [styleSchema, dispatch]);

    const handleSave = useCallback(() => {
        if (!currentPage) return;

        try {
            const themeToSave = {
                themeStyles: {
                    ...stylingTheme
                },
                cssVariableStyles: {
                    ...cssVariables
                }
            };
            // Store back to localStorage
            localStorage.setItem("stylingTheme", JSON.stringify(themeToSave));

            dispatch(setSavedTheme(themeToSave));

            console.log(`Saved styling data for ${currentPage}:`, {
                stylingTheme,
                cssVariables
            });
        } catch (error) {
            console.error("Failed to save styling data:", error);
        }
    }, [currentPage, stylingTheme, cssVariables, dispatch]);

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

    const handleDockToggle = () => {
        dispatch(setPanelDock(isBottomDock ? "right" : "bottom"));
        handleMenuClose();
    };

    const panelWidth = isBottomDock ? "100%" : 360;
    const panelHeight = isBottomDock ? 320 : "100%";

    return (
        <Paper
            sx={{
                width: panelWidth,
                height: panelHeight,
                display: "flex",
                flexDirection: "column",
                bgcolor: "white",
                borderRadius: 0,
                borderTop: isBottomDock ? 1 : 0,
                borderLeft: isBottomDock ? 0 : 1,
                borderColor: "divider",
                overflow: "hidden",
                boxShadow: "none"
            }}
        >
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
                            width: isBottomDock ? "auto" : "230px",
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
                        <Tab label="Custom CSS" />
                        <Tab label="Custom JS" />
                    </Tabs>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title="Save">
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
                            onClick={handleDockToggle}
                            sx={{ fontSize: "0.875rem" }}
                        >
                            {isBottomDock ? (
                                <ViewSidebarOutlinedIcon
                                    sx={{ mr: 1, fontSize: "1rem" }}
                                />
                            ) : (
                                <CallToActionOutlinedIcon
                                    sx={{ mr: 1, fontSize: "1rem" }}
                                />
                            )}
                            {`Dock ${isBottomDock ? "Right" : "Bottom"}`}
                        </MenuItem>
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
                {activeTab === 2 && <CustomCssTab />}
                {activeTab === 3 && <CustomJsTab />}
            </Box>
        </Paper>
    );
};
