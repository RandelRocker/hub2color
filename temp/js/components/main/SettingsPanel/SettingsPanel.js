import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Toolbar,
  Tooltip,
  Divider,
} from "@mui/material";
import { Dock, Restore, RestartAlt, Save } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { setPanelDock } from "../../../store/actions";
import { ControlsTab } from "./ControlsTab/ControlsTab";
import { StylingTab } from "./StylingTab/StylingTab";
import { CustomCssTab } from "./CustomCssTab/CustomCssTab";
import { CustomJsTab } from "./CustomJsTab/CustomJsTab";
export const SettingsPanel = () => {
  const dispatch = useDispatch();
  const { panelDock, currentPage } = useSelector((state) => state.app);
  const [activeTab, setActiveTab] = useState(0);
  const isBottomDock = panelDock === "bottom";
  const handleDockToggle = () => {
    dispatch(setPanelDock(isBottomDock ? "right" : "bottom"));
  };
  const handleResetToPrevious = () => {
    if (!currentPage) return;
    const saved = localStorage.getItem(`msb:state:${currentPage}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // Dispatch actions to restore state
        console.log("Restore previous saved state:", state);
      } catch (error) {
        console.error("Failed to parse saved state:", error);
      }
    }
  };
  const handleResetToDefault = () => {
    // Reset to schema defaults
    console.log("Reset to schema defaults");
  };
  const handleSave = () => {
    if (!currentPage) return;
    // Save current state to localStorage
    const state = {
      // We'll implement this when we have all the state
    };
    localStorage.setItem(`msb:state:${currentPage}`, JSON.stringify(state));
    console.log("Save current state");
  };
  const panelWidth = isBottomDock ? "100%" : 360;
  const panelHeight = isBottomDock ? 320 : "100%";
  return _jsxs(Paper, {
    sx: {
      width: panelWidth,
      height: panelHeight,
      display: "flex",
      flexDirection: "column",
      bgcolor: "white",
      borderRadius: 0,
      borderTop: isBottomDock ? 1 : 0,
      borderLeft: isBottomDock ? 0 : 1,
      borderColor: "divider",
      overflow: "hidden",
    },
    children: [
      _jsxs(Toolbar, {
        variant: "dense",
        sx: {
          minHeight: 48,
          bgcolor: "#f5f5f5",
          borderBottom: 1,
          borderColor: "divider",
          justifyContent: "space-between",
          px: 1,
        },
        children: [
          _jsx(Box, {
            sx: { display: "flex", alignItems: "center" },
            children: _jsxs(Tabs, {
              value: activeTab,
              onChange: (_, newValue) => setActiveTab(newValue),
              variant: "scrollable",
              scrollButtons: false,
              sx: {
                minHeight: 36,
                "& .MuiTab-root": {
                  minHeight: 36,
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: "none",
                  px: 2,
                },
              },
              children: [
                _jsx(Tab, { label: "Controls" }),
                _jsx(Tab, { label: "Styling" }),
                _jsx(Tab, { label: "Custom CSS" }),
                _jsx(Tab, { label: "Custom JS" }),
              ],
            }),
          }),
          _jsxs(Box, {
            sx: { display: "flex", alignItems: "center", gap: 0.5 },
            children: [
              _jsx(Tooltip, {
                title: `Dock ${isBottomDock ? "Right" : "Bottom"}`,
                children: _jsx(IconButton, {
                  size: "small",
                  onClick: handleDockToggle,
                  children: _jsx(Dock, { fontSize: "small" }),
                }),
              }),
              _jsx(Divider, {
                orientation: "vertical",
                flexItem: true,
                sx: { mx: 0.5 },
              }),
              _jsx(Tooltip, {
                title: "Reset to Previous Saved",
                children: _jsx(IconButton, {
                  size: "small",
                  onClick: handleResetToPrevious,
                  children: _jsx(Restore, { fontSize: "small" }),
                }),
              }),
              _jsx(Tooltip, {
                title: "Reset to Default",
                children: _jsx(IconButton, {
                  size: "small",
                  onClick: handleResetToDefault,
                  children: _jsx(RestartAlt, { fontSize: "small" }),
                }),
              }),
              _jsx(Tooltip, {
                title: "Save",
                children: _jsx(IconButton, {
                  size: "small",
                  onClick: handleSave,
                  children: _jsx(Save, { fontSize: "small" }),
                }),
              }),
            ],
          }),
        ],
      }),
      _jsxs(Box, {
        sx: { flex: 1, overflow: "hidden" },
        children: [
          activeTab === 0 && _jsx(ControlsTab, {}),
          activeTab === 1 && _jsx(StylingTab, {}),
          activeTab === 2 && _jsx(CustomCssTab, {}),
          activeTab === 3 && _jsx(CustomJsTab, {}),
        ],
      }),
    ],
  });
};
