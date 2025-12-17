import {
    Box,
    IconButton,
    Divider,
    Tooltip
} from "@mui/material";
import { Code, SellOutlined, EditOutlined, BiotechRounded } from "@mui/icons-material";
import IonIcon from "@reacticons/ionicons";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import {
    setZoom,
    setViewport,
    setDirection,
    toggleCodeEditorSidebar,
    toggleTestSidebar,
    setPortalTagsEnabled
} from "../../../store/actions";
import { TagsDialog } from "./TagsDialog/TagsDialog";

export const TopBar = () => {
    const dispatch = useDispatch();
    const { zoom, viewport, direction, codeEditorSidebarOpen, testSidebarOpen, portalTags, portalTagsEnabled } =
        useSelector((state: RootState) => state.app);
    const [tagsDialogOpen, setTagsDialogOpen] = useState(false);

    const handleZoomIn = () => {
        dispatch(setZoom(Math.min(zoom * 1.2, 3)));
    };

    const handleZoomOut = () => {
        dispatch(setZoom(Math.max(zoom / 1.2, 0.25)));
    };

    const handleResetZoom = () => {
        dispatch(setZoom(1));
    };

    const handleViewportChange = (
        newViewport: "desktop" | "tablet" | "mobile"
    ) => {
        dispatch(setViewport(newViewport));
    };

    const handleDirectionToggle = () => {
        dispatch(setDirection(direction === "ltr" ? "rtl" : "ltr"));
    };

    const handleCodeEditorToggle = () => {
        dispatch(toggleCodeEditorSidebar());
    };

    const handleTestSidebarToggle = () => {
        dispatch(toggleTestSidebar());
    };

    const handlePortalTagsToggle = () => {
        dispatch(setPortalTagsEnabled(!portalTagsEnabled));
    };

    const handleOpenTagsDialog = () => {
        setTagsDialogOpen(true);
    };

    return (
        <Box
            sx={{
                height: 40,
                bgcolor: "white",
                borderBottom: 1,
                borderColor: "divider",
                display: "flex",
                backgroundColor: "#F7F9FC",
                alignItems: "center",
                px: 2,
                gap: 1
            }}
        >
            {/* Zoom Controls */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Tooltip title="Zoom In">
                    <IconButton
                        size="small"
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                    >
                        <IonIcon
                            name="add-circle-outline"
                            style={{
                                height: "1.2em",
                                width: "1.2em",
                                display: "flex",
                                alignItems: "center"
                            }}
                        />
                    </IconButton>
                </Tooltip>
                <Box sx={{ ml: "auto", fontSize: 12, color: "text.secondary" }}>
                    {Math.round(zoom * 100)}%
                </Box>
                <Tooltip title="Zoom Out">
                    <IconButton
                        size="small"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.25}
                    >
                        <IonIcon
                            name="remove-circle-outline"
                            style={{
                                height: "1.2em",
                                width: "1.2em",
                                display: "flex",
                                alignItems: "center"
                            }}
                        />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Reset Zoom">
                    <IconButton size="small" onClick={handleResetZoom}>
                        <IonIcon
                            name="refresh-circle-outline"
                            style={{
                                height: "1.2em",
                                width: "1.2em",
                                display: "flex",
                                alignItems: "center"
                            }}
                        />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider
                orientation="vertical"
                flexItem
                sx={{ alignSelf: "center", height: "60%", mx: 1 }}
            />

            {/* Viewport Controls */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "text.secondary"
                }}
            >
                <Tooltip title="Desktop View">
                    <IconButton
                        size="small"
                        onClick={() => handleViewportChange("desktop")}
                        aria-label="desktop"
                        sx={{
                            color:
                                viewport === "desktop"
                                    ? "primary.main"
                                    : "inherit",
                            bgcolor:
                                viewport === "desktop"
                                    ? "primary.50"
                                    : "transparent"
                        }}
                    >
                        <IonIcon
                            name="desktop-outline"
                            style={{
                                display: "flex",
                                alignItems: "center"
                            }}
                        />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Tablet View">
                    <IconButton
                        size="small"
                        onClick={() => handleViewportChange("tablet")}
                        aria-label="tablet"
                        sx={{
                            color:
                                viewport === "tablet"
                                    ? "primary.main"
                                    : "inherit",
                            bgcolor:
                                viewport === "tablet"
                                    ? "primary.50"
                                    : "transparent"
                        }}
                    >
                        <IonIcon
                            name="tablet-landscape-outline"
                            style={{
                                display: "flex",
                                alignItems: "center"
                            }}
                        />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Mobile View">
                    <IconButton
                        size="small"
                        onClick={() => handleViewportChange("mobile")}
                        aria-label="mobile"
                        sx={{
                            color:
                                viewport === "mobile"
                                    ? "primary.main"
                                    : "inherit",
                            bgcolor:
                                viewport === "mobile"
                                    ? "primary.50"
                                    : "transparent"
                        }}
                    >
                        <IonIcon
                            name="phone-portrait-outline"
                            style={{
                                display: "flex",
                                alignItems: "center"
                            }}
                        />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider
                orientation="vertical"
                flexItem
                sx={{ alignSelf: "center", height: "60%", mx: 1 }}
            />

            {/* Direction Toggle */}
            <Tooltip title={`Switch to ${direction === "ltr" ? "RTL" : "LTR"}`}>
                <IconButton
                    size="small"
                    onClick={handleDirectionToggle}
                    sx={{
                        color: direction === "rtl" ? "primary.main" : "inherit",
                        bgcolor:
                            direction === "rtl" ? "primary.50" : "transparent"
                    }}
                >
                    <IonIcon
                        name="swap-horizontal-outline"
                        style={{
                            display: "flex",
                            alignItems: "center"
                        }}
                    />
                </IconButton>
            </Tooltip>

            <Divider
                orientation="vertical"
                flexItem
                sx={{ alignSelf: "center", height: "60%", mx: 1 }}
            />

            {/* Portal Tags Controls */}
            <Box 
                sx={{ 
                    display: "flex", 
                    alignItems: "center",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    overflow: "hidden"
                }}
            >
                <Tooltip title={portalTagsEnabled ? "Disable Portal Tags" : "Enable Portal Tags"}>
                    <IconButton
                        size="small"
                        onClick={handlePortalTagsToggle}
                        sx={{
                            color: portalTagsEnabled ? "primary.main" : "inherit",
                            bgcolor: portalTagsEnabled ? "primary.50" : "transparent",
                            borderRadius: 0,
                            borderRight: 1,
                            borderColor: "divider"
                        }}
                    >
                        <SellOutlined fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Edit Portal Tags">
                    <IconButton
                        size="small"
                        onClick={handleOpenTagsDialog}
                        sx={{
                            borderRadius: 0
                        }}
                    >
                        <EditOutlined fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider
                orientation="vertical"
                flexItem
                sx={{ alignSelf: "center", height: "60%", mx: 1 }}
            />

            {/* Code Editor Toggle */}
            <Tooltip title="Custom CSS / JS">
                <IconButton
                    size="small"
                    onClick={handleCodeEditorToggle}
                    sx={{
                        color: codeEditorSidebarOpen ? "primary.main" : "inherit",
                        bgcolor: codeEditorSidebarOpen ? "primary.50" : "transparent"
                    }}
                >
                    <Code fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider
                orientation="vertical"
                flexItem
                sx={{ alignSelf: "center", height: "60%", mx: 1 }}
            />

            {/* Test Sidebar Toggle */}
            <Tooltip title="Testing Tools">
                <IconButton
                    size="small"
                    onClick={handleTestSidebarToggle}
                    sx={{
                        color: testSidebarOpen ? "primary.main" : "inherit",
                        bgcolor: testSidebarOpen ? "primary.50" : "transparent"
                    }}
                >
                    <BiotechRounded fontSize="small" />
                </IconButton>
            </Tooltip>

            <TagsDialog
                open={tagsDialogOpen}
                onClose={() => setTagsDialogOpen(false)}
                portalTags={portalTags}
            />
        </Box>
    );
};
