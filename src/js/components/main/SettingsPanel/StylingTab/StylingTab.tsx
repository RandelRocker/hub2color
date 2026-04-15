import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
    Box,
    Typography,
    Checkbox,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    Switch,
    Select,
    MenuItem,
    FormControl,
    Slider,
    RadioGroup,
    FormControlLabel,
    Radio,
    IconButton,
    Menu,
    Tooltip,
    Popover,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Colorize, MoreHoriz, Restore, RestartAlt, Edit as EditIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { RgbaColorPicker } from "react-colorful";
import type { RgbaColor } from "react-colorful";

import { RootState } from "../../../../store";
import { updateStylingTabValues, updateStylingTabValuesWithDefault, setStylingTabUIState, updateStylingTabDefaultValues } from "../../../../store/actions";
import { StylingTabValues, StyleGroup, StyleField } from "../../../../store/types";
import { FontManagerDialog } from "./FontManagerDialog/FontManagerDialog";

type StylesFilter = "all" | "colors" | "images" | "changed";

const isStyleGroup = (item: StyleField | StyleGroup): item is StyleGroup => {
    return (
        (item as StyleGroup).type === "group" ||
        (item as StyleGroup).type === "sectionTitle" ||
        (item as StyleGroup).type === "groupTitle"
    );
};

const isContentItem = (item: StyleField | StyleGroup): boolean => {
    if (isStyleGroup(item)) {
        return item.type === "group";
    }

    return true;
};

const pruneOrphanHeadings = (items: (StyleField | StyleGroup)[]): (StyleField | StyleGroup)[] => {
    if (items.length === 0) return items;

    const isSectionTitle = (item: StyleField | StyleGroup): item is StyleGroup =>
        isStyleGroup(item) && item.type === "sectionTitle";

    // For now we only apply the "orphan header" rule to sectionTitle (per request).
    const result: (StyleField | StyleGroup)[] = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (!isSectionTitle(item)) {
            result.push(item);
            continue;
        }

        let hasContentBelow = false;
        for (let j = i + 1; j < items.length; j++) {
            const next = items[j];
            if (isSectionTitle(next)) break;
            if (isContentItem(next)) {
                hasContentBelow = true;
                break;
            }
        }

        if (hasContentBelow) {
            result.push(item);
        }
    }

    return result;
};

const filterStyleItems = (
    items: (StyleField | StyleGroup)[],
    stylesFilter: Exclude<StylesFilter, "all">,
    enabledCssVariables?: Set<string>
): (StyleField | StyleGroup)[] => {
    const matchesFilter = (field: StyleField) => {
        if (stylesFilter === "colors") return field.type === "color";
        if (stylesFilter === "images") return field.type === "image" || field.type === "staticImage";
        if (stylesFilter === "changed")
            return enabledCssVariables?.has(field.cssVariable) ?? false;
        return true;
    };

    const filtered = items
        .map((item) => {
            if (isStyleGroup(item)) {
                if (item.type === "group") {
                    const filteredFields = filterStyleItems(
                        item.fields || [],
                        stylesFilter,
                        enabledCssVariables
                    );

                    if (filteredFields.length === 0) return null;

                    return {
                        ...item,
                        fields: pruneOrphanHeadings(filteredFields)
                    } as StyleGroup;
                }

                // Keep headings for now; they get pruned later if orphaned.
                return item;
            }

            return matchesFilter(item) ? item : null;
        })
        .filter(Boolean) as (StyleField | StyleGroup)[];

    return pruneOrphanHeadings(filtered);
};

// Helper functions for color conversion
const normalizeHexToSix = (hex: string): string => {
    const three = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (three) {
        return `#${three[1]}${three[1]}${three[2]}${three[2]}${three[3]}${three[3]}`;
    }
    return hex;
};

const hexToRgba = (hex: string, alpha: number = 1): string => {
    const six = normalizeHexToSix(hex);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(six);
    if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
};

const rgbaToHex = (rgba: string): string => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, "0");
        const g = parseInt(match[2]).toString(16).padStart(2, "0");
        const b = parseInt(match[3]).toString(16).padStart(2, "0");
        return `#${r}${g}${b}`;
    }
    return rgba;
};

const parseColor = (color: string): { hex: string; alpha: number } => {
    if (color.startsWith("rgba")) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            const hex = rgbaToHex(color);
            const alpha = match[4] ? parseFloat(match[4]) : 1;
            return { hex, alpha };
        }
    }
    // Default to hex color with full opacity; normalize so 3-digit (#fff) becomes 6-digit (#ffffff)
    const hex = color || "#000000";
    return { hex: normalizeHexToSix(hex), alpha: 1 };
};

// Convert rgba string to RgbaColor object
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
    // Fallback: try to parse as hex
    const parsed = parseColor(rgba);
    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(parsed.hex);
    if (hexMatch) {
        return {
            r: parseInt(hexMatch[1], 16),
            g: parseInt(hexMatch[2], 16),
            b: parseInt(hexMatch[3], 16),
            a: parsed.alpha
        };
    }
    // Default fallback
    return { r: 0, g: 0, b: 0, a: 1 };
};

// Convert RgbaColor object to rgba string
const rgbaColorToRgbaString = (color: RgbaColor): string => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};

// Helper functions for padding
const parsePadding = (value: string): {
    top: string;
    right: string;
    bottom: string;
    left: string;
} => {
    const parts = value.split(/\s+/);
    return {
        top: parts[0] || "0px",
        right: parts[1] || parts[0] || "0px",
        bottom: parts[2] || parts[0] || "0px",
        left: parts[3] || parts[1] || parts[0] || "0px"
    };
};

const extractNumber = (value: string): string => {
    const match = value.match(/^(-?\d*\.?\d*)/);
    return match?.[1] || "0";
};

const SPACING_UNITS = ["px", "rem", "em"] as const;

const extractUnit = (value: string): string => {
    const match = value.match(/^-?\d*\.?\d*(.*)/);
    const unit = match?.[1]?.trim() || "px";
    return (SPACING_UNITS as readonly string[]).includes(unit) ? unit : "px";
};

const formatPaddingString = (padding: string): string => {
    const { top, right, bottom, left } = parsePadding(padding);
    
    // All sides equal: "10px 10px 10px 10px" -> "10px"
    if (top === right && right === bottom && bottom === left) {
        return top;
    }
    
    // Top=Bottom and Left=Right: "10px 5px 10px 5px" -> "10px 5px"
    if (top === bottom && left === right) {
        return `${top} ${right}`;
    }
    
    // No simplification possible
    return `${top} ${right} ${bottom} ${left}`;
};

// Helper functions for borderRadius
const parseBorderRadius = (value: string): {
    topLeft: string;
    topRight: string;
    bottomRight: string;
    bottomLeft: string;
} => {
    const parts = value.split(/\s+/);
    return {
        topLeft: parts[0] || "0px",
        topRight: parts[1] || parts[0] || "0px",
        bottomRight: parts[2] || parts[0] || "0px",
        bottomLeft: parts[3] || parts[1] || parts[0] || "0px"
    };
};

const formatBorderRadiusString = (borderRadius: string): string => {
    const { topLeft, topRight, bottomRight, bottomLeft } = parseBorderRadius(borderRadius);
    
    // All corners equal: "10px 10px 10px 10px" -> "10px"
    if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
        return topLeft;
    }
    
    // Top corners equal and bottom corners equal: "10px 5px 10px 5px" -> "10px 5px"
    if (topLeft === topRight && bottomRight === bottomLeft) {
        return `${topLeft} ${bottomRight}`;
    }
    
    // No simplification possible
    return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
};

