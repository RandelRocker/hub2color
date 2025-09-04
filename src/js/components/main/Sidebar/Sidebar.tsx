import { useState } from "react";
import IonIcon from "@reacticons/ionicons";
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
    AccordionDetails
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import { setCurrentPage, setSearchQuery } from "../../../store/actions";

export const Sidebar = () => {
    const dispatch = useDispatch();
    const { pages, currentPage, searchQuery } = useSelector(
        (state: RootState) => state.app
    );
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setSearchQuery(event.target.value));
    };

    const handleSectionToggle = (sectionTitle: string) => {
        setExpandedSections((prev) =>
            prev.includes(sectionTitle)
                ? prev.filter((s) => s !== sectionTitle)
                : [...prev, sectionTitle]
        );
    };

    const handlePageSelect = (pagePath: string) => {
        dispatch(setCurrentPage(pagePath));
    };

    const filteredPages = pages
        .map((section) => ({
            ...section,
            items: section.items.filter(
                (item) =>
                    searchQuery === "" ||
                    item.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    section.sectionTitle
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
            )
        }))
        .filter((section) => section.items.length > 0);

    return (
        <Box
            sx={{
                width: 300,
                height: "100vh",
                bgcolor: "white",
                borderRight: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: "column"
            }}
        >
            {/* Logo */}
            <Box sx={{ p: 2, paddingBottom: 0 }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "#545454" }}
                >
                    Hub2color
                </Typography>
            </Box>

            {/* Search */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Find components"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    slotProps={{
                        input: {
                            sx: { fontSize: "0.875rem" },
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IonIcon
                                        name="search-outline"
                                        style={{
                                            height: "1.2em",
                                            width: "1.2em",
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    />
                                </InputAdornment>
                            )
                        }
                    }}
                />
            </Box>

            {/* Pages List */}
            <Box sx={{ flex: 1, overflow: "auto" }}>
                {filteredPages.map((section) => (
                    <Accordion
                        key={section.sectionTitle}
                        disableGutters
                        expanded={expandedSections.includes(
                            section.sectionTitle
                        )}
                        onChange={() =>
                            handleSectionToggle(section.sectionTitle)
                        }
                        sx={{
                            boxShadow: "none",
                            "&:before": { display: "none" },
                            "&.Mui-expanded": { margin: 0 }
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{
                                minHeight: 40,
                                "&.Mui-expanded": { minHeight: 40 },
                                px: 2
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1
                                }}
                            >
                                <IonIcon
                                    name="folder-outline"
                                    style={{
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                >
                                    {section.sectionTitle}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            <List dense>
                                {section.items.map((item) => (
                                    <ListItem key={item.path} disablePadding>
                                        <ListItemButton
                                            selected={currentPage === item.path}
                                            onClick={() =>
                                                handlePageSelect(item.path)
                                            }
                                            sx={{
                                                pl: 4,
                                                py: 0.5,
                                                gap: "8px",
                                                "&.Mui-selected": {
                                                    bgcolor: "#e3f2fd",
                                                    borderRight: 3,
                                                    borderColor: "#1976d2"
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 0 }}>
                                                <IonIcon
                                                    name="document-text-outline"
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center"
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.title}
                                                slotProps={{
                                                    primary: {
                                                        variant: "body2",
                                                        fontSize: 14
                                                    }
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
};
