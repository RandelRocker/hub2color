import {
    Box,
    IconButton,
    Divider,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    SelectChangeEvent
} from "@mui/material";
import IonIcon from "@reacticons/ionicons";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import {
    setZoom,
    setViewport,
    setDirection,
    setSelectedTemplate
} from "../../../store/actions";

export const TopBar = () => {
    const dispatch = useDispatch();
    const { zoom, viewport, direction, controlsSchema, selectedTemplate } =
        useSelector((state: RootState) => state.app);

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

    const handleTemplateChange = (event: SelectChangeEvent) => {
        dispatch(setSelectedTemplate(event.target.value));
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

            {controlsSchema?.templates &&
                controlsSchema.templates.length > 1 && (
                    <>
                        <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ alignSelf: "center", height: "60%", mx: 1 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                                name="template"
                                value={
                                    selectedTemplate ||
                                    controlsSchema.templates[0].templateName
                                }
                                onChange={handleTemplateChange}
                                displayEmpty
                                variant="standard"
                                sx={{
                                    fontSize: "0.875rem",
                                    "&:before": {
                                        borderBottom: "none"
                                    },
                                    "&:hover:not(.Mui-disabled):before": {
                                        borderBottom: "none"
                                    },
                                    "&:after": {
                                        borderBottom: "none"
                                    },
                                    "& .MuiInput-input": {
                                        paddingBottom: 0
                                    },
                                    "& .MuiInput-input:focus": {
                                        backgroundColor: "transparent"
                                    }
                                }}
                            >
                                {controlsSchema.templates.map((template) => (
                                    <MenuItem
                                        key={template.templateName}
                                        value={template.templateName}
                                        sx={{ fontSize: "0.875rem" }}
                                    >
                                        {template.templateLabel}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </>
                )}
        </Box>
    );
};
