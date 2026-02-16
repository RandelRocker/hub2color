import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Box,
    CircularProgress,
    Typography
} from "@mui/material";

import { CustomHtmlPayload } from "../../../../store/types";

import { useTagsByType } from "../hooks/useTagsByType";
import { TagFromApi } from "../types";

interface TagsSelectDialogProps {
    open: boolean;
    onClose: () => void;
    tagTypeId: "custom_css" | "custom_js" | "custom_tag_type";
    onTagSelect: (value: string | CustomHtmlPayload) => void;
}

export const TagsSelectDialog = ({ open, onClose, tagTypeId, onTagSelect }: TagsSelectDialogProps) => {
    const { tags, loading } = useTagsByType(tagTypeId, open);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (open) {
            setSearchQuery("");
        }
    }, [open]);

    const getFilteredTags = () => {
        if (!searchQuery.trim()) {
            return tags;
        }
        const query = searchQuery.toLowerCase();
        return tags.filter(tag => 
            tag.name.toLowerCase().includes(query)
        );
    };

    const handleRowClick = (tag: TagFromApi) => {
        if (tagTypeId === "custom_tag_type") {
            const value: CustomHtmlPayload = {
                beforeEndHead: tag.config.beforeEndHead ?? "",
                beforeEndBody: tag.config.beforeEndBody ?? ""
            };
            onTagSelect(value);
        } else {
            const value =
                tagTypeId === "custom_css"
                    ? (tag.config.style || "")
                    : (tag.config.code || "");
            onTagSelect(value);
        }
        onClose();
    };

    const filteredTags = getFilteredTags();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Select{" "}
                {tagTypeId === "custom_css"
                    ? "CSS"
                    : tagTypeId === "custom_js"
                      ? "JS"
                      : "HTML"}{" "}
                Tag
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: 200
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                placeholder="Search by tag name"
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                fullWidth
                            />
                        </Box>
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }} elevation={0}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Tag name</TableCell>
                                        <TableCell>Tag description</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTags.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center">
                                                <Typography color="text.secondary">
                                                    {searchQuery ? "No tags found matching your search" : "No tags available"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTags.map((tag) => (
                                            <TableRow 
                                                key={tag.tagId}
                                                onClick={() => handleRowClick(tag)}
                                                sx={{
                                                    cursor: "pointer",
                                                    "&:hover": {
                                                        backgroundColor: "action.hover"
                                                    }
                                                }}
                                            >
                                                <TableCell>{tag.name}</TableCell>
                                                <TableCell>{tag.description}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

