import { Box, Typography } from "@mui/material";

export const StylingTab = () => {
    return (
        <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
                Styling controls will be implemented here
            </Typography>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
            >
                This tab will contain Material UI sx styling controls
            </Typography>
        </Box>
    );
};
