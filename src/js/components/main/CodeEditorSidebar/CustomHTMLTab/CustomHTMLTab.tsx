import {
    useEffect,
    useState,
    useRef,
    forwardRef,
    useImperativeHandle
} from "react";
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
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
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { setCustomHtml } from "../../../../store/actions";
import { CustomHtmlPayload } from "../../../../store/types";

import { useTagsByType } from "../hooks/useTagsByType";

interface CustomHTMLTabProps {
    dialogOpen: boolean;
    onDialogClose: () => void;
}

export interface CustomHTMLTabHandle {
    loadTag: (value: CustomHtmlPayload) => void;
}

export const CustomHTMLTab = forwardRef<
    CustomHTMLTabHandle,
    CustomHTMLTabProps
>(({ dialogOpen, onDialogClose }, ref) => {
    const dispatch = useDispatch();
    const headTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const bodyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const headValueRef = useRef("");
    const bodyValueRef = useRef("");
    const { customHtml } = useSelector((state: RootState) => state.app);
    const [localBeforeEndHead, setLocalBeforeEndHead] = useState(
        customHtml.beforeEndHead
    );
    const [localBeforeEndBody, setLocalBeforeEndBody] = useState(
        customHtml.beforeEndBody
    );
    const [tagName, setTagName] = useState("");
    const [tagDescription, setTagDescription] = useState("");
    const [dialogTabIndex, setDialogTabIndex] = useState(0);
    const [selectedTagId, setSelectedTagId] = useState("");

    const { tags, loading } = useTagsByType("custom_tag_type", dialogOpen);

    useEffect(() => {
        setLocalBeforeEndHead(customHtml.beforeEndHead);
        setLocalBeforeEndBody(customHtml.beforeEndBody);
        headValueRef.current = customHtml.beforeEndHead;
        bodyValueRef.current = customHtml.beforeEndBody;
    }, [customHtml.beforeEndHead, customHtml.beforeEndBody]);

    useImperativeHandle(
        ref,
        () => ({
            loadTag: (value: CustomHtmlPayload) => {
                setLocalBeforeEndHead(value.beforeEndHead);
                setLocalBeforeEndBody(value.beforeEndBody);
                dispatch(setCustomHtml(value));
            }
        }),
        [dispatch]
    );

    useEffect(() => {
        loader.init().then((monaco) => {
            monaco.editor.defineTheme("customTheme", {
                base: "vs",
                inherit: true,
                rules: [],
                colors: {
                    "editorGutter.background": "#f8f9fa"
                }
            });
        });
    }, []);

    useEffect(() => {
        return () => {
            if (headTimeoutRef.current) {
                clearTimeout(headTimeoutRef.current);
            }
            if (bodyTimeoutRef.current) {
                clearTimeout(bodyTimeoutRef.current);
            }
        };
    }, []);

    const handleHeadChange = (value: string = "") => {
        headValueRef.current = value;
        setLocalBeforeEndHead(value);
        if (headTimeoutRef.current) {
            clearTimeout(headTimeoutRef.current);
        }
        headTimeoutRef.current = setTimeout(() => {
            dispatch(
                setCustomHtml({
                    beforeEndHead: headValueRef.current,
                    beforeEndBody: bodyValueRef.current
                })
            );
        }, 500);
    };

    const handleBodyChange = (value: string = "") => {
        bodyValueRef.current = value;
        setLocalBeforeEndBody(value);
        if (bodyTimeoutRef.current) {
            clearTimeout(bodyTimeoutRef.current);
        }
        bodyTimeoutRef.current = setTimeout(() => {
            dispatch(
                setCustomHtml({
                    beforeEndHead: headValueRef.current,
                    beforeEndBody: bodyValueRef.current
                })
            );
        }, 500);
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
        dispatch(
            setCustomHtml({
                beforeEndHead: localBeforeEndHead,
                beforeEndBody: localBeforeEndBody
            })
        );
        handleDialogClose();
    };

    const handleUpdateTag = () => {
        dispatch(
            setCustomHtml({
                beforeEndHead: localBeforeEndHead,
                beforeEndBody: localBeforeEndBody
            })
        );
        handleDialogClose();
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
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        borderBottom: 1,
                        borderColor: "divider"
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: "#f8f9fa",
                            borderBottom: 1,
                            borderColor: "divider",
                            fontWeight: 500
                        }}
                    >
                        Before &lt;/head&gt; HTML
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <Editor
                            height="100%"
                            language="html"
                            theme="customTheme"
                            value={localBeforeEndHead}
                            onChange={handleHeadChange}
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
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: "#f8f9fa",
                            borderBottom: 1,
                            borderColor: "divider",
                            fontWeight: 500
                        }}
                    >
                        Before &lt;/body&gt; HTML
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <Editor
                            height="100%"
                            language="html"
                            theme="customTheme"
                            value={localBeforeEndBody}
                            onChange={handleBodyChange}
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
                </Box>
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Custom HTML tag</DialogTitle>
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
                                    <Typography
                                        variant="caption"
                                        sx={{ mb: 0.5, display: "block" }}
                                    >
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
                                    <Typography
                                        variant="caption"
                                        sx={{ mb: 0.5, display: "block" }}
                                    >
                                        Tag description
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                        multiline
                                        rows={3}
                                        value={tagDescription}
                                        onChange={(e) =>
                                            setTagDescription(e.target.value)
                                        }
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
                                        <InputLabel id="custom-html-tag-select-label">Tag</InputLabel>
                                        <Select
                                            labelId="custom-html-tag-select-label"
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
                        <Button
                            onClick={handleCreateTag}
                            variant="contained"
                            disabled={!tagName.trim()}
                        >
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

CustomHTMLTab.displayName = "CustomHTMLTab";
