import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
export const StylingTab = () => {
  return _jsxs(Box, {
    sx: { p: 2, textAlign: "center" },
    children: [
      _jsx(Typography, {
        variant: "body2",
        color: "text.secondary",
        children: "Styling controls will be implemented here",
      }),
      _jsx(Typography, {
        variant: "caption",
        color: "text.secondary",
        sx: { mt: 1, display: "block" },
        children: "This tab will contain Material UI sx styling controls",
      }),
    ],
  });
};
