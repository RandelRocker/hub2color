import { useState, useRef } from "react";
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Radio,
    RadioGroup,
    FormControl,
    FormControlLabel,
    Select,
    MenuItem,
    Chip,
    Tooltip,
    Divider,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    UploadFile as UploadFileIcon,
} from "@mui/icons-material";

import { FontItem } from "../../../../../store/types";
import { DialogStep, FontSourceType, FontFormState } from "./types";
import {
    FONT_STYLE_OPTIONS,
    FONT_WEIGHT_OPTIONS,
    FONT_DISPLAY_OPTIONS,
    ACCEPTED_FONT_FILE_TYPES,
    GOOGLE_FONT_LINK_HINT,
} from "./constants";

interface FontManagerDialogProps {
    open: boolean;
    onClose: () => void;
    fonts: FontItem[];
}

const getInitialFormState = (): FontFormState => ({
    sourceType: "file",
    fontFile: {
        fontName: "",
        fontStyle: "normal",
        fontWeight: ["400"],
        fontDisplay: "swap",
        unicodeRange: "",
        fontFile: null,
    },
    googleFont: {
        googleFontLink: "",
    },
});

const getFontTypeLabel = (type: FontItem["type"]) => {
    if (type === "file") return "Font file";
    if (type === "import") return "Google font";
    return type;
};

