import { Box } from "@mui/material";
import { useSelector } from "react-redux";

import { TopBar } from "../TopBar/TopBar";
import { PreviewFrame } from "../PreviewFrame/PreviewFrame";
import { SettingsPanel } from "../SettingsPanel/SettingsPanel";
import { RootState } from "../../../store";

export const ContentArea = () => {
    const { panelDock } = useSelector((state: RootState) => state.app);

    const isBottomDock = panelDock === "bottom";

    return (
        <Box
            sx={{
                flex: 1,
                display: "flex",
                flexDirection: isBottomDock ? "column" : "row",
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
            </Box>
            <SettingsPanel />
        </Box>
    );
};
