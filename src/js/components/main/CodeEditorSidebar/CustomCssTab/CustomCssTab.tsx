import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Button,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from "@mui/material";
import Editor, { loader } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { setCustomCss } from "../../../../store/actions";

import { useTagsByType } from "../hooks/useTagsByType";

interface CustomCssTabProps {
    dialogOpen: boolean;
    onDialogClose: () => void;
}

export interface CustomCssTabHandle {
    loadTag: (value: string) => void;
}

export const CustomCssTab = forwardRef<CustomCssTabHandle, CustomCssTabProps>(({ dialogOpen, onDialogClose }, ref) => {
    const dispatch = useDispatch();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { customCss } = useSelector((state: RootState) => state.app);
    const [localCss, setLocalCss] = useState(customCss);
    const [tagName, setTagName] = useState("");
    const [tagDescription, setTagDescription] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const [dialogTabIndex, setDialogTabIndex] = useState(0);
    const [selectedTagId, setSelectedTagId] = useState("");

    const { tags, loading } = useTagsByType("custom_css", dialogOpen);
    
    useEffect(() => {
        setLocalCss(customCss);
    }, [customCss]);

    useImperativeHandle(ref, () => ({
        loadTag: (value: string) => {
            setLocalCss(value);
            dispatch(setCustomCss(value));
        }
    }), [dispatch]);

    useEffect(() => {
        loader.init().then((monaco) => {
            monaco.editor.defineTheme("customTheme", {
                base: "vs", // or 'vs-dark', 'hc-black'
                inherit: true,
                rules: [],
                colors: {
                    "editorGutter.background": "#f8f9fa" // Example: gutter background
                }
            });
        });
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleEditorChange = (value: string = "") => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the onChange callback
        timeoutRef.current = setTimeout(() => {
            dispatch(setCustomCss(value));
        }, 500);

        setLocalCss(value);
    };

    useEffect(() => {
        if (dialogOpen) {
            setDialogTabIndex(0);
            setSelectedTagId("");
        }
    }, [dialogOpen]);

    const handleDialogClose = () => {
        setTagName("");
        setTagDescription("");
        setDialogTabIndex(0);
        setSelectedTagId("");
        onDialogClose();
    };

    const handleCreateTag = () => {
        dispatch(setCustomCss(localCss));
        handleDialogClose();
    };

    const handleUpdateTag = () => {
        dispatch(setCustomCss(localCss));
        handleDialogClose();
    };

    const handleValidate = (markers: editor.IMarker[]) => {
        const errorMarker = markers.find(marker => marker.severity === 8); // 8 = Error severity
        if (errorMarker) {
            setValidationError(errorMarker.message);
        } else {
            setValidationError(null);
        }
    };

    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}
        >
            {validationError && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        p: 1,
                        py: 1,
                        borderBottom: 1,
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        height: "48px",
                        "& .MuiAlert-message": {
                            py: 0,
                            display: "flex",
                            alignItems: "center"
                        }
                    }}
                >
                    {validationError}
                </Alert>
            )}

            <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Editor
                    height="100%"
                    language="css"
                    theme="customTheme"
                    value={localCss}
                    onChange={handleEditorChange}
                    onValidate={handleValidate}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: "on",
                        lineNumbersMinChars: 2,
                        lineDecorationsWidth: 0,
                        scrollBeyondLastLine: false,
                        renderLineHighlight: "gutter",
                        stickyScroll: {
                            enabled: false
                        }
                    }}
                />
            </Box>

            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Custom CSS tag</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Tabs
                        value={dialogTabIndex}
                        onChange={(_, value) => setDialogTabIndex(value)}
                        sx={{ borderBottom: 1, borderColor: "divider", px: 1.5 }}
                    >
                        <Tab label="Create" />
                        <Tab label="Update" />
                    </Tabs>
                    <Box sx={{ p: 1.5 }}>
                        {dialogTabIndex === 0 && (
                            <>
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                        Tag name
                                    </Typography>
                                    <TextField
                                        autoFocus
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                        value={tagName}
                                        onChange={(e) => setTagName(e.target.value)}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                                        Tag description
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                        multiline
                                        rows={3}
                                        value={tagDescription}
                                        onChange={(e) => setTagDescription(e.target.value)}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                    />
                                </Box>
                            </>
                        )}
                        {dialogTabIndex === 1 && (
                            <Box>
                                {loading ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : tags.length === 0 ? (
                                    <Typography color="text.secondary" variant="body2">
                                        No tags available
                                    </Typography>
                                ) : (
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="custom-css-tag-select-label">Tag</InputLabel>
                                        <Select
                                            labelId="custom-css-tag-select-label"
                                            value={selectedTagId}
                                            label="Tag"
                                            onChange={(e) => setSelectedTagId(e.target.value)}
                                        >
                                            {tags.map((tag) => (
                                                <MenuItem key={tag.tagId} value={tag.tagId}>
                                                    {tag.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    {dialogTabIndex === 0 ? (
                        <Button onClick={handleCreateTag} variant="contained" disabled={!tagName.trim()}>
                            Create
                        </Button>
                    ) : (
                        <Button
                            onClick={handleUpdateTag}
                            variant="contained"
                            disabled={!selectedTagId || tags.length === 0}
                        >
                            Update
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
});

CustomCssTab.displayName = "CustomCssTab";
