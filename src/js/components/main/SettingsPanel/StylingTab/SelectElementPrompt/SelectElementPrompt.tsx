import { Box, Button, Typography } from "@mui/material";
import { HighlightAlt } from "@mui/icons-material";

import { SelectElementPromptProps } from "./types";

export const SelectElementPrompt = ({
    active,
    onSelect
}: SelectElementPromptProps) => {
    return (
        <Box
            sx={{
                p: 3,
                gap: 1.5,
                height: "100%",
                display: "flex",
                textAlign: "center",
                alignItems: "center",
                flexDirection: "column",
                justifyContent: "center"
            }}
        >
            <Typography variant="body2" color="text.secondary">
                Please select an element for styling by pressing following button
            </Typography>
            <Button
                variant={active ? "contained" : "outlined"}
                size="small"
                startIcon={<HighlightAlt fontSize="small" />}
                onClick={onSelect}
            >
                Select element
            </Button>
        </Box>
    );
};
