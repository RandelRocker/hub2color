import { useEffect } from "react";
import { Box } from "@mui/material";
import { useDispatch } from "react-redux";

import * as config from "../../../../../config";
import { TStoredThemeStyles } from "../../../store/types";
import { Sidebar } from "../Sidebar/Sidebar";
import { ContentArea } from "../ContentArea/ContentArea";
import {
    setPages,
    setLoading,
    setError,
    saveStylingTheme,
    setPortalTags,
    setSiteTheme,
    setPortalIcons
} from "../../../store/actions";
import { PortalTag, PortalTagRaw } from "../../../store/types";

export const App = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const loadPages = async () => {
            try {
                const response = await fetch(`${config.HUB2COLOR_PUBLIC_PATH}/config/menu.config.json`);
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
                    const savedTheme: TStoredThemeStyles =
                        JSON.parse(savedStylingThemeJson);

                    dispatch(saveStylingTheme(savedTheme));
                }
            } catch (error) {
                console.error("Failed to load saved themes:", error);
            }
        };

        const loadPortalTag = async () => {
            try {
                const response = await fetch(`${config.HUB2COLOR_PUBLIC_PATH}/config/tags.json`);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch tags: ${response.status}`
                    );
                }
                const data = await response.json();
                const tags = data.tags || [];
                
                // Transform tags: remove conditionIds, add conditions property
                const transformedTags: PortalTag[] = tags.map((tag: PortalTagRaw) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            } catch (error) {
                console.error("Failed to load portal tags:", error);
            }
        };

        const loadSiteTheme = async () => {
            try {
                const response = await fetch(`${config.HUB2COLOR_PUBLIC_PATH}/config/site-theme-response.json`);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch site theme: ${response.status}`
                    );
                }
                const data = await response.json();
                dispatch(setSiteTheme(data.themeName, data.themeUrl));
                return data.themeUrl;
            } catch (error) {
                console.error("Failed to load site theme:", error);
                return null;
            }
        };

        const loadIcons = async (themeUrl: string | null) => {
            if (!themeUrl) {
                console.error("Cannot load icons: themeUrl is not available");
                return;
            }
            
            try {
                const response = await fetch(`${config.HUB2COLOR_PUBLIC_PATH}/config/get-icons-response.json`);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch icons: ${response.status}`
                    );
                }
                const data = await response.json();
                
                // Transform icons: modify path to include themeUrl
                const transformedIcons: Record<string, string> = {};
                data.forEach((icon: { name: string; path: string }) => {
                    transformedIcons[icon.name] = `/${themeUrl}/${icon.path}`;
                });
                
                dispatch(setPortalIcons(transformedIcons));
            } catch (error) {
                console.error("Failed to load icons:", error);
            }
        };

        loadPages();
        loadSavedStylingTheme();
        loadPortalTag();
        
        // Load site theme first, then use the themeUrl to load icons
        loadSiteTheme().then((themeUrl) => {
            loadIcons(themeUrl);
        });
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