// Helper functions for boxShadow
const parseBoxShadow = (value: string): {
    horizontalPosition: string;
    verticalPosition: string;
    blurRadius: string;
    spreadRadius: string;
    color: string;
} => {
    const match = value.match(
        /^(-?\d*\.?\d*px)\s+(-?\d*\.?\d*px)\s+(\d*\.?\d*px)\s+(\d*\.?\d*px)\s+(#[0-9a-fA-F]{6}|rgba?\([^)]+\)|[a-zA-Z]+)$/
    );
    return {
        horizontalPosition: match?.[1] || "0px",
        verticalPosition: match?.[2] || "0px",
        blurRadius: match?.[3] || "0px",
        spreadRadius: match?.[4] || "0px",
        color: match?.[5] || "rgba(0, 0, 0, 0.5)"
    };
};

const formatBoxShadowString = (boxShadow: string): string => {
    // For boxShadow, we show the values without color (color is shown as a box)
    const parsed = parseBoxShadow(boxShadow);
    if (
        parsed.horizontalPosition === "0px" &&
        parsed.verticalPosition === "0px" &&
        parsed.blurRadius === "0px" &&
        parsed.spreadRadius === "0px"
    ) {
        return "none";
    }
    // Return only the numeric values, excluding the color
    return `${parsed.horizontalPosition} ${parsed.verticalPosition} ${parsed.blurRadius} ${parsed.spreadRadius}`;
};

// Helper functions for textShadow
const parseTextShadow = (value: string): {
    horizontalPosition: string;
    verticalPosition: string;
    blurRadius: string;
    color: string;
} => {
    // Handle "none" value
    if (!value || value.trim() === "none") {
        return {
            horizontalPosition: "0px",
            verticalPosition: "0px",
            blurRadius: "0px",
            color: "#000000"
        };
    }
    const match = value.match(
        /^(-?\d*\.?\d*px)\s+(-?\d*\.?\d*px)\s+(\d*\.?\d*px)\s+(#[0-9a-fA-F]{6}|rgba?\([^)]+\)|[a-zA-Z]+)$/
    );
    return {
        horizontalPosition: match?.[1] || "0px",
        verticalPosition: match?.[2] || "0px",
        blurRadius: match?.[3] || "0px",
        color: match?.[4] || "#000000"
    };
};

const formatTextShadowString = (textShadow: string): string => {
    // For textShadow, we show the values without color (color is shown as a box)
    const parsed = parseTextShadow(textShadow);
    if (
        parsed.horizontalPosition === "0px" &&
        parsed.verticalPosition === "0px" &&
        parsed.blurRadius === "0px"
    ) {
        return "none";
    }
    // Return only the numeric values, excluding the color
    return `${parsed.horizontalPosition} ${parsed.verticalPosition} ${parsed.blurRadius}`;
};

// Helper functions for border
const parseBorder = (value: string): {
    width: string;
    style: string;
    color: string;
} => {
    // Handle "none" value
    if (!value || value.trim() === "none") {
        return {
            width: "0px",
            style: "none",
            color: "#000000"
        };
    }
    // Match: width style color
    // Color can be hex, rgba/rgb, or named color
    const match = value.match(/^(\d*\.?\d*px)\s+(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)\s+(.+)$/);
    if (match) {
        return {
            width: match[1] || "1px",
            style: match[2] || "solid",
            color: match[3] || "#000000"
        };
    }
    // Fallback: split by spaces (for simple cases)
    const parts = value.split(/\s+/);
    return {
        width: parts[0] || "1px",
        style: parts[1] || "solid",
        color: parts.slice(2).join(" ") || "#000000"
    };
};

const formatBorderString = (border: string): string => {
    // For border, we show width and style (color is shown as a box)
    const parsed = parseBorder(border);
    if (parsed.width === "0px" || parsed.style === "none") {
        return "none";
    }
    // Return width and style, excluding the color
    return `${parsed.width} ${parsed.style}`;
};

// Debounced color picker component with color square and integrated opacity control using react-colorful
const DebouncedColorPicker = ({
    value,
    onChange,
    disabled,
    sx
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    sx?: Record<string, unknown>;
}) => {
    const [localColor, setLocalColor] = useState<RgbaColor>(() => 
        rgbaStringToRgbaColor(value || "rgba(0, 0, 0, 1)")
    );
    const [hexInput, setHexInput] = useState(() => {
        const color = rgbaStringToRgbaColor(value || "rgba(0, 0, 0, 1)");
        return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
    });
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const open = Boolean(anchorEl);

    // Update local color when prop changes
    useEffect(() => {
        const color = rgbaStringToRgbaColor(value || "rgba(0, 0, 0, 1)");
        setLocalColor(color);
        setHexInput(`#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`);
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const updateColor = (color: RgbaColor) => {
        setLocalColor(color);
        setHexInput(`#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`);
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the onChange callback
        timeoutRef.current = setTimeout(() => {
            onChange(rgbaColorToRgbaString(color));
        }, 150);
    };

    const handleColorChange = (color: RgbaColor) => {
        updateColor(color);
    };

    const handleColorSquareClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const isEyeDropperSupported =
        typeof window !== "undefined" && "EyeDropper" in window;

    const handleEyedropperClick = async () => {
        if (disabled || !isEyeDropperSupported) return;
        try {
            const EyeDropperConstructor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
            const eyeDropper = new EyeDropperConstructor();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex;
            const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (hexMatch) {
                updateColor({
                    r: parseInt(hexMatch[1], 16),
                    g: parseInt(hexMatch[2], 16),
                    b: parseInt(hexMatch[3], 16),
                    a: localColor.a
                });
            }
        } catch {
            // User cancelled or error - ignore
        }
    };

    const displayColor = rgbaColorToRgbaString(localColor);

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    ...sx
                }}
            >
                {/* Color square with checkerboard for opacity visibility */}
                <Box
                    onClick={handleColorSquareClick}
                    sx={{
                        width: 30,
                        height: 30,
                        minWidth: 30,
                        backgroundImage:
                            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "10px 10px",
                        backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1,
                        "&:hover": {
                            opacity: disabled ? 0.5 : 0.8
                        },
                        transition: "opacity 0.2s",
                        position: "relative",
                        overflow: "hidden",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            backgroundColor: displayColor,
                            borderRadius: "inherit"
                        }
                    }}
                />
            </Box>
            {/* Color picker popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
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
                                    backgroundImage:
                                        "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                                    backgroundSize: "10px 10px",
                                    backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 1,
                                    position: "relative",
                                    overflow: "hidden",
                                    "&::after": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        backgroundColor: displayColor,
                                        borderRadius: "inherit"
                                    }
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
                                            updateColor({
                                                r: parseInt(hexMatch[1], 16),
                                                g: parseInt(hexMatch[2], 16),
                                                b: parseInt(hexMatch[3], 16),
                                                a: localColor.a
                                            });
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
                                        setHexInput(`#${localColor.r.toString(16).padStart(2, "0")}${localColor.g.toString(16).padStart(2, "0")}${localColor.b.toString(16).padStart(2, "0")}`);
                                        return;
                                    }
                                    setHexInput(hex);
                                }}
                                disabled={disabled}
                                sx={{ flex: 1 }}
                                placeholder="#000000"
                            />
                            {isEyeDropperSupported && (
                                <Tooltip title="Pick color from page">
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={handleEyedropperClick}
                                            disabled={disabled}
                                            sx={{
                                                p: 0.5,
                                                opacity: disabled ? 0.5 : 1
                                            }}
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
                            color={localColor}
                            onChange={handleColorChange}
                            style={{
                                width: "100%"
                            }}
                        />
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

const PortalIconImagePicker = ({
    iconUrl,
    iconKey
}: {
    iconUrl?: string;
    iconKey: string;
}) => {
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState<"documents" | "local">("documents");
    const [imageName, setImageName] = useState(() => iconKey || "");

    useEffect(() => {
        setImageName(iconKey || "");
    }, [iconKey]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                    onClick={handleOpen}
                    sx={{
                        width: 30,
                        height: 30,
                        minWidth: 30,
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        cursor: "pointer",
                        overflow: "hidden",
                        backgroundColor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "&:hover": { opacity: 0.85 },
                        transition: "opacity 0.2s"
                    }}
                    role="button"
                    aria-label="Open image picker"
                >
                    {iconUrl ? (
                        <Box
                            component="img"
                            src={iconUrl}
                            alt={iconKey}
                            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                    ) : (
                        <Box sx={{ width: "100%", height: "100%", backgroundColor: "#f0f0f0" }} />
                    )}
                </Box>
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Image</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 2
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "#f6fbff",
                                borderRadius: 1,
                                border: "1px solid #e0e0e0",
                                minHeight: 260,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 2
                            }}
                        >
                            {iconUrl ? (
                                <Box
                                    component="img"
                                    src={iconUrl}
                                    alt={iconKey}
                                    sx={{ maxWidth: "100%", maxHeight: 220, objectFit: "contain" }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No image
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center" }}>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <TextField
                                    label="Image name"
                                    size="small"
                                    fullWidth
                                    value={imageName}
                                    onChange={(e) => setImageName(e.target.value)}
                                />
                                <Button
                                    variant="outlined"
                                    component="a"
                                    href={iconUrl || "#"}
                                    download
                                    disabled={!iconUrl}
                                >
                                    Download
                                </Button>
                            </Box>

                            <RadioGroup
                                value={source}
                                sx={{ flexDirection: "row", gap: 2 }}
                                onChange={(e) => {
                                    const next = e.target.value === "local" ? "local" : "documents";
                                    setSource(next);
                                }}
                            >
                                <FormControlLabel
                                    value="documents"
                                    control={<Radio size="small" />}
                                    label="from documents & media"
                                    slotProps={{ typography: { sx: { fontSize: "0.875rem" } } }}
                                />
                                <FormControlLabel
                                    value="local"
                                    control={<Radio size="small" />}
                                    label="from local files"
                                    slotProps={{ typography: { sx: { fontSize: "0.875rem" } } }}
                                />
                            </RadioGroup>

                            <TextField
                                label="Upload file"
                                type="file"
                                size="small"
                                fullWidth
                                slotProps={{
                                    inputLabel: { shrink: true },
                                    input: { inputProps: { accept: "image/*" } }
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => undefined}>
                        Upload
                    </Button>
                    <Button variant="outlined" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// Debounced padding picker component with visual diagram and popover
const DebouncedPaddingPicker = ({
    value,
    onChange,
    disabled,
    sx
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    sx?: Record<string, unknown>;
}) => {
    const parsedPadding = parsePadding(value || "0px 0px 0px 0px");
    const [localTop, setLocalTop] = useState(extractNumber(parsedPadding.top));
    const [localRight, setLocalRight] = useState(extractNumber(parsedPadding.right));
    const [localBottom, setLocalBottom] = useState(extractNumber(parsedPadding.bottom));
    const [localLeft, setLocalLeft] = useState(extractNumber(parsedPadding.left));
    const [localTopUnit, setLocalTopUnit] = useState(extractUnit(parsedPadding.top));
    const [localRightUnit, setLocalRightUnit] = useState(extractUnit(parsedPadding.right));
    const [localBottomUnit, setLocalBottomUnit] = useState(extractUnit(parsedPadding.bottom));
    const [localLeftUnit, setLocalLeftUnit] = useState(extractUnit(parsedPadding.left));
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastEmittedValueRef = useRef<string>(value || "0px 0px 0px 0px");

    const open = Boolean(anchorEl);

    useEffect(() => {
        if (value !== lastEmittedValueRef.current) {
            const parsed = parsePadding(value || "0px 0px 0px 0px");
            setLocalTop(extractNumber(parsed.top));
            setLocalRight(extractNumber(parsed.right));
            setLocalBottom(extractNumber(parsed.bottom));
            setLocalLeft(extractNumber(parsed.left));
            setLocalTopUnit(extractUnit(parsed.top));
            setLocalRightUnit(extractUnit(parsed.right));
            setLocalBottomUnit(extractUnit(parsed.bottom));
            setLocalLeftUnit(extractUnit(parsed.left));
            lastEmittedValueRef.current = value || "0px 0px 0px 0px";
        }
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const emitPaddingChange = (newValue: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            lastEmittedValueRef.current = newValue;
            onChange(newValue);
        }, 150);
    };

    const buildPaddingValue = (
        top: string, right: string, bottom: string, left: string,
        topU: string, rightU: string, bottomU: string, leftU: string
    ) => {
        const topVal = top ? `${top}${topU}` : `0${topU}`;
        const rightVal = right ? `${right}${rightU}` : `0${rightU}`;
        const bottomVal = bottom ? `${bottom}${bottomU}` : `0${bottomU}`;
        const leftVal = left ? `${left}${leftU}` : `0${leftU}`;
        return `${topVal} ${rightVal} ${bottomVal} ${leftVal}`;
    };

    const emitCurrentPadding = (
        top: string, right: string, bottom: string, left: string,
        topU: string, rightU: string, bottomU: string, leftU: string
    ) => {
        emitPaddingChange(buildPaddingValue(top, right, bottom, left, topU, rightU, bottomU, leftU));
    };

    const handleFieldChange = (field: "top" | "right" | "bottom" | "left", newValue: string) => {
        const validPattern = /^-?\d*\.?\d*$/;
        if (!validPattern.test(newValue)) {
            return;
        }

        switch (field) {
            case "top":
                setLocalTop(newValue);
                emitCurrentPadding(newValue, localRight, localBottom, localLeft, localTopUnit, localRightUnit, localBottomUnit, localLeftUnit);
                break;
            case "right":
                setLocalRight(newValue);
                emitCurrentPadding(localTop, newValue, localBottom, localLeft, localTopUnit, localRightUnit, localBottomUnit, localLeftUnit);
                break;
            case "bottom":
                setLocalBottom(newValue);
                emitCurrentPadding(localTop, localRight, newValue, localLeft, localTopUnit, localRightUnit, localBottomUnit, localLeftUnit);
                break;
            case "left":
                setLocalLeft(newValue);
                emitCurrentPadding(localTop, localRight, localBottom, newValue, localTopUnit, localRightUnit, localBottomUnit, localLeftUnit);
                break;
        }
    };

    const handleUnitChange = (field: "top" | "right" | "bottom" | "left", newUnit: string) => {
        switch (field) {
            case "top":
                setLocalTopUnit(newUnit);
                emitCurrentPadding(localTop, localRight, localBottom, localLeft, newUnit, localRightUnit, localBottomUnit, localLeftUnit);
                break;
            case "right":
                setLocalRightUnit(newUnit);
                emitCurrentPadding(localTop, localRight, localBottom, localLeft, localTopUnit, newUnit, localBottomUnit, localLeftUnit);
                break;
            case "bottom":
                setLocalBottomUnit(newUnit);
                emitCurrentPadding(localTop, localRight, localBottom, localLeft, localTopUnit, localRightUnit, newUnit, localLeftUnit);
                break;
            case "left":
                setLocalLeftUnit(newUnit);
                emitCurrentPadding(localTop, localRight, localBottom, localLeft, localTopUnit, localRightUnit, localBottomUnit, newUnit);
                break;
        }
    };

    const handleTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const displayText = formatPaddingString(value || "0px 0px 0px 0px");

    return (
        <>
            <Box
                onClick={handleTextClick}
                sx={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    padding: "4px 8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    "&:hover": {
                        backgroundColor: disabled ? "#fff" : "#f5f5f5",
                        borderColor: disabled ? "#e0e0e0" : "#bdbdbd"
                    },
                    transition: "all 0.2s",
                    fontSize: "0.875rem",
                    minWidth: 80,
                    maxWidth: 200,
                    textAlign: "center",
                    ...sx
                }}
            >
                {displayText}
            </Box>
            {/* Padding picker popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <Box sx={{ p: 1.5, minWidth: 240 }}>
                    {/* Visual padding diagram */}
                    <Box sx={{ mb: 1.5 }}>
                        {/* <Typography variant="subtitle1" sx={{ mb: 1.5, display: "block" }}>
                            Padding
                        </Typography> */}
                        <Box
                            sx={{
                                position: "relative",
                                border: "2px solid #1976d2",
                                borderRadius: 1,
                                backgroundColor: "#e3f2fd",
                                height: 90,
                                width: 145,
                                mx: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 1
                            }}
                        >
                            {/* Top padding label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localTop || "0"}{localTopUnit}
                            </Box>
                            {/* Right padding label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    right: 0,
                                    top: "50%",
                                    transform: "translate(50%, -50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localRight || "0"}{localRightUnit}
                            </Box>
                            {/* Bottom padding label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: "50%",
                                    transform: "translate(-50%, 50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localBottom || "0"}{localBottomUnit}
                            </Box>
                            {/* Left padding label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localLeft || "0"}{localLeftUnit}
                            </Box>
                            {/* Central content box */}
                            <Box
                                sx={{
                                    backgroundColor: "#fff",
                                    border: "1px dashed #90caf9",
                                    borderRadius: 1,
                                    minWidth: 100,
                                    minHeight: 50,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.65rem",
                                    color: "#666"
                                }}
                            >
                                Content
                            </Box>
                        </Box>
                    </Box>
                    {/* Input fields */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "auto auto",
                            gap: 1,
                            justifyContent: "center",
                            mx: "auto"
                        }}
                    >
                        {/* Top */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Top
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localTop || ""}
                                    onChange={(e) => handleFieldChange("top", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 60, "& .MuiInputBase-root": { height: 36 } }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <FormControl size="small" sx={{ minWidth: 56 }}>
                                    <Select
                                        value={localTopUnit}
                                        onChange={(e) => handleUnitChange("top", e.target.value)}
                                        variant="outlined"
                                        disabled={disabled}
                                        sx={{ fontSize: "0.75rem", height: 36 }}
                                    >
                                        {SPACING_UNITS.map((u) => (
                                            <MenuItem key={u} value={u} sx={{ fontSize: "0.75rem" }}>{u}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        {/* Right */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Right
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localRight || ""}
                                    onChange={(e) => handleFieldChange("right", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 60, "& .MuiInputBase-root": { height: 36 } }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <FormControl size="small" sx={{ minWidth: 56 }}>
                                    <Select
                                        value={localRightUnit}
                                        onChange={(e) => handleUnitChange("right", e.target.value)}
                                        variant="outlined"
                                        disabled={disabled}
                                        sx={{ fontSize: "0.75rem", height: 36 }}
                                    >
                                        {SPACING_UNITS.map((u) => (
                                            <MenuItem key={u} value={u} sx={{ fontSize: "0.75rem" }}>{u}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        {/* Bottom */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Bottom
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localBottom || ""}
                                    onChange={(e) => handleFieldChange("bottom", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 60, "& .MuiInputBase-root": { height: 36 } }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <FormControl size="small" sx={{ minWidth: 56 }}>
                                    <Select
                                        value={localBottomUnit}
                                        onChange={(e) => handleUnitChange("bottom", e.target.value)}
                                        variant="outlined"
                                        disabled={disabled}
                                        sx={{ fontSize: "0.75rem", height: 36 }}
                                    >
                                        {SPACING_UNITS.map((u) => (
                                            <MenuItem key={u} value={u} sx={{ fontSize: "0.75rem" }}>{u}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        {/* Left */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Left
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localLeft || ""}
                                    onChange={(e) => handleFieldChange("left", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 60, "& .MuiInputBase-root": { height: 36 } }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <FormControl size="small" sx={{ minWidth: 56 }}>
                                    <Select
                                        value={localLeftUnit}
                                        onChange={(e) => handleUnitChange("left", e.target.value)}
                                        variant="outlined"
                                        disabled={disabled}
                                        sx={{ fontSize: "0.75rem", height: 36 }}
                                    >
                                        {SPACING_UNITS.map((u) => (
                                            <MenuItem key={u} value={u} sx={{ fontSize: "0.75rem" }}>{u}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

// Debounced border radius picker component with visual diagram and popover
const DebouncedBorderRadiusPicker = ({
    value,
    onChange,
    disabled,
    sx
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    sx?: Record<string, unknown>;
}) => {
    const parsedBorderRadius = parseBorderRadius(value || "0px 0px 0px 0px");
    const [localTopLeft, setLocalTopLeft] = useState(extractNumber(parsedBorderRadius.topLeft));
    const [localTopRight, setLocalTopRight] = useState(extractNumber(parsedBorderRadius.topRight));
    const [localBottomRight, setLocalBottomRight] = useState(extractNumber(parsedBorderRadius.bottomRight));
    const [localBottomLeft, setLocalBottomLeft] = useState(extractNumber(parsedBorderRadius.bottomLeft));
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastEmittedValueRef = useRef<string>(value || "0px 0px 0px 0px");

    const open = Boolean(anchorEl);

    // Update local values when prop changes
    useEffect(() => {
        if (value !== lastEmittedValueRef.current) {
            const parsed = parseBorderRadius(value || "0px 0px 0px 0px");
            setLocalTopLeft(extractNumber(parsed.topLeft));
            setLocalTopRight(extractNumber(parsed.topRight));
            setLocalBottomRight(extractNumber(parsed.bottomRight));
            setLocalBottomLeft(extractNumber(parsed.bottomLeft));
            lastEmittedValueRef.current = value || "0px 0px 0px 0px";
        }
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const updateBorderRadius = (topLeft: string, topRight: string, bottomRight: string, bottomLeft: string) => {
        const topLeftPx = topLeft ? `${topLeft}px` : "0px";
        const topRightPx = topRight ? `${topRight}px` : "0px";
        const bottomRightPx = bottomRight ? `${bottomRight}px` : "0px";
        const bottomLeftPx = bottomLeft ? `${bottomLeft}px` : "0px";
        const newValue = `${topLeftPx} ${topRightPx} ${bottomRightPx} ${bottomLeftPx}`;
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the onChange callback
        timeoutRef.current = setTimeout(() => {
            lastEmittedValueRef.current = newValue;
            onChange(newValue);
        }, 150);
    };

    const handleFieldChange = (field: "topLeft" | "topRight" | "bottomRight" | "bottomLeft", newValue: string) => {
        // Only allow numeric input with optional decimal
        const validPattern = /^\d*\.?\d*$/;
        if (!validPattern.test(newValue)) {
            return;
        }

        switch (field) {
            case "topLeft":
                setLocalTopLeft(newValue);
                updateBorderRadius(newValue, localTopRight, localBottomRight, localBottomLeft);
                break;
            case "topRight":
                setLocalTopRight(newValue);
                updateBorderRadius(localTopLeft, newValue, localBottomRight, localBottomLeft);
                break;
            case "bottomRight":
                setLocalBottomRight(newValue);
                updateBorderRadius(localTopLeft, localTopRight, newValue, localBottomLeft);
                break;
            case "bottomLeft":
                setLocalBottomLeft(newValue);
                updateBorderRadius(localTopLeft, localTopRight, localBottomRight, newValue);
                break;
        }
    };

    const handleTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const displayText = formatBorderRadiusString(value || "0px 0px 0px 0px");

    return (
        <>
            <Box
                onClick={handleTextClick}
                sx={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    padding: "4px 8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    "&:hover": {
                        backgroundColor: disabled ? "#fff" : "#f5f5f5",
                        borderColor: disabled ? "#e0e0e0" : "#bdbdbd"
                    },
                    transition: "all 0.2s",
                    fontSize: "0.875rem",
                    minWidth: 80,
                    maxWidth: 200,
                    textAlign: "center",
                    ...sx
                }}
            >
                {displayText}
            </Box>
            {/* Border radius picker popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <Box sx={{ p: 1.5, minWidth: 240 }}>
                    {/* Visual border radius diagram */}
                    <Box sx={{ mb: 1.5 }}>
                        {/* <Typography variant="subtitle1" sx={{ mb: 1.5, display: "block" }}>
                            Border Radius
                        </Typography> */}
                        <Box
                            sx={{
                                position: "relative",
                                border: "2px solid #1976d2",
                                borderRadius: `${localTopLeft || "0"}px ${localTopRight || "0"}px ${localBottomRight || "0"}px ${localBottomLeft || "0"}px`,
                                backgroundColor: "#e3f2fd",
                                height: 90,
                                width: 145,
                                mx: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 1
                            }}
                        >
                            {/* Top Left label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    transform: "translate(-50%, -50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localTopLeft || "0"}px
                            </Box>
                            {/* Top Right label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    transform: "translate(50%, -50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localTopRight || "0"}px
                            </Box>
                            {/* Bottom Right label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    transform: "translate(50%, 50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localBottomRight || "0"}px
                            </Box>
                            {/* Bottom Left label */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    transform: "translate(-50%, 50%)",
                                    fontSize: "0.7rem",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: "1px solid #1976d2",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {localBottomLeft || "0"}px
                            </Box>
                        </Box>
                    </Box>
                    {/* Input fields */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "auto auto",
                            gap: 1,
                            justifyContent: "center",
                            mx: "auto"
                        }}
                    >
                        {/* Top Left */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Top Left
                            </Typography>
                            <TextField
                                size="small"
                                value={localTopLeft || ""}
                                onChange={(e) => handleFieldChange("topLeft", e.target.value)}
                                disabled={disabled}
                                sx={{ width: 70 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontSize: "0.875rem",
                                                    color: "text.secondary",
                                                    userSelect: "none"
                                                }}
                                            >
                                                px
                                            </Typography>
                                        </InputAdornment>
                                    )
                                }}
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                    }
                                }}
                                placeholder="0"
                            />
                        </Box>
                        {/* Top Right */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Top Right
                            </Typography>
                            <TextField
                                size="small"
                                value={localTopRight || ""}
                                onChange={(e) => handleFieldChange("topRight", e.target.value)}
                                disabled={disabled}
                                sx={{ width: 70 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontSize: "0.875rem",
                                                    color: "text.secondary",
                                                    userSelect: "none"
                                                }}
                                            >
                                                px
                                            </Typography>
                                        </InputAdornment>
                                    )
                                }}
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                    }
                                }}
                                placeholder="0"
                            />
                        </Box>
                        
                        {/* Bottom Left */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Bottom Left
                            </Typography>
                            <TextField
                                size="small"
                                value={localBottomLeft || ""}
                                onChange={(e) => handleFieldChange("bottomLeft", e.target.value)}
                                disabled={disabled}
                                sx={{ width: 70 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontSize: "0.875rem",
                                                    color: "text.secondary",
                                                    userSelect: "none"
                                                }}
                                            >
                                                px
                                            </Typography>
                                        </InputAdornment>
                                    )
                                }}
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                    }
                                }}
                                placeholder="0"
                            />
                        </Box>
                        {/* Bottom Right */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Bottom Right
                            </Typography>
                            <TextField
                                size="small"
                                value={localBottomRight || ""}
                                onChange={(e) => handleFieldChange("bottomRight", e.target.value)}
                                disabled={disabled}
                                sx={{ width: 70 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontSize: "0.875rem",
                                                    color: "text.secondary",
                                                    userSelect: "none"
                                                }}
                                            >
                                                px
                                            </Typography>
                                        </InputAdornment>
                                    )
                                }}
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                    }
                                }}
                                placeholder="0"
                            />
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

