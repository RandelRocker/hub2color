import { useEffect } from "react";
import { Box } from "@mui/material";
import { useDispatch } from "react-redux";

import { StoredThemeStyles } from "../../../store/types";
import { Sidebar } from "../Sidebar/Sidebar";
import { ContentArea } from "../ContentArea/ContentArea";
import {
    setPages,
    setLoading,
    setError,
    saveStylingTheme
} from "../../../store/actions";

export const App = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const loadPages = async () => {
            try {
                const response = await fetch("/api/menu.config.json");
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch pages: ${response.status}`
                    );
                }
                const pages = await response.json();
                dispatch(setPages(pages));
            } catch (error) {
                dispatch(
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load pages"
                    )
                );
            } finally {
                dispatch(setLoading(false));
            }
        };

        const loadSavedStylingTheme = () => {
            try {
                // here will be request to backend to get saved styling theme
                const savedStylingThemeJson = localStorage.getItem("stylingTheme");
                if (savedStylingThemeJson) {
                    const savedTheme: StoredThemeStyles =
                        JSON.parse(savedStylingThemeJson);

                    dispatch(saveStylingTheme(savedTheme));
                }
            } catch (error) {
                console.error("Failed to load saved themes:", error);
            }
        };

        loadPages();
        loadSavedStylingTheme();
    }, [dispatch]);

    return (
        <Box
            sx={{
                display: "flex",
                height: "100vh",
                bgcolor: "#f8f9fa"
            }}
        >
            <Sidebar />
            <ContentArea />
        </Box>
    );
};
