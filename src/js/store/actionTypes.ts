import { PageSection, ControlsSchema, StyleSchema, StoredThemeStyles, StylingTheme } from "./types";
import { ActionTypes } from "./constants";

export interface SetPagesAction {
    type: ActionTypes.SET_PAGES;
    payload: PageSection[];
}

export interface SetCurrentPageAction {
    type: ActionTypes.SET_CURRENT_PAGE;
    payload: string | null;
}

export interface SetControlsSchemaAction {
    type: ActionTypes.SET_CONTROLS_SCHEMA;
    payload: ControlsSchema | null;
}

export interface SetStyleSchemaAction {
    type: ActionTypes.SET_STYLE_SCHEMA;
    payload: StyleSchema | null;
}

export interface SetSelectedTemplateAction {
    type: ActionTypes.SET_SELECTED_TEMPLATE;
    payload: string | null;
}

export interface SetControlValueAction {
    type: ActionTypes.SET_CONTROL_VALUE;
    payload: { name: string; value: unknown };
}

export interface SetBulkControlsAction {
    type: ActionTypes.SET_BULK_CONTROLS;
    payload: Record<string, unknown>;
}

export interface SetStylingValueAction {
    type: ActionTypes.SET_STYLING_VALUE;
    payload: { name: string; value: unknown };
}

export interface updateStylingThemeAction {
    type: ActionTypes.UPDATE_STYLING_THEME;
    payload: StylingTheme;
}

export interface SetStylingUIStateAction {
    type: ActionTypes.SET_STYLING_UI_STATE;
    payload: { scrollPosition?: number; expandedAccordions?: string[] };
}

export interface SetSavedThemesAction {
    type: ActionTypes.SET_SAVED_THEME;
    payload: StoredThemeStyles;
}

export interface SetCustomCssAction {
    type: ActionTypes.SET_CUSTOM_CSS;
    payload: string;
}

export interface SetCustomJsAction {
    type: ActionTypes.SET_CUSTOM_JS;
    payload: string;
}

export interface SetZoomAction {
    type: ActionTypes.SET_ZOOM;
    payload: number;
}

export interface SetViewportAction {
    type: ActionTypes.SET_VIEWPORT;
    payload: "desktop" | "tablet" | "mobile";
}

export interface SetDirectionAction {
    type: ActionTypes.SET_DIRECTION;
    payload: "ltr" | "rtl";
}

export interface SetPanelDockAction {
    type: ActionTypes.SET_PANEL_DOCK;
    payload: "bottom" | "right";
}

export interface SetSearchQueryAction {
    type: ActionTypes.SET_SEARCH_QUERY;
    payload: string;
}

export interface SetLoadingAction {
    type: ActionTypes.SET_LOADING;
    payload: boolean;
}

export interface SetErrorAction {
    type: ActionTypes.SET_ERROR;
    payload: string | null;
}

export type AppAction =
    | SetPagesAction
    | SetCurrentPageAction
    | SetControlsSchemaAction
    | SetStyleSchemaAction
    | SetSelectedTemplateAction
    | SetControlValueAction
    | SetBulkControlsAction
    | SetStylingValueAction
    | updateStylingThemeAction
    | SetStylingUIStateAction
    | SetSavedThemesAction
    | SetCustomCssAction
    | SetCustomJsAction
    | SetZoomAction
    | SetViewportAction
    | SetDirectionAction
    | SetPanelDockAction
    | SetSearchQueryAction
    | SetLoadingAction
    | SetErrorAction;
