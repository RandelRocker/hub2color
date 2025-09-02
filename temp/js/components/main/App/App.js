import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { Box } from "@mui/material";
import { useDispatch } from "react-redux";
import { Sidebar } from "../Sidebar/Sidebar";
import { ContentArea } from "../ContentArea/ContentArea";
import { setPages, setLoading, setError } from "../../../store/actions";
export const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const loadPages = async () => {
      try {
        dispatch(setLoading(true));
        const response = await fetch("/api/pages.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.status}`);
        }
        const pages = await response.json();
        dispatch(setPages(pages));
      } catch (error) {
        dispatch(
          setError(
            error instanceof Error ? error.message : "Failed to load pages",
          ),
        );
      } finally {
        dispatch(setLoading(false));
      }
    };
    loadPages();
  }, [dispatch]);
  return _jsxs(Box, {
    sx: {
      display: "flex",
      height: "100vh",
      bgcolor: "#f8f9fa",
    },
    children: [_jsx(Sidebar, {}), _jsx(ContentArea, {})],
  });
};
