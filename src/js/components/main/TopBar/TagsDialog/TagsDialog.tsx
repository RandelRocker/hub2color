import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    TextField,
    Box,
    CircularProgress,
    Typography
} from "@mui/material";
import { useDispatch } from "react-redux";
import { setPortalTags } from "../../../../store/actions";
import { PortalTag } from "../../../../store/types";

interface TagsDialogProps {
    open: boolean;
    onClose: () => void;
    portalTags: PortalTag[];
}

interface TagFromApi {
    tagId: string;
    tagTypeId: string;
    name: string;
    description: string;
    config: Record<string, unknown>;
    conditionIds?: string[];
}

const TAG_TYPE_MAP: Record<string, string> = {
    custom_tag_type: "Custom tag",
    custom_js: "Custom JS tag",
    custom_css: "Custom CSS tag"
};

export const TagsDialog = ({ open, onClose, portalTags }: TagsDialogProps) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<TagFromApi[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    // Sync selectedTagIds with portalTags when dialog opens
    useEffect(() => {
        if (open) {
            const selectedIds = new Set(portalTags.map(tag => tag.tagId));
            setSelectedTagIds(selectedIds);
            setSearchQuery("");
            loadTags();
        }
    }, [open, portalTags]);

    const loadTags = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/tags.json");
            if (!response.ok) {
                throw new Error(`Failed to fetch tags: ${response.status}`);
            }
            const data = await response.json();
            setTags(data.tags || []);
        } catch (error) {
            console.error("Failed to load tags:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTag = (tagId: string) => {
        const newSelected = new Set(selectedTagIds);
        if (newSelected.has(tagId)) {
            newSelected.delete(tagId);
        } else {
            newSelected.add(tagId);
        }
        setSelectedTagIds(newSelected);
    };

    const handleToggleAll = () => {
        const filteredTags = getFilteredTags();
        const allFilteredSelected = filteredTags.length > 0 && 
            filteredTags.every(tag => selectedTagIds.has(tag.tagId));
        
        if (allFilteredSelected) {
            // Uncheck all filtered tags
            const newSelected = new Set(selectedTagIds);
            filteredTags.forEach(tag => newSelected.delete(tag.tagId));
            setSelectedTagIds(newSelected);
        } else {
            // Check all filtered tags
            const newSelected = new Set(selectedTagIds);
            filteredTags.forEach(tag => newSelected.add(tag.tagId));
            setSelectedTagIds(newSelected);
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

    const handleApply = () => {
        const selectedTags = tags.filter(tag => 
            selectedTagIds.has(tag.tagId)
        );

        // Transform tags: remove conditionIds, add conditions property
        const transformedTags: PortalTag[] = selectedTags.map((tag) => {
            const { conditionIds, ...tagWithoutConditionIds } = tag;
            return {
                ...tagWithoutConditionIds,
                conditions: [{
                    conditionId: "onAppInit",
                    conditionTypeId: "basic_condition",
                    name: "hub2color on app init",
                    description: "hub2color on app init",
                    config: {
                        launch: "onAppInit"
                    }
                }]
            };
        });

        dispatch(setPortalTags(transformedTags));
        onClose();
    };

    const filteredTags = getFilteredTags();
    const allFilteredSelected = filteredTags.length > 0 && 
        filteredTags.every(tag => selectedTagIds.has(tag.tagId));
    const someFilteredSelected = filteredTags.some(tag => selectedTagIds.has(tag.tagId));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Manage Portal Tags</DialogTitle>
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
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={allFilteredSelected}
                                                indeterminate={someFilteredSelected && !allFilteredSelected}
                                                onChange={handleToggleAll}
                                            />
                                        </TableCell>
                                        <TableCell>Tag name</TableCell>
                                        <TableCell>Tag description</TableCell>
                                        <TableCell>Tag type</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTags.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                <Typography color="text.secondary">
                                                    {searchQuery ? "No tags found matching your search" : "No tags available"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTags.map((tag) => (
                                            <TableRow key={tag.tagId}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedTagIds.has(tag.tagId)}
                                                        onChange={() => handleToggleTag(tag.tagId)}
                                                    />
                                                </TableCell>
                                                <TableCell>{tag.name}</TableCell>
                                                <TableCell>{tag.description}</TableCell>
                                                <TableCell>
                                                    {TAG_TYPE_MAP[tag.tagTypeId] || tag.tagTypeId}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleApply} variant="contained">
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
};

