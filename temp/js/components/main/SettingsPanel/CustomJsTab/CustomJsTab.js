import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Editor from "@monaco-editor/react";
import { useSelector, useDispatch } from "react-redux";
import { setCustomJs } from "../../../../store/actions";
export const CustomJsTab = () => {
  const dispatch = useDispatch();
  const { customJs } = useSelector((state) => state.app);
  const [localJs, setLocalJs] = useState(customJs);
  useEffect(() => {
    setLocalJs(customJs);
  }, [customJs]);
  const handleApply = () => {
    dispatch(setCustomJs(localJs));
  };
  const handleEditorChange = (value) => {
    setLocalJs(value || "");
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
            children: "Add custom JavaScript to execute in the preview",
          }),
          _jsx(Button, {
            size: "small",
            variant: "contained",
            onClick: handleApply,
            disabled: localJs === customJs,
            children: "Apply",
          }),
        ],
      }),
      _jsx(Box, {
        sx: { flex: 1, overflow: "hidden" },
        children: _jsx(Editor, {
          height: "100%",
          language: "javascript",
          theme: "vs-light",
          value: localJs,
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
