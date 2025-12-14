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
import { useDispatch } from "react-redux";

import {
    toggleCodeEditorSidebar
} from "../../../store/actions";
import { CustomCssTab } from "./CustomCssTab/CustomCssTab";
import { CustomJsTab } from "./CustomJsTab/CustomJsTab";

export const CodeEditorSidebar = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);

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
        <Paper
            sx={{
                width: 420,
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
                {activeTab === 0 && <CustomCssTab dialogOpen={dialogOpen} onDialogClose={handleDialogClose} />}
                {activeTab === 1 && <CustomJsTab dialogOpen={dialogOpen} onDialogClose={handleDialogClose} />}
            </Box>
        </Paper>
    );
};

