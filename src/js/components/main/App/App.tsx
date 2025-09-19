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
    setSavedTheme
} from "../../../store/actions";

export const App = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const loadPages = async () => {
            try {
                dispatch(setLoading(true));
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

        const loadSavedThemes = () => {
            /**
             * {
             *    themeStyles: {
             *       [themeKey]: {
             *          isEnabled: boolean,
             *          value: value
             *       }
             *    },
             *    cssVariableStyles: {
             *       [cssVariable]: value
             *    }
             * }
             */
            try {
                const savedThemeJson = localStorage.getItem("stylingTheme");
                if (savedThemeJson) {
                    const savedTheme: StoredThemeStyles =
                        JSON.parse(savedThemeJson);

                    dispatch(setSavedTheme(savedTheme));
                }
            } catch (error) {
                console.error("Failed to load saved themes:", error);
            }
        };

        loadPages();
        loadSavedThemes();
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
