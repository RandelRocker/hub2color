import {
    Box,
    Button,
    Divider,
    IconButton,
    Input,
    Popover,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { Code, Colorize, EditOutlined, FormatColorFillRounded, ImageOutlined, BiotechRounded, OpenInNewRounded, RefreshRounded, ScreenRotation, SellOutlined } from "@mui/icons-material";
import IonIcon from "@reacticons/ionicons";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RgbaColorPicker } from "react-colorful";
import type { RgbaColor } from "react-colorful";

import { RootState } from "../../../store";
import * as config from "../../../../../config";
import {
    refreshIframe,
    setDirection,
    setPortalTagsEnabled,
    setPreviewBackgroundColor,
    setReferenceOverlay,
    setViewport,
    setViewportRotated,
    setZoom,
    toggleCodeEditorSidebar,
    toggleTestSidebar
} from "../../../store/actions";
import { createReferenceOverlayFromFile } from "../../../utils/referenceOverlay";
import { TagsDialog } from "./TagsDialog/TagsDialog";

// Helper functions for color conversion
const rgbaStringToRgbaColor = (rgba: string): RgbaColor => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
            a: match[4] ? parseFloat(match[4]) : 1
        };
    }
    // Default fallback
    return { r: 245, g: 245, b: 245, a: 1 };
};

const rgbaColorToRgbaString = (color: RgbaColor): string => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};

const DEFAULT_PREVIEW_BACKGROUND_COLOR = "rgba(255, 255, 255, 1)";

