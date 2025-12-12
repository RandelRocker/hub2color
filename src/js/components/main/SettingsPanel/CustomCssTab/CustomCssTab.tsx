import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Editor, { loader } from "@monaco-editor/react";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { setCustomCss } from "../../../../store/actions";

export const CustomCssTab = () => {
    const dispatch = useDispatch();
    const { customCss } = useSelector((state: RootState) => state.app);
    const [localCss, setLocalCss] = useState(customCss);

    useEffect(() => {
        setLocalCss(customCss);
    }, [customCss]);

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
        dispatch(setCustomCss(localCss));
    };

    const handleEditorChange = (value: string | undefined) => {
        setLocalCss(value || "");
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
                    For preview only. If you need to apply custom CSS to the site - create a tag.
                </Typography>
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleApply}
                    disabled={localCss === customCss}
                >
                    Create tag
                </Button>
            </Box>

            <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Editor
                    height="100%"
                    language="css"
                    theme="customTheme"
                    value={localCss}
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
