import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Box,
  IconButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import {
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
  DesktopWindows,
  Tablet,
  Phone,
  SwapHoriz,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { setZoom, setViewport, setDirection } from "../../../store/actions";
export const TopBar = () => {
  const dispatch = useDispatch();
  const { zoom, viewport, direction } = useSelector((state) => state.app);
  const handleZoomIn = () => {
    dispatch(setZoom(Math.min(zoom * 1.2, 3)));
  };
  const handleZoomOut = () => {
    dispatch(setZoom(Math.max(zoom / 1.2, 0.25)));
  };
  const handleResetZoom = () => {
    dispatch(setZoom(1));
  };
  const handleViewportChange = (_, newViewport) => {
    if (
      newViewport &&
      (newViewport === "desktop" ||
        newViewport === "tablet" ||
        newViewport === "mobile")
    ) {
      dispatch(setViewport(newViewport));
    }
  };
  const handleDirectionToggle = () => {
    dispatch(setDirection(direction === "ltr" ? "rtl" : "ltr"));
  };
  return _jsxs(Box, {
    sx: {
      height: 48,
      bgcolor: "white",
      borderBottom: 1,
      borderColor: "divider",
      display: "flex",
      alignItems: "center",
      px: 2,
      gap: 1,
    },
    children: [
      _jsxs(Box, {
        sx: { display: "flex", alignItems: "center", gap: 0.5 },
        children: [
          _jsx(Tooltip, {
            title: "Zoom In",
            children: _jsx(IconButton, {
              size: "small",
              onClick: handleZoomIn,
              disabled: zoom >= 3,
              children: _jsx(ZoomIn, { fontSize: "small" }),
            }),
          }),
          _jsx(Tooltip, {
            title: "Zoom Out",
            children: _jsx(IconButton, {
              size: "small",
              onClick: handleZoomOut,
              disabled: zoom <= 0.25,
              children: _jsx(ZoomOut, { fontSize: "small" }),
            }),
          }),
          _jsx(Tooltip, {
            title: "Reset Zoom",
            children: _jsx(IconButton, {
              size: "small",
              onClick: handleResetZoom,
              children: _jsx(ZoomOutMap, { fontSize: "small" }),
            }),
          }),
        ],
      }),
      _jsx(Divider, { orientation: "vertical", flexItem: true, sx: { mx: 1 } }),
      _jsxs(ToggleButtonGroup, {
        value: viewport,
        exclusive: true,
        onChange: handleViewportChange,
        size: "small",
        children: [
          _jsx(ToggleButton, {
            value: "desktop",
            "aria-label": "desktop",
            children: _jsx(Tooltip, {
              title: "Desktop View",
              children: _jsx(DesktopWindows, { fontSize: "small" }),
            }),
          }),
          _jsx(ToggleButton, {
            value: "tablet",
            "aria-label": "tablet",
            children: _jsx(Tooltip, {
              title: "Tablet View",
              children: _jsx(Tablet, { fontSize: "small" }),
            }),
          }),
          _jsx(ToggleButton, {
            value: "mobile",
            "aria-label": "mobile",
            children: _jsx(Tooltip, {
              title: "Mobile View",
              children: _jsx(Phone, { fontSize: "small" }),
            }),
          }),
        ],
      }),
      _jsx(Divider, { orientation: "vertical", flexItem: true, sx: { mx: 1 } }),
      _jsx(Tooltip, {
        title: `Switch to ${direction === "ltr" ? "RTL" : "LTR"}`,
        children: _jsx(IconButton, {
          size: "small",
          onClick: handleDirectionToggle,
          sx: {
            color: direction === "rtl" ? "primary.main" : "inherit",
            bgcolor: direction === "rtl" ? "primary.50" : "transparent",
          },
          children: _jsx(SwapHoriz, { fontSize: "small" }),
        }),
      }),
      _jsxs(Box, {
        sx: { ml: "auto", fontSize: 12, color: "text.secondary" },
        children: ["Zoom: ", Math.round(zoom * 100), "%"],
      }),
    ],
  });
};
