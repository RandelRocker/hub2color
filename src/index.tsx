import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { App } from "./js/components/main/App/App";
import { store } from "./js/store";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#1976d2"
        },
        secondary: {
            main: "#ff6b6b"
        },
        background: {
            default: "#f8f9fa",
            paper: "#ffffff"
        }
    },
    typography: {
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    height: "100%"
                },
                body: {
                    height: "100%"
                },
                "#root": {
                    height: "100%"
                }
            }
        }
    }
});

const container = document.getElementById("root");
if (!container) {
    throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(
    <StrictMode>
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <App />
            </ThemeProvider>
        </Provider>
    </StrictMode>
);
