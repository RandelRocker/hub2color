import { useEffect, useState, useRef } from "react";
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from "@mui/material";
import Editor, { loader } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { setCustomJs } from "../../../../store/actions";

export const CustomJsTab = () => {
    const dispatch = useDispatch();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { customJs } = useSelector((state: RootState) => state.app);
    const [localJs, setLocalJs] = useState(customJs);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [tagName, setTagName] = useState("");
    const [tagDescription, setTagDescription] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    
    useEffect(() => {
        setLocalJs(customJs);
    }, [customJs]);

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
            dispatch(setCustomJs(value));
        }, 500);

        setLocalJs(value);
    };

    const handleCreateTagClick = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setTagName("");
        setTagDescription("");
    };

    const handleCreateTag = () => {
        // Here you would typically make an API call to create the tag
        // For now, we'll just update the store with the JS
        dispatch(setCustomJs(localJs));
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
            {validationError ? (
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
            ) : (
                <Box
                    className="custom-js-tab-header"
                    sx={{
                        p: 1,
                        borderBottom: 1,
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        minHeight: "48px"
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        For preview only. If you need to apply custom JavaScript to the site - create a tag.
                    </Typography>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={handleCreateTagClick}
                    >
                        Create tag
                    </Button>
                </Box>
            )}

            <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Editor
                    height="100%"
                    language="javascript"
                    theme="customTheme"
                    value={localJs}
                    onChange={handleEditorChange}
                    onValidate={handleValidate}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: "on",
                        // wordWrap: "on",
                        // automaticLayout: true,
                        scrollBeyondLastLine: false,
                        renderLineHighlight: "gutter"
                        // folding: false,
                        // lineDecorationsWidth: 0
                        // lineNumbersMinChars: 3,
                        // glyphMargin: false
                    }}
                />
            </Box>

            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create custom JavaScript tag</DialogTitle>
                <DialogContent sx={{ p: 1.5 }}>
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleCreateTag} variant="contained" disabled={!tagName.trim()}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
