import { ActionTypes } from "./constants";
import { PageSection, ControlsSchema, StyleSchema, StoredThemeStyles, StylingTheme } from "./types";

export const setPages = (pages: PageSection[]) => ({
    type: ActionTypes.SET_PAGES,
    payload: pages,
});

export const setCurrentPage = (page: string | null) => ({
    type: ActionTypes.SET_CURRENT_PAGE,
    payload: page,
});

export const setControlsSchema = (schema: ControlsSchema | null) => ({
    type: ActionTypes.SET_CONTROLS_SCHEMA,
    payload: schema,
});

export const setStyleSchema = (schema: StyleSchema | null) => ({
    type: ActionTypes.SET_STYLE_SCHEMA,
    payload: schema,
});

export const updateStyleSchemaDefaults = () => ({
    type: ActionTypes.UPDATE_STYLE_SCHEMA_DEFAULTS,
});

export const setSelectedTemplate = (templateName: string | null) => ({
    type: ActionTypes.SET_SELECTED_TEMPLATE,
    payload: templateName,
});

export const setControlValue = (name: string, value: unknown) => ({
    type: ActionTypes.SET_CONTROL_VALUE,
    payload: { name, value },
});

export const setBulkControls = (values: Record<string, unknown>) => ({
    type: ActionTypes.SET_BULK_CONTROLS,
    payload: values,
});

export const setStylingValue = (name: string, value: unknown) => ({
    type: ActionTypes.SET_STYLING_VALUE,
    payload: { name, value },
});

export const updateStylingTheme = (theme: StylingTheme) => ({
    type: ActionTypes.UPDATE_STYLING_THEME,
    payload: theme,
});

export const setStylingUIState = (uiState: { scrollPosition?: number; expandedAccordions?: string[] }) => ({
    type: ActionTypes.SET_STYLING_UI_STATE,
    payload: uiState,
});

export const setSavedTheme = (stylingTheme: StoredThemeStyles) => ({
    type: ActionTypes.SET_SAVED_THEME,
    payload: stylingTheme,
});

export const setCustomCss = (css: string) => ({
    type: ActionTypes.SET_CUSTOM_CSS,
    payload: css,
});

export const setCustomJs = (js: string) => ({
    type: ActionTypes.SET_CUSTOM_JS,
    payload: js,
});

export const setZoom = (zoom: number) => ({
    type: ActionTypes.SET_ZOOM,
    payload: zoom,
});

export const setViewport = (viewport: "desktop" | "tablet" | "mobile") => ({
    type: ActionTypes.SET_VIEWPORT,
    payload: viewport,
});

export const setDirection = (direction: "ltr" | "rtl") => ({
    type: ActionTypes.SET_DIRECTION,
    payload: direction,
});

export const setPanelDock = (dock: "bottom" | "right") => ({
    type: ActionTypes.SET_PANEL_DOCK,
    payload: dock,
});

export const setSearchQuery = (query: string) => ({
    type: ActionTypes.SET_SEARCH_QUERY,
    payload: query,
});

export const setLoading = (loading: boolean) => ({
    type: ActionTypes.SET_LOADING,
    payload: loading,
});

export const setError = (error: string | null) => ({
    type: ActionTypes.SET_ERROR,
    payload: error,
});
