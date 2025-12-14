import { useState, useCallback } from "react";
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
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import {
    saveStylingTheme,
    toggleCodeEditorSidebar
} from "../../../store/actions";
import { CustomCssTab } from "./CustomCssTab/CustomCssTab";
import { CustomJsTab } from "./CustomJsTab/CustomJsTab";

export const CodeEditorSidebar = () => {
    const dispatch = useDispatch();
    const { currentPage, styleTabValues } = useSelector(
        (state: RootState) => state.app
    );
    const [activeTab, setActiveTab] = useState(0);


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

    const handleClose = () => {
        dispatch(toggleCodeEditorSidebar());
    };

    return (
        <Paper
            sx={{
                width: 360,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "white",
                borderRadius: 0,
                borderTop: 0,
                borderLeft: 1,
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
                        }}
                        variant="scrollable"
                        scrollButtons={false}
                        sx={{
                            minHeight: 36,
                            width: "230px",
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
                    <Tooltip title="Save">
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
                {activeTab === 0 && <CustomCssTab />}
                {activeTab === 1 && <CustomJsTab />}
            </Box>
        </Paper>
    );
};

