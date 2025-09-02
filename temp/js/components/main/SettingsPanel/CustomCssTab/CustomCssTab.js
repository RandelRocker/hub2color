import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Editor from "@monaco-editor/react";
import { useSelector, useDispatch } from "react-redux";
import { setCustomCss } from "../../../../store/actions";
export const CustomCssTab = () => {
  const dispatch = useDispatch();
  const { customCss } = useSelector((state) => state.app);
  const [localCss, setLocalCss] = useState(customCss);
  useEffect(() => {
    setLocalCss(customCss);
  }, [customCss]);
  const handleApply = () => {
    dispatch(setCustomCss(localCss));
  };
  const handleEditorChange = (value) => {
    setLocalCss(value || "");
  };
  return _jsxs(Box, {
    sx: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    children: [
      _jsxs(Box, {
        sx: {
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        },
        children: [
          _jsx(Typography, {
            variant: "caption",
            color: "text.secondary",
            children: "Add custom CSS styles to inject into the preview",
          }),
          _jsx(Button, {
            size: "small",
            variant: "contained",
            onClick: handleApply,
            disabled: localCss === customCss,
            children: "Apply",
          }),
        ],
      }),
      _jsx(Box, {
        sx: { flex: 1, overflow: "hidden" },
        children: _jsx(Editor, {
          height: "100%",
          language: "css",
          theme: "vs-light",
          value: localCss,
          onChange: handleEditorChange,
          options: {
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            glyphMargin: false,
          },
        }),
      }),
    ],
  });
};
