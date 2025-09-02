import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Editor, { loader } from "@monaco-editor/react";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { setCustomJs } from "../../../../store/actions";

export const CustomJsTab = () => {
    const dispatch = useDispatch();
    const { customJs } = useSelector((state: RootState) => state.app);
    const [localJs, setLocalJs] = useState(customJs);

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

    const handleApply = () => {
        dispatch(setCustomJs(localJs));
    };

    const handleEditorChange = (value: string | undefined) => {
        setLocalJs(value || "");
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
                    p: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    Add custom JavaScript to execute in the preview
                </Typography>
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleApply}
                    disabled={localJs === customJs}
                >
                    Apply
                </Button>
            </Box>

            <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Editor
                    height="100%"
                    language="javascript"
                    theme="customTheme"
                    value={localJs}
                    onChange={handleEditorChange}
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
        </Box>
    );
};
