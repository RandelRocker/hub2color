import { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";

import { TopBar } from "../TopBar/TopBar";
import { PreviewFrame } from "../PreviewFrame/PreviewFrame";
import { RootState } from "../../../store";

const SettingsPanel = lazy(() => 
    import(/* webpackChunkName: "settings-panel" */ "../SettingsPanel/SettingsPanel").then(module => {
        return { default: module.SettingsPanel };
    })
);
const CodeEditorSidebar = lazy(() => 
    import(/* webpackChunkName: "code-editor-sidebar" */ "../CodeEditorSidebar/CodeEditorSidebar").then(module => {
        return { default: module.CodeEditorSidebar };
    })
);

export const ContentArea = () => {
    const { componentSchema, codeEditorSidebarOpen } = useSelector((state: RootState) => state.app);

    return (
        <Box
            sx={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                overflow: "hidden"
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0
                }}
            >
                <TopBar />
                <PreviewFrame />
                {componentSchema && (
                    <Suspense
                        fallback={
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    minHeight: 320,
                                    bgcolor: "white",
                                    borderTop: 1,
                                    borderColor: "divider"
                                }}
                            >
                                <CircularProgress size={24} />
                            </Box>
                        }
                    >
                        <SettingsPanel />
                    </Suspense>
                )}
            </Box>
            {codeEditorSidebarOpen && (
                <Suspense
                    fallback={
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: 420,
                                bgcolor: "white",
                                borderLeft: 1,
                                borderColor: "divider"
                            }}
                        >
                            <CircularProgress size={24} />
                        </Box>
                    }
                >
                    <CodeEditorSidebar />
                </Suspense>
            )}
        </Box>
    );
};
