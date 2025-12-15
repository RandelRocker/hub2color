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

interface TagsSelectDialogProps {
    open: boolean;
    onClose: () => void;
    tagTypeId: "custom_css" | "custom_js";
    onTagSelect: (value: string) => void;
}

interface TagFromApi {
    tagId: string;
    tagTypeId: string;
    name: string;
    description: string;
    config: {
        style?: string;
        code?: string;
        [key: string]: unknown;
    };
}

export const TagsSelectDialog = ({ open, onClose, tagTypeId, onTagSelect }: TagsSelectDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<TagFromApi[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (open) {
            setSearchQuery("");
            loadTags();
        }
    }, [open]);

    const loadTags = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/tags.json");
            if (!response.ok) {
                throw new Error(`Failed to fetch tags: ${response.status}`);
            }
            const data = await response.json();
            // Filter tags by tagTypeId
            const filteredTags = (data.tags || []).filter((tag: TagFromApi) => tag.tagTypeId === tagTypeId);
            setTags(filteredTags);
        } catch (error) {
            console.error("Failed to load tags:", error);
        } finally {
            setLoading(false);
        }
    };

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
        // Extract the appropriate config value based on tagTypeId
        const value = tagTypeId === "custom_css" 
            ? (tag.config.style || "")
            : (tag.config.code || "");
        
        onTagSelect(value);
        onClose();
    };

    const filteredTags = getFilteredTags();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Select {tagTypeId === "custom_css" ? "CSS" : "JS"} Tag
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

