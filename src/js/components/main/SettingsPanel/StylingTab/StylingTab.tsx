import { Box, Typography } from "@mui/material";

export const StylingTab = () => {
    return (
        <Box
            sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%"
            }}
        >
            <Typography variant="body2" color="text.secondary">
                Add a new styling group to start
            </Typography>
        </Box>
    );
};