export const TopBar = () => {
    const dispatch = useDispatch();
    const { zoom, viewport, viewportRotated, direction, codeEditorSidebarOpen, testSidebarOpen, portalTags, portalTagsEnabled, previewBackgroundColor, referenceOverlay, currentPage } =
        useSelector((state: RootState) => state.app);
    const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
    const [bgColorAnchorEl, setBgColorAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [localBgColor, setLocalBgColor] = useState<RgbaColor>(() => 
        rgbaStringToRgbaColor(previewBackgroundColor)
    );
    const [hexInput, setHexInput] = useState(() => 
        `#${rgbaStringToRgbaColor(previewBackgroundColor).r.toString(16).padStart(2, "0")}${rgbaStringToRgbaColor(previewBackgroundColor).g.toString(16).padStart(2, "0")}${rgbaStringToRgbaColor(previewBackgroundColor).b.toString(16).padStart(2, "0")}`
    );
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const bgColorPickerOpen = Boolean(bgColorAnchorEl);

    // Update local color when prop changes
    useEffect(() => {
        const color = rgbaStringToRgbaColor(previewBackgroundColor);
        setLocalBgColor(color);
        setHexInput(`#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`);
    }, [previewBackgroundColor]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

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

    const handleBgColorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setBgColorAnchorEl(event.currentTarget);
    };

    const handleBgColorClose = () => {
        setBgColorAnchorEl(null);
    };

    const handleBgColorChange = (color: RgbaColor) => {
        setLocalBgColor(color);
        setHexInput(`#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`);
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the dispatch
        timeoutRef.current = setTimeout(() => {
            dispatch(setPreviewBackgroundColor(rgbaColorToRgbaString(color)));
        }, 150);
    };

    const handleRemoveBgColor = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        const defaultColor = rgbaStringToRgbaColor(DEFAULT_PREVIEW_BACKGROUND_COLOR);
        setLocalBgColor(defaultColor);
        setHexInput(`#${defaultColor.r.toString(16).padStart(2, "0")}${defaultColor.g.toString(16).padStart(2, "0")}${defaultColor.b.toString(16).padStart(2, "0")}`);
        dispatch(setPreviewBackgroundColor(DEFAULT_PREVIEW_BACKGROUND_COLOR));
    };

    const isEyeDropperSupported =
        typeof window !== "undefined" && "EyeDropper" in window;

    const handleBgColorEyedropperClick = async () => {
        if (!isEyeDropperSupported) return;
        try {
            const EyeDropperConstructor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
            const eyeDropper = new EyeDropperConstructor();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex;
            const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (hexMatch) {
                const newColor = {
                    r: parseInt(hexMatch[1], 16),
                    g: parseInt(hexMatch[2], 16),
                    b: parseInt(hexMatch[3], 16),
                    a: localBgColor.a
                };
                setLocalBgColor(newColor);
                setHexInput(`#${hexMatch[1]}${hexMatch[2]}${hexMatch[3]}`);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                dispatch(setPreviewBackgroundColor(rgbaColorToRgbaString(newColor)));
            }
        } catch {
            // User cancelled or error - ignore
        }
    };

    const handleImageFile = useCallback(async (file: File) => {
        const overlay = await createReferenceOverlayFromFile(file);
        if (!overlay) {
            return;
        }
        dispatch(setReferenceOverlay(overlay));
    }, [dispatch]);

    const handleOpenImagePicker = () => {
        imageInputRef.current?.click();
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        await handleImageFile(file);
        event.target.value = "";
    };

    const handleRefreshIframe = () => {
        dispatch(refreshIframe());
    };

    const handleOpenInNewTab = () => {
        if (!currentPage) return;

        let url = `${config.HUB2COLOR_PUBLIC_PATH}/${currentPage}`;

        if (viewport === "mobile") {
            url += "?hideAdminControls=1&emulate=mobile";
        } else if (viewport === "tablet") {
            url += "?hideAdminControls=1&emulate=tablet";
        }

        window.open(url, "_blank");
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
                        sx={{
                            color: "rgba(0,0,0,0.8)"
                        }}
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
                        sx={{
                            color: "rgba(0,0,0,0.8)"
                        }}
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
                    <IconButton 
                        size="small" 
                        onClick={handleResetZoom}
                        sx={{
                            color: "rgba(0,0,0,0.8)"
                        }}
                    >
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
            
            {/* Direction Toggle */}
            <Tooltip title={`Switch to ${direction === "ltr" ? "RTL" : "LTR"}`}>
                <IconButton
                    size="small"
                    onClick={handleDirectionToggle}
                    sx={{
                        color: direction === "rtl" ? "primary.main" : "rgba(0,0,0,0.8)",
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

            {/* Refresh Iframe */}
            <Tooltip title="Refresh Preview">
                <span>
                    <IconButton
                        size="small"
                        onClick={handleRefreshIframe}
                        disabled={!currentPage}
                        sx={{
                            color: "rgba(0,0,0,0.8)"
                        }}
                    >
                        <RefreshRounded fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>

            <Divider
                orientation="vertical"
                flexItem
                sx={{ alignSelf: "center", height: "60%", mx: 1 }}
            />

            {/* Background Color Picker */}
            <Tooltip title="Preview Background Color">
                <IconButton
                    size="small"
                    onClick={handleBgColorClick}
                    sx={{
                        color: bgColorPickerOpen ? "primary.main" : "rgba(0,0,0,0.6)",
                        bgcolor: bgColorPickerOpen ? "primary.50" : "transparent"
                    }}
                >
                    <FormatColorFillRounded fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title={referenceOverlay ? "Change Reference Image" : "Add Reference Image"}>
                <IconButton
                    size="small"
                    onClick={handleOpenImagePicker}
                    sx={{
                        color: referenceOverlay ? "primary.main" : "rgba(0,0,0,0.6)",
                        bgcolor: referenceOverlay ? "primary.50" : "transparent"
                    }}
                >
                    <ImageOutlined fontSize="small" />
                </IconButton>
            </Tooltip>

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
                                    : "rgba(0,0,0,0.8)",
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
                                    : "rgba(0,0,0,0.8)",
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
                                    : "rgba(0,0,0,0.8)",
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
                <Tooltip title="Rotate screen">
                    <IconButton
                        size="small"
                        onClick={() =>
                            viewport !== "desktop" && dispatch(setViewportRotated(!viewportRotated))
                        }
                        aria-label="rotate screen"
                        sx={{
                            color:
                                viewport !== "desktop" && viewportRotated
                                    ? "primary.main"
                                    : "rgba(0,0,0,0.8)",
                            bgcolor:
                                viewport !== "desktop" && viewportRotated
                                    ? "primary.50"
                                    : "transparent"
                        }}
                    >
                        <ScreenRotation
                            sx={{
                                width: '0.8em',
                                height: '0.8em',
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
                            color: portalTagsEnabled ? "primary.main" : "rgba(0,0,0,0.8)",
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
                            borderRadius: 0,
                            color: "rgba(0,0,0,0.8)"
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
                        color: codeEditorSidebarOpen ? "primary.main" : "rgba(0,0,0,0.8)",
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
            {/* <Tooltip title="Testing Tools">
                <IconButton
                    size="small"
                    onClick={handleTestSidebarToggle}
                    sx={{
                        color: testSidebarOpen ? "primary.main" : "rgba(0,0,0,0.8)",
                        bgcolor: testSidebarOpen ? "primary.50" : "transparent"
                    }}
                >
                    <BiotechRounded fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider
                orientation="vertical"
                flexItem
                sx={{ alignSelf: "center", height: "60%", mx: 1 }}
            /> */}

            {/* Open in New Tab */}
            <Tooltip title="Open in New Tab">
                <span>
                    <IconButton
                        size="small"
                        onClick={handleOpenInNewTab}
                        disabled={!currentPage}
                        sx={{
                            color: "rgba(0,0,0,0.8)"
                        }}
                    >
                        <OpenInNewRounded fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>

            <TagsDialog
                open={tagsDialogOpen}
                onClose={() => setTagsDialogOpen(false)}
                portalTags={portalTags}
            />

            {/* Background Color Picker Popover */}
            <Popover
                open={bgColorPickerOpen}
                anchorEl={bgColorAnchorEl}
                onClose={handleBgColorClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                            Color
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1
                            }}
                        >
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: rgbaColorToRgbaString(localBgColor),
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 1
                                }}
                            />
                            <TextField
                                size="small"
                                value={hexInput}
                                onChange={(e) => {
                                    const hex = e.target.value;
                                    setHexInput(hex);
                                    // Only update color if valid hex
                                    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
                                        const normalizedHex = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
                                        const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
                                        if (hexMatch) {
                                            const newColor = {
                                                r: parseInt(hexMatch[1], 16),
                                                g: parseInt(hexMatch[2], 16),
                                                b: parseInt(hexMatch[3], 16),
                                                a: localBgColor.a
                                            };
                                            setLocalBgColor(newColor);
                                            
                                            // Clear existing timeout
                                            if (timeoutRef.current) {
                                                clearTimeout(timeoutRef.current);
                                            }

                                            // Debounce the dispatch
                                            timeoutRef.current = setTimeout(() => {
                                                dispatch(setPreviewBackgroundColor(rgbaColorToRgbaString(newColor)));
                                            }, 150);
                                        }
                                    }
                                }}
                                onBlur={(e) => {
                                    // Validate and fix hex on blur
                                    let hex = e.target.value.trim();
                                    if (!hex.startsWith("#")) {
                                        hex = "#" + hex;
                                    }
                                    // Normalize 3-digit hex to 6-digit
                                    if (/^#([A-Fa-f0-9]{3})$/.test(hex)) {
                                        hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                                    }
                                    // If invalid, revert to current color
                                    if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) {
                                        setHexInput(`#${localBgColor.r.toString(16).padStart(2, "0")}${localBgColor.g.toString(16).padStart(2, "0")}${localBgColor.b.toString(16).padStart(2, "0")}`);
                                        return;
                                    }
                                    setHexInput(hex);
                                }}
                                sx={{ flex: 1 }}
                                placeholder="#000000"
                            />
                            {isEyeDropperSupported && (
                                <Tooltip title="Pick color from page">
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={handleBgColorEyedropperClick}
                                            sx={{ p: 0.5 }}
                                            aria-label="Pick color from page"
                                        >
                                            <Colorize fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>
                    <Box>
                        <RgbaColorPicker
                            color={localBgColor}
                            onChange={handleBgColorChange}
                            style={{
                                width: "100%"
                            }}
                        />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleRemoveBgColor}
                            fullWidth
                        >
                            Remove color
                        </Button>
                    </Box>
                </Box>
            </Popover>
            <Input
                inputRef={imageInputRef}
                type="file"
                inputProps={{ accept: "image/*" }}
                onChange={handleImageChange}
                sx={{ display: "none" }}
            />
        </Box>
    );
};
