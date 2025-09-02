import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { TopBar } from "../TopBar/TopBar";
import { PreviewFrame } from "../PreviewFrame/PreviewFrame";
import { SettingsPanel } from "../SettingsPanel/SettingsPanel";
export const ContentArea = () => {
  const { panelDock } = useSelector((state) => state.app);
  const isBottomDock = panelDock === "bottom";
  return _jsxs(Box, {
    sx: {
      flex: 1,
      display: "flex",
      flexDirection: isBottomDock ? "column" : "row",
      overflow: "hidden",
    },
    children: [
      _jsxs(Box, {
        sx: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        },
        children: [_jsx(TopBar, {}), _jsx(PreviewFrame, {})],
      }),
      _jsx(SettingsPanel, {}),
    ],
  });
};
