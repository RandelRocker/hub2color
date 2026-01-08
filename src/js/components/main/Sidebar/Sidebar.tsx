import { useState, useEffect, useMemo } from "react";
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
    AccordionDetails,
    Collapse
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../store";
import { setCurrentPage, setSearchQuery } from "../../../store/actions";
import { PageItem } from "../../../store/types";

// Unified helper: recursively checks if a page path exists in an item's subtree
const itemContainsPage = (
    item: PageItem,
    targetPath: string | null
): boolean => {
    if (!targetPath) return false;
    if (item.path === targetPath) return true;
    if (item.items?.length) {
        return item.items.some((child) => itemContainsPage(child, targetPath));
    }
    return false;
};

interface MenuItemProps {
    item: PageItem;
    currentPage: string | null;
    onPageSelect: (path: string) => void;
    level?: number;
}

const MenuItem = ({
    item,
    currentPage,
    onPageSelect,
    level = 0
}: MenuItemProps) => {
    const hasChildren = Boolean(item.items?.length);
    const shouldBeExpanded = hasChildren && itemContainsPage(item, currentPage);
    const [expanded, setExpanded] = useState(shouldBeExpanded);

    // Sync expanded state when currentPage changes
    useEffect(() => {
        setExpanded(shouldBeExpanded);
    }, [shouldBeExpanded]);

    const handleClick = () => {
        if (hasChildren) {
            setExpanded(!expanded);
        } else if (item.path) {
            onPageSelect(item.path);
        }
    };

    return (
        <>
            <ListItem disablePadding>
                <ListItemButton
                    selected={currentPage === item.path}
                    onClick={handleClick}
                    sx={{
                        pl: 4 + level * 2,
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
                            name={
                                hasChildren
                                    ? expanded
                                        ? "chevron-down-outline"
                                        : "chevron-forward-outline"
                                    : "document-text-outline"
                            }
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
            {hasChildren && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding dense>
                        {item.items!.map((childItem, index) => (
                            <MenuItem
                                key={childItem.path || `${item.title}-${index}`}
                                item={childItem}
                                currentPage={currentPage}
                                onPageSelect={onPageSelect}
                                level={level + 1}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

export const Sidebar = () => {
    const dispatch = useDispatch();
    const { pages, currentPage, searchQuery } = useSelector(
        (state: RootState) => state.app
    );
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    // Compute which section should be expanded based on currentPage
    const sectionForCurrentPage = useMemo(() => {
        if (!currentPage) return null;
        return (
            pages.find((section) =>
                section.items.some((item) =>
                    itemContainsPage(item, currentPage)
                )
            )?.sectionTitle || null
        );
    }, [pages, currentPage]);

    // Auto-expand section containing current page
    useEffect(() => {
        if (
            sectionForCurrentPage &&
            !expandedSections.includes(sectionForCurrentPage)
        ) {
            setExpandedSections((prev) => [...prev, sectionForCurrentPage]);
        }
    }, [sectionForCurrentPage, expandedSections]);

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

    const filteredPages = useMemo(() => {
        if (!searchQuery) return pages;

        const query = searchQuery.toLowerCase();
        const filterItems = (items: PageItem[]): PageItem[] => {
            return items
                .filter((item) => {
                    const titleMatches = item.title
                        .toLowerCase()
                        .includes(query);
                    if (item.items?.length) {
                        const filteredChildren = filterItems(item.items);
                        return titleMatches || filteredChildren.length > 0;
                    }
                    return titleMatches;
                })
                .map((item) => {
                    if (item.items?.length) {
                        return { ...item, items: filterItems(item.items) };
                    }
                    return item;
                });
        };

        return pages
            .map((section) => ({
                ...section,
                items: section.sectionTitle.toLowerCase().includes(query)
                    ? filterItems(section.items)
                    : filterItems(section.items)
            }))
            .filter((section) => section.items.length > 0);
    }, [pages, searchQuery]);

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
                                {section.items.map((item, index) => (
                                    <MenuItem
                                        key={
                                            item.path ||
                                            `${section.sectionTitle}-${index}`
                                        }
                                        item={item}
                                        currentPage={currentPage}
                                        onPageSelect={handlePageSelect}
                                    />
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
};
