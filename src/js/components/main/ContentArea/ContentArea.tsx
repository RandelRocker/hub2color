import { Box } from "@mui/material";
import { useSelector } from "react-redux";

import { TopBar } from "../TopBar/TopBar";
import { PreviewFrame } from "../PreviewFrame/PreviewFrame";
import { SettingsPanel } from "../SettingsPanel/SettingsPanel";
import { CodeEditorSidebar } from "../CodeEditorSidebar/CodeEditorSidebar";
import { RootState } from "../../../store";

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
                {componentSchema && <SettingsPanel />}
            </Box>
            {codeEditorSidebarOpen && <CodeEditorSidebar />}
        </Box>
    );
};