// Debounced box shadow picker component with visual diagram and popover
const DebouncedBoxShadowPicker = ({
    value,
    onChange,
    disabled,
    sx
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    sx?: Record<string, unknown>;
}) => {
    const initialValue = value || "0px 0px 0px 0px rgba(0, 0, 0, 0.5)";
    const parsedBoxShadow = parseBoxShadow(initialValue);
    const initialColor = parsedBoxShadow.color || "rgba(0, 0, 0, 0.5)";
    const initialParsedColor = parseColor(initialColor);
    const [localHorizontal, setLocalHorizontal] = useState(extractNumber(parsedBoxShadow.horizontalPosition));
    const [localVertical, setLocalVertical] = useState(extractNumber(parsedBoxShadow.verticalPosition));
    const [localBlur, setLocalBlur] = useState(extractNumber(parsedBoxShadow.blurRadius));
    const [localSpread, setLocalSpread] = useState(extractNumber(parsedBoxShadow.spreadRadius));
    const [localColor, setLocalColor] = useState(initialColor);
    const [localHex, setLocalHex] = useState(initialParsedColor.hex);
    const [localAlpha, setLocalAlpha] = useState(initialParsedColor.alpha);
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastEmittedValueRef = useRef<string>(initialValue);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const open = Boolean(anchorEl);

    // Update local values when prop changes
    useEffect(() => {
        const currentValue = value || "0px 0px 0px 0px rgba(0, 0, 0, 0.5)";
        if (currentValue !== lastEmittedValueRef.current) {
            const parsed = parseBoxShadow(currentValue);
            setLocalHorizontal(extractNumber(parsed.horizontalPosition));
            setLocalVertical(extractNumber(parsed.verticalPosition));
            setLocalBlur(extractNumber(parsed.blurRadius));
            setLocalSpread(extractNumber(parsed.spreadRadius));
            setLocalColor(parsed.color);
            const parsedColorValue = parseColor(parsed.color || "#000000");
            setLocalHex(parsedColorValue.hex);
            setLocalAlpha(parsedColorValue.alpha);
            lastEmittedValueRef.current = currentValue;
        }
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const updateBoxShadow = (horizontal: string, vertical: string, blur: string, spread: string, color: string) => {
        const horizontalPx = horizontal ? `${horizontal}px` : "0px";
        const verticalPx = vertical ? `${vertical}px` : "0px";
        const blurPx = blur ? `${blur}px` : "0px";
        const spreadPx = spread ? `${spread}px` : "0px";
        const newValue = `${horizontalPx} ${verticalPx} ${blurPx} ${spreadPx} ${color}`;
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the onChange callback
        timeoutRef.current = setTimeout(() => {
            lastEmittedValueRef.current = newValue;
            onChange(newValue);
        }, 150);
    };

    const handleNumberFieldChange = (field: "horizontalPosition" | "verticalPosition" | "blurRadius" | "spreadRadius", newValue: string) => {
        // Only allow numeric input with optional decimal and negative sign
        const validPattern = /^-?\d*\.?\d*$/;
        if (!validPattern.test(newValue)) {
            return;
        }

        switch (field) {
            case "horizontalPosition":
                setLocalHorizontal(newValue);
                updateBoxShadow(newValue, localVertical, localBlur, localSpread, localColor);
                break;
            case "verticalPosition":
                setLocalVertical(newValue);
                updateBoxShadow(localHorizontal, newValue, localBlur, localSpread, localColor);
                break;
            case "blurRadius":
                setLocalBlur(newValue);
                updateBoxShadow(localHorizontal, localVertical, newValue, localSpread, localColor);
                break;
            case "spreadRadius":
                setLocalSpread(newValue);
                updateBoxShadow(localHorizontal, localVertical, localBlur, newValue, localColor);
                break;
        }
    };

    const handleColorChange = (newColor: string) => {
        setLocalColor(newColor);
        const parsed = parseColor(newColor);
        setLocalHex(parsed.hex);
        setLocalAlpha(parsed.alpha);
        updateBoxShadow(localHorizontal, localVertical, localBlur, localSpread, newColor);
    };

    const handleTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const isEyeDropperSupported =
        typeof window !== "undefined" && "EyeDropper" in window;

    const handleEyedropperClick = async () => {
        if (disabled || !isEyeDropperSupported) return;
        try {
            const EyeDropperConstructor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
            const eyeDropper = new EyeDropperConstructor();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex;
            handleColorChange(hexToRgba(hex, localAlpha));
        } catch {
            // User cancelled or error - ignore
        }
    };

    const currentValue = value || "0px 0px 0px 0px rgba(0, 0, 0, 0.5)";
    const displayText = formatBoxShadowString(currentValue);
    const boxShadowValue = `${localHorizontal || "0"}px ${localVertical || "0"}px ${localBlur || "0"}px ${localSpread || "0"}px ${localColor || "rgba(0, 0, 0, 0.5)"}`;
    
    // Extract color for display box - use localColor for real-time updates
    const displayColor = localColor || parsedBoxShadow.color || "rgba(0, 0, 0, 0.5)";

    return (
        <>
            <Box
                onClick={handleTextClick}
                sx={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    padding: "4px 8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": {
                        backgroundColor: disabled ? "#fff" : "#f5f5f5",
                        borderColor: disabled ? "#e0e0e0" : "#bdbdbd"
                    },
                    transition: "all 0.2s",
                    fontSize: "0.875rem",
                    minWidth: 80,
                    maxWidth: 200,
                    ...sx
                }}
            >
                <Box sx={{ flex: 1, textAlign: "center" }}>
                    {displayText}
                </Box>
                <Box
                    sx={{
                        width: 20,
                        height: 20,
                        minWidth: 20,
                        backgroundImage:
                            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "10px 10px",
                        backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        flexShrink: 0,
                        position: "relative",
                        overflow: "hidden",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            backgroundColor: displayColor,
                            borderRadius: "inherit"
                        }
                    }}
                />
            </Box>
            {/* Box shadow picker popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <Box sx={{ p: 1.5, minWidth: 240 }}>
                    {/* Visual box shadow diagram */}
                    <Box sx={{ mb: 1.5 }}>
                        {/* <Typography variant="subtitle1" sx={{ mb: 1.5, display: "block" }}>
                            Box Shadow
                        </Typography> */}
                        <Box
                            sx={{
                                position: "relative",
                                height: 90,
                                width: '100%',
                                mx: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: 'hidden'
                            }}
                        >
                            {/* Box with shadow */}
                            <Box
                                sx={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 1,
                                    minWidth: 60,
                                    minHeight: 50,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.65rem",
                                    color: "#666",
                                    boxShadow: boxShadowValue
                                }}
                            >
                                Content
                            </Box>
                        </Box>
                    </Box>
                    {/* Input fields */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "auto auto",
                            gap: 1,
                            mb: 1,
                            justifyContent: "center",
                            mx: "auto"
                        }}
                    >
                        {/* Horizontal */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Horizontal
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localHorizontal || ""}
                                    onChange={(e) => handleNumberFieldChange("horizontalPosition", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                        {/* Vertical */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Vertical
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localVertical || ""}
                                    onChange={(e) => handleNumberFieldChange("verticalPosition", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                        {/* Blur */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Blur
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localBlur || ""}
                                    onChange={(e) => handleNumberFieldChange("blurRadius", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                        {/* Spread */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Spread
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localSpread || ""}
                                    onChange={(e) => handleNumberFieldChange("spreadRadius", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    {/* Color picker */}
                    <Box sx={{ maxWidth: 185, mx: "auto" }}>
                        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                            Color
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1
                                }}
                            >
                                <Box
                                    onClick={() => colorInputRef.current?.click()}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: hexToRgba(localHex || "#000000", localAlpha),
                                        border: "1px solid #e0e0e0",
                                        borderRadius: 1,
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        "&:hover": {
                                            opacity: disabled ? 1 : 0.8
                                        },
                                        transition: "opacity 0.2s"
                                    }}
                                />
                                <input
                                    ref={colorInputRef}
                                    type="color"
                                    value={localHex || "#000000"}
                                    onChange={(e) => {
                                        const newHex = e.target.value;
                                        setLocalHex(newHex);
                                        handleColorChange(hexToRgba(newHex, localAlpha));
                                    }}
                                    disabled={disabled}
                                    style={{
                                        position: "absolute",
                                        width: 0,
                                        height: 0,
                                        opacity: 0,
                                        pointerEvents: "none"
                                    }}
                                />
                                <TextField
                                    size="small"
                                    value={localHex || "#000000"}
                                    onChange={(e) => {
                                        const newHex = e.target.value;
                                        setLocalHex(newHex);
                                        // Only update color if valid hex
                                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newHex)) {
                                            handleColorChange(hexToRgba(newHex, localAlpha));
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
                                        // If still invalid, revert to current
                                        if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) {
                                            hex = localHex || "#000000";
                                        }
                                        setLocalHex(hex);
                                        handleColorChange(hexToRgba(hex, localAlpha));
                                    }}
                                    disabled={disabled}
                                    sx={{ width: 120 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem" }
                                        }
                                    }}
                                    placeholder="#000000"
                                />
                                {isEyeDropperSupported && (
                                    <Tooltip title="Pick color from page">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={handleEyedropperClick}
                                                disabled={disabled}
                                                sx={{
                                                    p: 0.5,
                                                    opacity: disabled ? 0.5 : 1
                                                }}
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
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography variant="caption">
                                    Opacity
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: "medium" }}>
                                    {Math.round(localAlpha * 100)}%
                                </Typography>
                            </Box>
                            <Slider
                                value={localAlpha * 100}
                                onChange={(_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
                                    const newAlpha = typeof newValue === "number" ? newValue / 100 : newValue[0] / 100;
                                    setLocalAlpha(newAlpha);
                                    handleColorChange(hexToRgba(localHex || "#000000", newAlpha));
                                }}
                                min={0}
                                max={100}
                                step={1}
                                size="small"
                                disabled={disabled}
                                valueLabelDisplay="off"
                            />
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

const DebouncedTextShadowPicker = ({
    value,
    onChange,
    disabled,
    sx
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    sx?: Record<string, unknown>;
}) => {
    const initialValue = value || "0px 0px 0px #000000";
    const parsedTextShadow = parseTextShadow(initialValue);
    const initialColor = parsedTextShadow.color || "#000000";
    const initialParsedColor = parseColor(initialColor);
    const [localHorizontal, setLocalHorizontal] = useState(extractNumber(parsedTextShadow.horizontalPosition));
    const [localVertical, setLocalVertical] = useState(extractNumber(parsedTextShadow.verticalPosition));
    const [localBlur, setLocalBlur] = useState(extractNumber(parsedTextShadow.blurRadius));
    const [localColor, setLocalColor] = useState(initialColor);
    const [localHex, setLocalHex] = useState(initialParsedColor.hex);
    const [localAlpha, setLocalAlpha] = useState(initialParsedColor.alpha);
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastEmittedValueRef = useRef<string>(initialValue);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const open = Boolean(anchorEl);

    // Update local values when prop changes
    useEffect(() => {
        const currentValue = value || "0px 0px 0px #000000";
        if (currentValue !== lastEmittedValueRef.current) {
            const parsed = parseTextShadow(currentValue);
            setLocalHorizontal(extractNumber(parsed.horizontalPosition));
            setLocalVertical(extractNumber(parsed.verticalPosition));
            setLocalBlur(extractNumber(parsed.blurRadius));
            setLocalColor(parsed.color);
            const parsedColorValue = parseColor(parsed.color || "#000000");
            setLocalHex(parsedColorValue.hex);
            setLocalAlpha(parsedColorValue.alpha);
            lastEmittedValueRef.current = currentValue;
        }
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const updateTextShadow = (horizontal: string, vertical: string, blur: string, color: string) => {
        const horizontalPx = horizontal ? `${horizontal}px` : "0px";
        const verticalPx = vertical ? `${vertical}px` : "0px";
        const blurPx = blur ? `${blur}px` : "0px";
        const newValue = `${horizontalPx} ${verticalPx} ${blurPx} ${color}`;
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the onChange callback
        timeoutRef.current = setTimeout(() => {
            lastEmittedValueRef.current = newValue;
            onChange(newValue);
        }, 150);
    };

    const handleNumberFieldChange = (field: "horizontalPosition" | "verticalPosition" | "blurRadius", newValue: string) => {
        // Only allow numeric input with optional decimal and negative sign
        const validPattern = /^-?\d*\.?\d*$/;
        if (!validPattern.test(newValue)) {
            return;
        }

        switch (field) {
            case "horizontalPosition":
                setLocalHorizontal(newValue);
                updateTextShadow(newValue, localVertical, localBlur, localColor);
                break;
            case "verticalPosition":
                setLocalVertical(newValue);
                updateTextShadow(localHorizontal, newValue, localBlur, localColor);
                break;
            case "blurRadius":
                setLocalBlur(newValue);
                updateTextShadow(localHorizontal, localVertical, newValue, localColor);
                break;
        }
    };

    const handleColorChange = (newColor: string) => {
        setLocalColor(newColor);
        const parsed = parseColor(newColor);
        setLocalHex(parsed.hex);
        setLocalAlpha(parsed.alpha);
        updateTextShadow(localHorizontal, localVertical, localBlur, newColor);
    };

    const handleTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const isEyeDropperSupported =
        typeof window !== "undefined" && "EyeDropper" in window;

    const handleEyedropperClick = async () => {
        if (disabled || !isEyeDropperSupported) return;
        try {
            const EyeDropperConstructor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
            const eyeDropper = new EyeDropperConstructor();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex;
            handleColorChange(hexToRgba(hex, localAlpha));
        } catch {
            // User cancelled or error - ignore
        }
    };

    const currentValue = value || "0px 0px 0px #000000";
    const displayText = formatTextShadowString(currentValue);
    const textShadowValue = `${localHorizontal || "0"}px ${localVertical || "0"}px ${localBlur || "0"}px ${localColor || "#000000"}`;
    
    // Extract color for display box - use localColor for real-time updates
    const displayColor = localColor || parsedTextShadow.color || "#000000";

    return (
        <>
            <Box
                onClick={handleTextClick}
                sx={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    padding: "4px 8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": {
                        backgroundColor: disabled ? "#fff" : "#f5f5f5",
                        borderColor: disabled ? "#e0e0e0" : "#bdbdbd"
                    },
                    transition: "all 0.2s",
                    fontSize: "0.875rem",
                    minWidth: 80,
                    maxWidth: 200,
                    ...sx
                }}
            >
                <Box sx={{ flex: 1, textAlign: "center" }}>
                    {displayText}
                </Box>
                <Box
                    sx={{
                        width: 20,
                        height: 20,
                        minWidth: 20,
                        backgroundImage:
                            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "10px 10px",
                        backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        flexShrink: 0,
                        position: "relative",
                        overflow: "hidden",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            backgroundColor: displayColor,
                            borderRadius: "inherit"
                        }
                    }}
                />
            </Box>
            {/* Text shadow picker popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <Box sx={{ p: 1.5, minWidth: 240 }}>
                    {/* Visual text shadow diagram */}
                    <Box sx={{ mb: 1.5 }}>
                        {/* <Typography variant="subtitle1" sx={{ mb: 1.5, display: "block" }}>
                            Text Shadow
                        </Typography> */}
                        <Box
                            sx={{
                                position: "relative",
                                height: 50,
                                width: '100%',
                                mx: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: 'hidden'
                            }}
                        >
                            {/* Text with shadow */}
                            <Typography
                                sx={{
                                    fontSize: "1.5rem",
                                    fontWeight: "bold",
                                    color: "#484848",
                                    fontFamily: 'Arial',
                                    textShadow: textShadowValue
                                }}
                            >
                                Master of Puppets
                            </Typography>
                        </Box>
                    </Box>
                    {/* Input fields */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "auto auto",
                            gap: 1,
                            mb: 1,
                            justifyContent: "center",
                            mx: "auto"
                        }}
                    >
                        {/* Horizontal */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Horizontal
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localHorizontal || ""}
                                    onChange={(e) => handleNumberFieldChange("horizontalPosition", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                        {/* Vertical */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Vertical
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localVertical || ""}
                                    onChange={(e) => handleNumberFieldChange("verticalPosition", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                        {/* Blur */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Blur
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localBlur || ""}
                                    onChange={(e) => handleNumberFieldChange("blurRadius", e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    {/* Color picker */}
                    <Box sx={{ maxWidth: 185, mx: "auto" }}>
                        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                            Color
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1
                                }}
                            >
                                <Box
                                    onClick={() => colorInputRef.current?.click()}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: hexToRgba(localHex || "#000000", localAlpha),
                                        border: "1px solid #e0e0e0",
                                        borderRadius: 1,
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        "&:hover": {
                                            opacity: disabled ? 1 : 0.8
                                        },
                                        transition: "opacity 0.2s"
                                    }}
                                />
                                <input
                                    ref={colorInputRef}
                                    type="color"
                                    value={localHex || "#000000"}
                                    onChange={(e) => {
                                        const newHex = e.target.value;
                                        setLocalHex(newHex);
                                        handleColorChange(hexToRgba(newHex, localAlpha));
                                    }}
                                    disabled={disabled}
                                    style={{
                                        position: "absolute",
                                        width: 0,
                                        height: 0,
                                        opacity: 0,
                                        pointerEvents: "none"
                                    }}
                                />
                                <TextField
                                    size="small"
                                    value={localHex || "#000000"}
                                    onChange={(e) => {
                                        const newHex = e.target.value;
                                        setLocalHex(newHex);
                                        // Only update color if valid hex
                                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newHex)) {
                                            handleColorChange(hexToRgba(newHex, localAlpha));
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
                                        // If still invalid, revert to current
                                        if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) {
                                            hex = localHex || "#000000";
                                        }
                                        setLocalHex(hex);
                                        handleColorChange(hexToRgba(hex, localAlpha));
                                    }}
                                    disabled={disabled}
                                    sx={{ width: 120 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem" }
                                        }
                                    }}
                                    placeholder="#000000"
                                />
                                {isEyeDropperSupported && (
                                    <Tooltip title="Pick color from page">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={handleEyedropperClick}
                                                disabled={disabled}
                                                sx={{
                                                    p: 0.5,
                                                    opacity: disabled ? 0.5 : 1
                                                }}
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
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography variant="caption">
                                    Opacity
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: "medium" }}>
                                    {Math.round(localAlpha * 100)}%
                                </Typography>
                            </Box>
                            <Slider
                                value={localAlpha * 100}
                                onChange={(_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
                                    const newAlpha = typeof newValue === "number" ? newValue / 100 : newValue[0] / 100;
                                    setLocalAlpha(newAlpha);
                                    handleColorChange(hexToRgba(localHex || "#000000", newAlpha));
                                }}
                                min={0}
                                max={100}
                                step={1}
                                size="small"
                                disabled={disabled}
                                valueLabelDisplay="off"
                            />
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

const DebouncedBorderPicker = ({
    value,
    onChange,
    disabled,
    sx
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    sx?: Record<string, unknown>;
}) => {
    const initialValue = value || "1px solid #000000";
    const parsedBorder = parseBorder(initialValue);
    const initialColor = parsedBorder.color || "#000000";
    const initialParsedColor = parseColor(initialColor);
    const [localWidth, setLocalWidth] = useState(extractNumber(parsedBorder.width));
    const [localStyle, setLocalStyle] = useState(parsedBorder.style);
    const [localColor, setLocalColor] = useState(initialColor);
    const [localHex, setLocalHex] = useState(initialParsedColor.hex);
    const [localAlpha, setLocalAlpha] = useState(initialParsedColor.alpha);
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastEmittedValueRef = useRef<string>(initialValue);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const open = Boolean(anchorEl);

    const borderStyles = [
        "solid",
        "dashed",
        "dotted",
        "double",
        "groove",
        "ridge",
        "inset",
        "outset",
        "none",
        "hidden"
    ];

    // Update local values when prop changes
    useEffect(() => {
        const currentValue = value || "1px solid #000000";
        if (currentValue !== lastEmittedValueRef.current) {
            const parsed = parseBorder(currentValue);
            setLocalWidth(extractNumber(parsed.width));
            setLocalStyle(parsed.style);
            setLocalColor(parsed.color);
            const parsedColorValue = parseColor(parsed.color || "#000000");
            setLocalHex(parsedColorValue.hex);
            setLocalAlpha(parsedColorValue.alpha);
            lastEmittedValueRef.current = currentValue;
        }
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const updateBorder = (width: string, style: string, color: string) => {
        const widthPx = width ? `${width}px` : "1px";
        const newValue = `${widthPx} ${style} ${color}`;
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the onChange callback
        timeoutRef.current = setTimeout(() => {
            lastEmittedValueRef.current = newValue;
            onChange(newValue);
        }, 150);
    };

    const handleWidthChange = (newValue: string) => {
        // Only allow numeric input with optional decimal
        const validPattern = /^\d*\.?\d*$/;
        if (!validPattern.test(newValue)) {
            return;
        }
        setLocalWidth(newValue);
        updateBorder(newValue, localStyle, localColor);
    };

    const handleStyleChange = (newStyle: string) => {
        setLocalStyle(newStyle);
        updateBorder(localWidth, newStyle, localColor);
    };

    const handleColorChange = (newColor: string) => {
        setLocalColor(newColor);
        const parsed = parseColor(newColor);
        setLocalHex(parsed.hex);
        setLocalAlpha(parsed.alpha);
        updateBorder(localWidth, localStyle, newColor);
    };

    const handleTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const isEyeDropperSupported =
        typeof window !== "undefined" && "EyeDropper" in window;

    const handleEyedropperClick = async () => {
        if (disabled || !isEyeDropperSupported) return;
        try {
            const EyeDropperConstructor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
            const eyeDropper = new EyeDropperConstructor();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex;
            handleColorChange(hexToRgba(hex, localAlpha));
        } catch {
            // User cancelled or error - ignore
        }
    };

    const currentValue = value || "1px solid #000000";
    const displayText = formatBorderString(currentValue);
    const borderValue = `${localWidth || "1"}px ${localStyle || "solid"} ${localColor || "#000000"}`;
    
    // Extract color for display box - use localColor for real-time updates
    const displayColor = localColor || parsedBorder.color || "#000000";

    return (
        <>
            <Box
                onClick={handleTextClick}
                sx={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    padding: "4px 8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": {
                        backgroundColor: disabled ? "#fff" : "#f5f5f5",
                        borderColor: disabled ? "#e0e0e0" : "#bdbdbd"
                    },
                    transition: "all 0.2s",
                    fontSize: "0.875rem",
                    minWidth: 80,
                    maxWidth: 200,
                    ...sx
                }}
            >
                <Box sx={{ flex: 1, textAlign: "center" }}>
                    {displayText}
                </Box>
                <Box
                    sx={{
                        width: 20,
                        height: 20,
                        minWidth: 20,
                        backgroundImage:
                            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "10px 10px",
                        backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        flexShrink: 0,
                        position: "relative",
                        overflow: "hidden",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            backgroundColor: displayColor,
                            borderRadius: "inherit"
                        }
                    }}
                />
            </Box>
            {/* Border picker popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <Box sx={{ p: 1.5, minWidth: 240 }}>
                    {/* Visual border diagram */}
                    <Box sx={{ mb: 1.5 }}>
                        {/* <Typography variant="subtitle1" sx={{ mb: 1.5, display: "block" }}>
                            Border
                        </Typography> */}
                        <Box
                            sx={{
                                position: "relative",
                                height: 90,
                                width: '100%',
                                mx: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: 'hidden'
                            }}
                        >
                            {/* Rectangle with border */}
                            <Box
                                sx={{
                                    backgroundColor: "#fff",
                                    border: borderValue,
                                    borderRadius: 1,
                                    minWidth: 100,
                                    minHeight: 80,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    color: "#666"
                                }}
                            >
                                Content
                            </Box>
                        </Box>
                    </Box>
                    {/* Input fields */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "auto auto",
                            gap: 1,
                            mb: 1,
                            justifyContent: "center",
                            mx: "auto"
                        }}
                    >
                        {/* Width */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Width
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    value={localWidth || ""}
                                    onChange={(e) => handleWidthChange(e.target.value)}
                                    disabled={disabled}
                                    sx={{ width: 70 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem", textAlign: "right", pr: 0.5 }
                                        }
                                    }}
                                    placeholder="1"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: "0.875rem",
                                        color: "text.secondary",
                                        userSelect: "none"
                                    }}
                                >
                                    px
                                </Typography>
                            </Box>
                        </Box>
                        {/* Style */}
                        <Box>
                            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                Style
                            </Typography>
                            <FormControl size="small" sx={{ width: 100 }}>
                                <Select
                                    value={localStyle || "solid"}
                                    onChange={(e) => handleStyleChange(e.target.value)}
                                    disabled={disabled}
                                    sx={{ fontSize: "0.875rem" }}
                                >
                                    {borderStyles.map((styleOption) => (
                                        <MenuItem
                                            key={styleOption}
                                            value={styleOption}
                                            sx={{ fontSize: "0.875rem" }}
                                        >
                                            {styleOption}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    {/* Color picker */}
                    <Box sx={{ maxWidth: 185, mx: "auto" }}>
                        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                            Color
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1
                                }}
                            >
                                <Box
                                    onClick={() => colorInputRef.current?.click()}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: hexToRgba(localHex || "#000000", localAlpha),
                                        border: "1px solid #e0e0e0",
                                        borderRadius: 1,
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        "&:hover": {
                                            opacity: disabled ? 1 : 0.8
                                        },
                                        transition: "opacity 0.2s"
                                    }}
                                />
                                <input
                                    ref={colorInputRef}
                                    type="color"
                                    value={localHex || "#000000"}
                                    onChange={(e) => {
                                        const newHex = e.target.value;
                                        setLocalHex(newHex);
                                        handleColorChange(hexToRgba(newHex, localAlpha));
                                    }}
                                    disabled={disabled}
                                    style={{
                                        position: "absolute",
                                        width: 0,
                                        height: 0,
                                        opacity: 0,
                                        pointerEvents: "none"
                                    }}
                                />
                                <TextField
                                    size="small"
                                    value={localHex || "#000000"}
                                    onChange={(e) => {
                                        const newHex = e.target.value;
                                        setLocalHex(newHex);
                                        // Only update color if valid hex
                                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newHex)) {
                                            handleColorChange(hexToRgba(newHex, localAlpha));
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
                                        // If still invalid, revert to current
                                        if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) {
                                            hex = localHex || "#000000";
                                        }
                                        setLocalHex(hex);
                                        handleColorChange(hexToRgba(hex, localAlpha));
                                    }}
                                    disabled={disabled}
                                    sx={{ width: 120 }}
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem" }
                                        }
                                    }}
                                    placeholder="#000000"
                                />
                                {isEyeDropperSupported && (
                                    <Tooltip title="Pick color from page">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={handleEyedropperClick}
                                                disabled={disabled}
                                                sx={{
                                                    p: 0.5,
                                                    opacity: disabled ? 0.5 : 1
                                                }}
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
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography variant="caption">
                                    Opacity
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: "medium" }}>
                                    {Math.round(localAlpha * 100)}%
                                </Typography>
                            </Box>
                            <Slider
                                value={localAlpha * 100}
                                onChange={(_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
                                    const newAlpha = typeof newValue === "number" ? newValue / 100 : newValue[0] / 100;
                                    setLocalAlpha(newAlpha);
                                    handleColorChange(hexToRgba(localHex || "#000000", newAlpha));
                                }}
                                min={0}
                                max={100}
                                step={1}
                                size="small"
                                disabled={disabled}
                                valueLabelDisplay="off"
                            />
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

