import { useState } from "react";
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
import { setPanelDock } from "../../../store/actions";
import { ControlsTab } from "./ControlsTab/ControlsTab";
import { StylingTab } from "./StylingTab/StylingTab";
import { CustomCssTab } from "./CustomCssTab/CustomCssTab";
import { CustomJsTab } from "./CustomJsTab/CustomJsTab";

export const SettingsPanel = () => {
    const dispatch = useDispatch();
    const { panelDock, currentPage } = useSelector(
        (state: RootState) => state.app
    );
    const [activeTab, setActiveTab] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const isBottomDock = panelDock === "bottom";

    const handleResetToPrevious = () => {
        if (!currentPage) return;

        const saved = localStorage.getItem(`msb:state:${currentPage}`);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // Dispatch actions to restore state
                console.log("Restore previous saved state:", state);
            } catch (error) {
                console.error("Failed to parse saved state:", error);
            }
        }
    };

    const handleResetToDefault = () => {
        // Reset to schema defaults
        console.log("Reset to schema defaults");
    };

    const handleSave = () => {
        if (!currentPage) return;

        // Save current state to localStorage
        const state = {
            // We'll implement this when we have all the state
        };
        localStorage.setItem(`msb:state:${currentPage}`, JSON.stringify(state));
        console.log("Save current state");
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuResetToPrevious = () => {
        handleResetToPrevious();
        handleMenuClose();
    };

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
                    "@media (min-width:600px)": {
                        paddingRight: "16px",
                        paddingLeft: "16px"
                    }
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
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
                            onClick={handleMenuResetToPrevious}
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