export const FontManagerDialog = ({ open, onClose, fonts }: FontManagerDialogProps) => {
    const [step, setStep] = useState<DialogStep>(DialogStep.FONT_LIST);
    const [formState, setFormState] = useState<FontFormState>(getInitialFormState());
    const [editingFontIndex, setEditingFontIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const customFonts = fonts.filter((f) => f.type !== "default");

    const handleClose = () => {
        setStep(DialogStep.FONT_LIST);
        setFormState(getInitialFormState());
        setEditingFontIndex(null);
        onClose();
    };

    const handleAddNew = () => {
        setFormState(getInitialFormState());
        setEditingFontIndex(null);
        setStep(DialogStep.FONT_FORM);
    };

    const handleEdit = (index: number) => {
        const font = customFonts[index];
        const sourceType: FontSourceType = font.type === "import" ? "import" : "file";

        setFormState({
            sourceType,
            fontFile: {
                fontName: font.name,
                fontStyle: font.fontStyle || "normal",
                fontWeight: font.fontWeight ? font.fontWeight.split(",").map((w) => w.trim()) : ["400"],
                fontDisplay: font.fontDisplay || "swap",
                unicodeRange: font.unicodeRange || "",
                fontFile: null,
            },
            googleFont: {
                googleFontLink: font.type === "import" ? (font.url || "") : "",
            },
        });
        setEditingFontIndex(index);
        setStep(DialogStep.FONT_FORM);
    };

    const handleBackToList = () => {
        setStep(DialogStep.FONT_LIST);
        setFormState(getInitialFormState());
        setEditingFontIndex(null);
    };

    const handleSourceTypeChange = (value: FontSourceType) => {
        setFormState((prev) => ({ ...prev, sourceType: value }));
    };

    const handleFontFileFieldChange = <K extends keyof FontFormState["fontFile"]>(
        field: K,
        value: FontFormState["fontFile"][K]
    ) => {
        setFormState((prev) => ({
            ...prev,
            fontFile: { ...prev.fontFile, [field]: value },
        }));
    };

    const handleGoogleFontFieldChange = (value: string) => {
        setFormState((prev) => ({
            ...prev,
            googleFont: { ...prev.googleFont, googleFontLink: value },
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        handleFontFileFieldChange("fontFile", file);
    };

    const handleFontWeightToggle = (weight: string) => {
        setFormState((prev) => {
            const currentWeights = prev.fontFile.fontWeight;
            const newWeights = currentWeights.includes(weight)
                ? currentWeights.filter((w) => w !== weight)
                : [...currentWeights, weight];

            if (newWeights.length === 0) return prev;

            return {
                ...prev,
                fontFile: { ...prev.fontFile, fontWeight: newWeights },
            };
        });
    };

    const renderFontList = () => (
        <>
            <DialogTitle>Manage fonts</DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {customFonts.length === 0 ? (
                    <Box sx={{ p: 2 }}>
                        <Typography color="text.secondary" variant="body2">
                            No custom fonts added yet
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {customFonts.map((font, index) => (
                            <ListItem
                                key={`${font.name}-${index}`}
                                sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                                secondaryAction={
                                    <Box>
                                        <Tooltip title="Edit font">
                                            <IconButton size="small" onClick={() => handleEdit(index)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete font">
                                            <IconButton size="small">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={font.name}
                                    secondary={getFontTypeLabel(font.type)}
                                    slotProps={{
                                        primary: { sx: { fontWeight: 500, fontSize: "0.875rem" } },
                                        secondary: { sx: { fontSize: "0.75rem" } },
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
                <Button onClick={handleAddNew} variant="contained" startIcon={<AddIcon />}>
                    Add new font
                </Button>
            </DialogActions>
        </>
    );

    const renderFontForm = () => {
        const isEditing = editingFontIndex !== null;
        const title = isEditing ? "Edit font" : "Add new font";

        return (
            <>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton size="small" onClick={handleBackToList} sx={{ mr: 0.5 }}>
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    {title}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <FormControl>
                            <RadioGroup
                                row
                                value={formState.sourceType}
                                onChange={(e) => handleSourceTypeChange(e.target.value as FontSourceType)}
                            >
                                <FormControlLabel
                                    value="file"
                                    control={<Radio size="small" />}
                                    label="Font file"
                                    slotProps={{ typography: { sx: { fontSize: "0.875rem" } } }}
                                />
                                <FormControlLabel
                                    value="import"
                                    control={<Radio size="small" />}
                                    label="Google font"
                                    slotProps={{ typography: { sx: { fontSize: "0.875rem" } } }}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {formState.sourceType === "file" ? renderFontFileFields() : renderGoogleFontFields()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBackToList}>Back</Button>
                </DialogActions>
            </>
        );
    };

    const renderFontFileFields = () => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
                <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                    Font name
                </Typography>
                <TextField
                    size="small"
                    fullWidth
                    variant="outlined"
                    value={formState.fontFile.fontName}
                    onChange={(e) => handleFontFileFieldChange("fontName", e.target.value)}
                    slotProps={{ input: { sx: { fontSize: "0.875rem" } } }}
                />
            </Box>

            <Box>
                <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                    Font style
                </Typography>
                <FormControl size="small" fullWidth>
                    <Select
                        value={formState.fontFile.fontStyle}
                        onChange={(e) => handleFontFileFieldChange("fontStyle", e.target.value)}
                        sx={{ fontSize: "0.875rem" }}
                    >
                        {FONT_STYLE_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option} sx={{ fontSize: "0.875rem" }}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box>
                <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                    Font weight
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {FONT_WEIGHT_OPTIONS.map((weight) => {
                        const isSelected = formState.fontFile.fontWeight.includes(weight);
                        return (
                            <Chip
                                key={weight}
                                label={weight}
                                size="small"
                                variant={isSelected ? "filled" : "outlined"}
                                color={isSelected ? "primary" : "default"}
                                onClick={() => handleFontWeightToggle(weight)}
                                sx={{ fontSize: "0.75rem" }}
                            />
                        );
                    })}
                </Box>
            </Box>

            <Box>
                <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                    Font display
                </Typography>
                <FormControl size="small" fullWidth>
                    <Select
                        value={formState.fontFile.fontDisplay}
                        onChange={(e) => handleFontFileFieldChange("fontDisplay", e.target.value)}
                        sx={{ fontSize: "0.875rem" }}
                    >
                        {FONT_DISPLAY_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option} sx={{ fontSize: "0.875rem" }}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box>
                <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                    Unicode range
                </Typography>
                <TextField
                    size="small"
                    fullWidth
                    variant="outlined"
                    value={formState.fontFile.unicodeRange}
                    onChange={(e) => handleFontFileFieldChange("unicodeRange", e.target.value)}
                    slotProps={{ input: { sx: { fontSize: "0.875rem" } } }}
                />
            </Box>

            <Box>
                <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                    Font file
                </Typography>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FONT_FILE_TYPES}
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ textTransform: "none", fontSize: "0.875rem" }}
                >
                    {formState.fontFile.fontFile ? formState.fontFile.fontFile.name : "Choose file"}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Accepted formats: woff2, woff, ttf
                </Typography>
            </Box>
        </Box>
    );

    const renderGoogleFontFields = () => (
        <Box>
            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                Google font link
            </Typography>
            <TextField
                size="small"
                fullWidth
                variant="outlined"
                value={formState.googleFont.googleFontLink}
                onChange={(e) => handleGoogleFontFieldChange(e.target.value)}
                slotProps={{ input: { sx: { fontSize: "0.875rem" } } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {GOOGLE_FONT_LINK_HINT}
            </Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            {step === DialogStep.FONT_LIST ? renderFontList() : renderFontForm()}
        </Dialog>
    );
};