export const StylingTab = ({ stylesFilter = "all" }: { stylesFilter?: StylesFilter }) => {
    const dispatch = useDispatch();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { componentSchema, styleTabDefaultValues, styleTabValues, stylingUIState, savedTheme, portalIcons, themeUrl, fonts } =
        useSelector((state: RootState) => state.app);
    const [fontManagerDialogOpen, setFontManagerDialogOpen] = useState(false);

    const enabledCssVariables = useMemo(() => {
        return new Set(
            Object.entries(styleTabValues || {})
                .filter(([, v]) => v?.isEnabled === true)
                .map(([cssVar]) => cssVar)
        );
    }, [styleTabValues]);

    const stylesToRender = useMemo(() => {
        const baseStyles = componentSchema?.styles || [];
        if (stylesFilter === "all") return baseStyles;
        return filterStyleItems(
            baseStyles,
            stylesFilter,
            stylesFilter === "changed" ? enabledCssVariables : undefined
        );
    }, [componentSchema, stylesFilter, enabledCssVariables]);

    const { control, subscribe, reset } = useForm({
        defaultValues: styleTabDefaultValues
    });

    const [expandedAccordions, setExpandedAccordions] = useState<string[]>(
        stylingUIState.expandedAccordions || []
    );
    const [fieldMenuAnchor, setFieldMenuAnchor] = useState<{
        element: HTMLElement | null;
        field: StyleField | null;
    }>({ element: null, field: null });

    const findFieldById = useCallback(
        (items: (StyleField | StyleGroup)[], id: string): StyleField | null => {
            for (const item of items) {
                if ("id" in item && item.id === id) {
                    return item as StyleField;
                }
                if ("fields" in item && item.fields) {
                    const found = findFieldById(item.fields, id);
                    if (found) return found;
                }
            }
            return null;
        },
        []
    );

    const handleFieldMenuOpen = useCallback(
        (event: React.MouseEvent<HTMLElement>, field: StyleField) => {
            setFieldMenuAnchor({ element: event.currentTarget, field });
        },
        []
    );

    const handleFieldMenuClose = useCallback(() => {
        setFieldMenuAnchor({ element: null, field: null });
    }, []);

    const handleFieldResetToPreviousSaved = useCallback(() => {
        const field = fieldMenuAnchor.field;

        if (!savedTheme || !field) {
            handleFieldMenuClose();

            return;
        }

        const savedFieldValue = savedTheme[field.cssVariable];
        const schemaField = findFieldById(componentSchema?.styles || [], field.id);

        dispatch(updateStylingTabValuesWithDefault({
            [field.cssVariable]: {
                id: field.id,
                value: savedFieldValue ?? schemaField?.defaultValue,
                isEnabled: Boolean(savedFieldValue !== undefined) ?? false,
                themeKey: field?.themeKey
            }
        }));

        handleFieldMenuClose();
    }, [fieldMenuAnchor.field, savedTheme, findFieldById, componentSchema?.styles, dispatch, handleFieldMenuClose]);

    const handleFieldResetToDefault = useCallback(() => {
        const field = fieldMenuAnchor.field;

        if (!field) {
            handleFieldMenuClose();

            return;
        }

        const schemaField = findFieldById(componentSchema?.styles || [], field.id);
        const defaultValue = schemaField?.defaultValue;

        if (!schemaField || defaultValue === undefined) {
            handleFieldMenuClose();

            return;
        }

        dispatch(updateStylingTabValuesWithDefault({
            [field.cssVariable]: {
                id: field.id,
                value: defaultValue,
                isEnabled: false,
                themeKey: field?.themeKey
            }
        }));

        handleFieldMenuClose();
    }, [fieldMenuAnchor.field, findFieldById, componentSchema?.styles, dispatch, handleFieldMenuClose]);

    useEffect(() => {
        const callback = subscribe({
            formState: {
                values: true
            },
            callback: ({ values }) => {
                const stylingTabValues: StylingTabValues = {};

                Object.entries(values).forEach(([key, value]) => {
                    if (value !== undefined) {
                        const field = findFieldById(
                            componentSchema?.styles || [],
                            key
                        );
                        if (field?.cssVariable) {
                            const enabledKey = `${key}_enabled`;
                            const isEnabled = field.type === "image" || field.type === "staticImage" ? true : Boolean(values[enabledKey]);
                            const resolvedValue =
                                field.type === "staticImage" && themeUrl && (field.defaultValue ?? value)
                                    ? `/${themeUrl}/${field.defaultValue ?? value}` // remove hostname and leave absolute path once moved to real CMS
                                    : value;
                            stylingTabValues[field.cssVariable] = {
                                id: field.id,
                                value: resolvedValue,
                                themeKey: field?.themeKey,
                                isEnabled
                            };
                        }
                    }
                });

                dispatch(updateStylingTabValues(stylingTabValues));
            }
        });

        return () => callback();
    }, [componentSchema?.styles, dispatch, findFieldById, subscribe, themeUrl]);

    // useEffect(() => {
    //     if (currentComponentSchema.current !== componentSchema) {
    //         currentComponentSchema.current = componentSchema;
    //         reset(styleTabDefaultValues);
    //     }
    // }, [componentSchema, reset, styleTabDefaultValues]);

    useEffect(() => {
        reset(styleTabDefaultValues);
    }, [reset, styleTabDefaultValues]);

    useEffect(() => () => {
            dispatch(updateStylingTabDefaultValues());
    }, [dispatch]);

    // Restore scroll position when component mounts
    useEffect(() => {
        if (scrollContainerRef.current && stylingUIState.scrollPosition) {
            scrollContainerRef.current.scrollTop =
                stylingUIState.scrollPosition;
        }
    }, [stylingUIState.scrollPosition]);

    // Save scroll position when it changes
    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const scrollTop = e.currentTarget.scrollTop;
            dispatch(setStylingTabUIState({ scrollPosition: scrollTop }));
        },
        [dispatch]
    );

    // Save expanded accordions when they change
    useEffect(() => {
        dispatch(setStylingTabUIState({ expandedAccordions }));
    }, [expandedAccordions, dispatch]);

    // Restore expanded accordions when stylingUIState changes
    useEffect(() => {
        if (stylingUIState.expandedAccordions) {
            setExpandedAccordions(stylingUIState.expandedAccordions);
        }
    }, [stylingUIState.expandedAccordions]);

    if (!componentSchema) {
        return (
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%"
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    No style schema available for this page
                </Typography>
            </Box>
        );
    }

    const renderControl = (field: StyleField) => {
        const {
            id,
            type,
            options,
            min,
            max,
            step,
            checkedValue,
            uncheckedValue,
            defaultValue = ""
        } = field;

        const isFieldEnabled =
            type === "image" || type === "staticImage"
                ? true
                : (styleTabValues?.[field.cssVariable]?.isEnabled ?? false);

        switch (type) {
            case "text":
                return (
                    <Controller
                        name={id}
                        control={control}
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                value={fieldProps.value || ""}
                                size="small"
                                fullWidth
                                disabled={!isFieldEnabled}
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem" }
                                    }
                                }}
                                variant="outlined"
                            />
                        )}
                    />
                );

            case "number":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                type="number"
                                size="small"
                                fullWidth
                                disabled={!isFieldEnabled}
                                variant="outlined"
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem" }
                                    }
                                }}
                            />
                        )}
                    />
                );

            case "boolean":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => {
                            const actualCheckedValue =
                                checkedValue !== undefined
                                    ? checkedValue
                                    : true;
                            const actualUncheckedValue =
                                uncheckedValue !== undefined
                                    ? uncheckedValue
                                    : false;

                            const isChecked =
                                fieldProps.value === actualCheckedValue;

                            const handleChange = (
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                const newValue = e.target.checked
                                    ? actualCheckedValue
                                    : actualUncheckedValue;
                                fieldProps.onChange(newValue);
                            };

                            return (
                                <Switch
                                    checked={isChecked}
                                    onChange={handleChange}
                                    size="small"
                                    disabled={!isFieldEnabled}
                                />
                            );
                        }}
                    />
                );

            case "select":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <FormControl size="small" fullWidth>
                                <Select
                                    {...fieldProps}
                                    value={fieldProps.value ?? ""}
                                    variant="outlined"
                                    disabled={!isFieldEnabled}
                                    sx={{ fontSize: "0.875rem" }}
                                >
                                    {options?.map((option: string) => (
                                        <MenuItem
                                            key={option}
                                            sx={{ fontSize: "0.875rem" }}
                                            value={option}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    />
                );

            case "radio":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <RadioGroup {...fieldProps} row sx={{ gap: 1 }}>
                                {options?.map((option: string) => (
                                    <FormControlLabel
                                        key={option}
                                        value={option}
                                        control={
                                            <Radio
                                                size="small"
                                                disabled={!isFieldEnabled}
                                            />
                                        }
                                        slotProps={{
                                            typography: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        label={option}
                                        sx={{ mr: 1 }}
                                    />
                                ))}
                            </RadioGroup>
                        )}
                    />
                );

            case "slider":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue ?? 0}
                        render={({ field: fieldProps }) => (
                            <Box sx={{ px: 1 }}>
                                <Slider
                                    {...fieldProps}
                                    value={
                                        typeof fieldProps.value === "number"
                                            ? fieldProps.value
                                            : 0
                                    }
                                    min={min}
                                    max={max}
                                    step={step}
                                    size="small"
                                    disabled={!isFieldEnabled}
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        )}
                    />
                );

            case "color":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "#000000"}
                        render={({ field: fieldProps }) => (
                            <DebouncedColorPicker
                                value={(fieldProps.value as string) || "#000000"}
                                onChange={fieldProps.onChange}
                                disabled={!isFieldEnabled}
                            />
                        )}
                    />
                );

            case "image":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => {
                            const iconKey = String(defaultValue ?? fieldProps.value ?? "");
                            const iconUrl = portalIcons?.[iconKey];

                            return <PortalIconImagePicker iconUrl={iconUrl} iconKey={iconKey} />;
                        }}
                    />
                );

            case "staticImage":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={() => {
                            const iconKey = String(defaultValue ?? "");
                            const iconUrl = themeUrl ? `/${themeUrl}/${defaultValue}` : undefined; // remove hostname and leave absolute path once moved to real CMS

                            return <PortalIconImagePicker iconUrl={iconUrl} iconKey={iconKey} />;
                        }}
                    />
                );

            case "units":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => {
                            const parseValue = (value: string) => {
                                const match = value.match(/^(-?\d*\.?\d*)(.*)$/);
                                return {
                                    number: match?.[1] || "",
                                    unit: match?.[2] || "px"
                                };
                            };

                            const { number, unit } = parseValue(
                                (fieldProps.value as string) || ""
                            );

                            const handleNumberChange = (
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                const inputValue = e.target.value;
                                const validPattern = /^(-?\d*\.?\d*)$/;

                                if (validPattern.test(inputValue)) {
                                    const newValue = `${inputValue.trim()}${unit}`;
                                    fieldProps.onChange(newValue);
                                }
                            };

                            const handleUnitChange = (e: {
                                target: { value: string };
                            }) => {
                                const newUnit = e.target.value;
                                const newValue = `${number.trim()}${newUnit}`;
                                fieldProps.onChange(newValue);
                            };

                            const fontUnits = ["px", "rem", "em", "%"];

                            return (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center"
                                    }}
                                >
                                    <TextField
                                        type="text"
                                        value={number || ""}
                                        onChange={handleNumberChange}
                                        size="small"
                                        variant="outlined"
                                        disabled={!isFieldEnabled}
                                        sx={{ width: 80 }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="16"
                                    />
                                    <FormControl
                                        size="small"
                                        sx={{ minWidth: 60 }}
                                    >
                                        <Select
                                            value={unit}
                                            onChange={handleUnitChange}
                                            variant="outlined"
                                            disabled={!isFieldEnabled}
                                            sx={{ fontSize: "0.875rem" }}
                                        >
                                            {fontUnits.map((unitOption) => (
                                                <MenuItem
                                                    key={unitOption}
                                                    value={unitOption}
                                                    sx={{
                                                        fontSize: "0.875rem"
                                                    }}
                                                >
                                                    {unitOption}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            );
                        }}
                    />
                );

            case "textShadow":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px #000000"}
                        render={({ field: fieldProps }) => (
                            <DebouncedTextShadowPicker
                                value={(fieldProps.value as string) || "0px 0px 0px #000000"}
                                onChange={fieldProps.onChange}
                                disabled={!isFieldEnabled}
                            />
                        )}
                    />
                );

            case "boxShadow":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={
                            defaultValue || "0px 0px 0px 0px rgba(0, 0, 0, 0.5)"
                        }
                        render={({ field: fieldProps }) => (
                            <DebouncedBoxShadowPicker
                                value={(fieldProps.value as string) || "0px 0px 0px 0px rgba(0, 0, 0, 0.5)"}
                                onChange={fieldProps.onChange}
                                disabled={!isFieldEnabled}
                            />
                        )}
                    />
                );

            case "padding":
            case "margin":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px 0px"}
                        render={({ field: fieldProps }) => (
                            <DebouncedPaddingPicker
                                value={(fieldProps.value as string) || "0px 0px 0px 0px"}
                                onChange={fieldProps.onChange}
                                disabled={!isFieldEnabled}
                            />
                        )}
                    />
                );

            case "border":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "1px solid #000000"}
                        render={({ field: fieldProps }) => (
                            <DebouncedBorderPicker
                                value={(fieldProps.value as string) || "1px solid #000000"}
                                onChange={fieldProps.onChange}
                                disabled={!isFieldEnabled}
                            />
                        )}
                    />
                );

            case "borderRadius":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px 0px"}
                        render={({ field: fieldProps }) => (
                            <DebouncedBorderRadiusPicker
                                value={(fieldProps.value as string) || "0px 0px 0px 0px"}
                                onChange={fieldProps.onChange}
                                disabled={!isFieldEnabled}
                            />
                        )}
                    />
                );

            case "font":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => {
                            const fontNames = fonts.map((f) => f.name);

                            return (
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1 }}>
                                    <Autocomplete
                                        freeSolo
                                        size="small"
                                        fullWidth
                                        options={fontNames}
                                        value={(fieldProps.value as string) ?? ""}
                                        disabled={!isFieldEnabled}
                                        onChange={(_, newValue) => {
                                            fieldProps.onChange(newValue ?? "");
                                        }}
                                        onInputChange={(_, newInputValue, reason) => {
                                            if (reason === "input") {
                                                fieldProps.onChange(newInputValue);
                                            }
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                slotProps={{
                                                    input: {
                                                        ...params.InputProps,
                                                        sx: { fontSize: "0.875rem" },
                                                    },
                                                }}
                                            />
                                        )}
                                    />
                                    <Tooltip title="Manage fonts">
                                        <IconButton
                                            size="small"
                                            onClick={() => setFontManagerDialogOpen(true)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            );
                        }}
                    />
                );

            default:
                return (
                    <Typography variant="caption" color="error">
                        Unsupported control type: {type}
                    </Typography>
                );
        }
    };

    const renderField = (field: StyleField) => {
        const showEnableCheckbox = field.type !== "image" && field.type !== "staticImage";

        return (
            <Box
                key={field.id}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.5,
                    px: 2,
                    borderBottom: "1px solid #e0e0e0"
                }}
            >
                <Box sx={{ width: "15%", minWidth: 60 }}>
                    {showEnableCheckbox ? (
                        <Controller
                            name={`${field.id}_enabled`}
                            control={control}
                            defaultValue={false}
                            render={({ field: checkboxField }) => (
                                <Checkbox
                                    checked={(checkboxField.value as boolean) || false}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        checkboxField.onChange(isChecked);
                                    }}
                                    size="small"
                                />
                            )}
                        />
                    ) : null}
                </Box>
                <Box sx={{ width: "35%", minWidth: 120 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {field.label}
                    </Typography>
                </Box>
                <Box sx={{ width: "50%", flex: 1 }}>{renderControl(field)}</Box>
                <Box sx={{ width: "auto", minWidth: 32 }}>
                    <Tooltip title="Field options">
                        <IconButton
                            size="small"
                            onClick={(e) => handleFieldMenuOpen(e, field)}
                            sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                        >
                            <MoreHoriz fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        );
    };

    const renderGroupAsSection = (group: StyleGroup) => {
        const isExpanded = expandedAccordions.includes(group.id || group.label);

        const handleAccordionChange = () => {
            const accordionId = group.id || group.label;
            setExpandedAccordions((prev) =>
                isExpanded
                    ? prev.filter((id) => id !== accordionId)
                    : [...prev, accordionId]
            );
        };

        return (
            <Box key={group.id}>
                <Accordion
                    expanded={isExpanded}
                    onChange={handleAccordionChange}
                    sx={{
                        boxShadow: "none",
                        "&:before": { display: "none" },
                        "&.Mui-expanded": { margin: 0 }
                    }}
                    disableGutters
                >
                    <AccordionSummary
                        sx={{
                            minHeight: 40,
                            borderBottom: "1px solid #e0e0e0",
                            "&.Mui-expanded": { minHeight: 40 },
                            px: 2,
                            "&:hover": {
                                backgroundColor: "#f5f5f5"
                            }
                        }}
                        expandIcon={<ExpandMoreIcon />}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                        >
                            {group.label}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box>
                            {group.fields?.map((field) => {
                                if ("type" in field) {
                                    const fieldOrGroup = field as
                                        | StyleField
                                        | StyleGroup;
                                    if (fieldOrGroup.type === "group") {
                                        return renderNestedGroupAsSection(
                                            fieldOrGroup as StyleGroup
                                        );
                                    } else {
                                        return renderField(
                                            fieldOrGroup as StyleField
                                        );
                                    }
                                } else {
                                    return renderField(field as StyleField);
                                }
                            })}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        );
    };

    const renderSectionTitleAsSection = (group: StyleGroup) => (
        <Box
            key={`section-${group.label}`}
            sx={{
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#f8f9fa",
                textAlign: "center"
            }}
        >
            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    padding: "12px 16px"
                }}
            >
                {group.label}
            </Typography>
        </Box>
    );

    const renderGroupTitleAsSection = (group: StyleGroup) => (
        <Box key={`group-title-${group.label}`} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, py: 1 }}>
                {group.label}
            </Typography>
        </Box>
    );

    const renderNestedGroupAsSection = (group: StyleGroup) => {
        const nestedId = `nested-${group.id || group.label}`;
        const isExpanded = expandedAccordions.includes(nestedId);

        const handleAccordionChange = () => {
            setExpandedAccordions((prev) =>
                isExpanded
                    ? prev.filter((id) => id !== nestedId)
                    : [...prev, nestedId]
            );
        };

        return (
            <Box key={group.id} sx={{ margin: "8px 16px" }}>
                <Accordion
                    expanded={isExpanded}
                    onChange={handleAccordionChange}
                    disableGutters
                    sx={{
                        boxShadow: "none",
                        "&:before": { display: "none" },
                        "&.Mui-expanded": { margin: 0 },
                        border: "none",
                        borderRadius: 0
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            minHeight: 36,
                            "&.Mui-expanded": { minHeight: 36 },
                            px: 2,
                            backgroundColor: "#f8f9fa",
                            "&:hover": {
                                backgroundColor: "#f1f1f1"
                            }
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                        >
                            {group.label}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box>
                            {group.fields?.map((field) => {
                                if ("type" in field) {
                                    const fieldOrGroup = field as
                                        | StyleField
                                        | StyleGroup;
                                    if (fieldOrGroup.type === "group") {
                                        return renderNestedGroupAsSection(
                                            fieldOrGroup as StyleGroup
                                        );
                                    } else {
                                        return renderField(
                                            fieldOrGroup as StyleField
                                        );
                                    }
                                } else {
                                    return renderField(field as StyleField);
                                }
                            })}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        );
    };

    // Memoize rendered items to prevent recalculation on every render
    const renderItems = () => {
        const sections: JSX.Element[] = [];
        const fieldRows: JSX.Element[] = [];

        stylesToRender.forEach((item) => {
            if ("type" in item) {
                const itemTyped = item as StyleField | StyleGroup;
                if (itemTyped.type === "group") {
                    sections.push(
                        renderGroupAsSection(itemTyped as StyleGroup)
                    );
                } else if (itemTyped.type === "sectionTitle") {
                    sections.push(
                        renderSectionTitleAsSection(itemTyped as StyleGroup)
                    );
                } else if (itemTyped.type === "groupTitle") {
                    sections.push(
                        renderGroupTitleAsSection(itemTyped as StyleGroup)
                    );
                } else {
                    fieldRows.push(renderField(itemTyped as StyleField));
                }
            } else {
                fieldRows.push(renderField(item as StyleField));
            }
        });

        return { sections, fieldRows };
    };

    // Show loading state during initialization to prevent heavy rendering during tab transitions
    if (!componentSchema) {
        return (
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%"
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    No style schema available for this page
                </Typography>
            </Box>
        );
    }

    const { sections, fieldRows } = renderItems();

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{ flex: 1, overflow: "auto" }}
            >
                {sections}
                {fieldRows.length > 0 && (
                    <Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                                backgroundColor: "#f8f9fa",
                                borderBottom: "2px solid #e0e0e0",
                                fontWeight: 600,
                                position: "sticky",
                                top: 0,
                                zIndex: 1
                            }}
                        >
                            <Box sx={{ width: "15%", minWidth: 60 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    Enable
                                </Typography>
                            </Box>
                            <Box sx={{ width: "35%", minWidth: 120 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    Name
                                </Typography>
                            </Box>
                            <Box sx={{ width: "50%", flex: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    Control
                                </Typography>
                            </Box>
                            <Box sx={{ width: "auto", minWidth: 32 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    {/* Options column header - empty */}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>{fieldRows}</Box>
                    </Box>
                )}
            </Box>

            {/* Field Context Menu */}
            <Menu
                anchorEl={fieldMenuAnchor.element}
                open={Boolean(fieldMenuAnchor.element)}
                onClose={handleFieldMenuClose}
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
                    onClick={handleFieldResetToPreviousSaved}
                    sx={{ fontSize: "0.875rem" }}
                >
                    <Restore sx={{ mr: 1, fontSize: "1rem" }} />
                    Reset to Previous Saved
                </MenuItem>
                <MenuItem
                    onClick={handleFieldResetToDefault}
                    sx={{ fontSize: "0.875rem" }}
                >
                    <RestartAlt sx={{ mr: 1, fontSize: "1rem" }} />
                    Reset to Default
                </MenuItem>
            </Menu>

            <FontManagerDialog
                open={fontManagerDialogOpen}
                onClose={() => setFontManagerDialogOpen(false)}
                fonts={fonts}
            />
        </Box>
    );
};
