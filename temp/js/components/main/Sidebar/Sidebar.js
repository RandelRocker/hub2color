import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Search, ExpandMore, Folder, Description } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentPage, setSearchQuery } from "../../../store/actions";
export const Sidebar = () => {
  const dispatch = useDispatch();
  const { pages, currentPage, searchQuery } = useSelector((state) => state.app);
  const [expandedSections, setExpandedSections] = useState([]);
  const handleSearchChange = (event) => {
    dispatch(setSearchQuery(event.target.value));
  };
  const handleSectionToggle = (sectionTitle) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((s) => s !== sectionTitle)
        : [...prev, sectionTitle],
    );
  };
  const handlePageSelect = (pagePath) => {
    dispatch(setCurrentPage(pagePath));
  };
  const filteredPages = pages
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          searchQuery === "" ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.sectionTitle
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((section) => section.items.length > 0);
  return _jsxs(Box, {
    sx: {
      width: 300,
      height: "100vh",
      bgcolor: "white",
      borderRight: 1,
      borderColor: "divider",
      display: "flex",
      flexDirection: "column",
    },
    children: [
      _jsx(Box, {
        sx: { p: 2, borderBottom: 1, borderColor: "divider" },
        children: _jsx(Typography, {
          variant: "h6",
          sx: { fontWeight: "bold", color: "#ff6b6b" },
          children: "\uD83D\uDCDA Mini Storybook",
        }),
      }),
      _jsx(Box, {
        sx: { p: 2, borderBottom: 1, borderColor: "divider" },
        children: _jsx(TextField, {
          fullWidth: true,
          size: "small",
          placeholder: "Find components",
          value: searchQuery,
          onChange: handleSearchChange,
          InputProps: {
            startAdornment: _jsx(InputAdornment, {
              position: "start",
              children: _jsx(Search, { fontSize: "small" }),
            }),
          },
        }),
      }),
      _jsx(Box, {
        sx: { flex: 1, overflow: "auto" },
        children: filteredPages.map((section) =>
          _jsxs(
            Accordion,
            {
              expanded: expandedSections.includes(section.sectionTitle),
              onChange: () => handleSectionToggle(section.sectionTitle),
              sx: {
                boxShadow: "none",
                "&:before": { display: "none" },
                "&.Mui-expanded": { margin: 0 },
              },
              children: [
                _jsx(AccordionSummary, {
                  expandIcon: _jsx(ExpandMore, {}),
                  sx: {
                    minHeight: 40,
                    "&.Mui-expanded": { minHeight: 40 },
                    px: 2,
                    bgcolor: "#f5f5f5",
                  },
                  children: _jsxs(Box, {
                    sx: { display: "flex", alignItems: "center", gap: 1 },
                    children: [
                      _jsx(Folder, { fontSize: "small" }),
                      _jsx(Typography, {
                        variant: "body2",
                        sx: { fontWeight: 500 },
                        children: section.sectionTitle,
                      }),
                    ],
                  }),
                }),
                _jsx(AccordionDetails, {
                  sx: { p: 0 },
                  children: _jsx(List, {
                    dense: true,
                    children: section.items.map((item) =>
                      _jsx(
                        ListItem,
                        {
                          disablePadding: true,
                          children: _jsxs(ListItemButton, {
                            selected: currentPage === item.path,
                            onClick: () => handlePageSelect(item.path),
                            sx: {
                              pl: 4,
                              py: 0.5,
                              "&.Mui-selected": {
                                bgcolor: "#e3f2fd",
                                borderRight: 3,
                                borderColor: "#1976d2",
                              },
                            },
                            children: [
                              _jsx(ListItemIcon, {
                                sx: { minWidth: 32 },
                                children: _jsx(Description, {
                                  fontSize: "small",
                                }),
                              }),
                              _jsx(ListItemText, {
                                primary: item.title,
                                primaryTypographyProps: {
                                  variant: "body2",
                                  fontSize: 14,
                                },
                              }),
                            ],
                          }),
                        },
                        item.path,
                      ),
                    ),
                  }),
                }),
              ],
            },
            section.sectionTitle,
          ),
        ),
      }),
    ],
  });
};
