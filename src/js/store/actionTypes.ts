import { PageSection, ComponentSchema, StylingTabValues, TStoredThemeStyles, ControlsTabValues, PortalTag, CustomHtmlPayload, ReferenceOverlayState, ServerResponsesMockConfig } from "./types";
import { ActionTypes } from "./constants";

export interface SetPagesAction {
    type: ActionTypes.SET_PAGES;
    payload: PageSection[];
}

export interface SetCurrentPageAction {
    type: ActionTypes.SET_CURRENT_PAGE;
    payload: string | null;
}

export interface SetComponentSchemaAction {
    type: ActionTypes.SET_COMPONENT_SCHEMA;
    payload: ComponentSchema | null;
}

export interface UpdateControlsTabValuesAction {
    type: ActionTypes.UPDATE_CONTROLS_TAB_VALUES;
    payload: ControlsTabValues;
}

export interface UpdateStyleTabValuesAction {
    type: ActionTypes.UPDATE_STYLE_TAB_VALUES;
    payload: StylingTabValues;
}

export interface SetServerResponsesMocksAction {
    type: ActionTypes.SET_SERVER_RESPONSES_MOCKS;
    payload: ServerResponsesMockConfig[];
}

export interface UpdateStyleTabValuesWithDefaultAction {
    type: ActionTypes.UPDATE_STYLE_TAB_VALUES_WITH_DEFAULT;
    payload: StylingTabValues;
}

export interface UpdateStyleTabToDefaultValuesAction {
    type: ActionTypes.UPDATE_STYLE_TAB_TO_DEFAULT_VALUES;
}

export interface UpdateStyleTabToPreviousValuesAction {
    type: ActionTypes.UPDATE_STYLE_TAB_TO_PREVIOUS_VALUES;
}

export interface UpdateStyleTabDefaultValuesAction {
    type: ActionTypes.UPDATE_STYLE_TAB_DEFAULT_VALUES;
}

export interface SetStylingTabUIStateAction {
    type: ActionTypes.SET_STYLING_TAB_UI_STATE;
    payload: { scrollPosition?: number; expandedAccordions?: string[] };
}

export interface SetPreviewBackgroundColorAction {
    type: ActionTypes.SET_PREVIEW_BACKGROUND_COLOR;
    payload: string;
}

export interface saveStylingThemeAction {
    type: ActionTypes.SET_STYLING_THEME;
    payload: TStoredThemeStyles;
}

export interface SetCustomCssAction {
    type: ActionTypes.SET_CUSTOM_CSS;
    payload: string;
}

export interface SetCustomJsAction {
    type: ActionTypes.SET_CUSTOM_JS;
    payload: string;
}

export interface SetCustomHtmlAction {
    type: ActionTypes.SET_CUSTOM_HTML;
    payload: CustomHtmlPayload;
}

export interface SetZoomAction {
    type: ActionTypes.SET_ZOOM;
    payload: number;
}

export interface SetViewportAction {
    type: ActionTypes.SET_VIEWPORT;
    payload: "desktop" | "tablet" | "mobile";
}

export interface SetViewportRotatedAction {
    type: ActionTypes.SET_VIEWPORT_ROTATED;
    payload: boolean;
}

export interface SetDirectionAction {
    type: ActionTypes.SET_DIRECTION;
    payload: "ltr" | "rtl";
}

export interface SetPanelDockAction {
    type: ActionTypes.SET_PANEL_DOCK;
    payload: "bottom";
}

export interface ToggleCodeEditorSidebarAction {
    type: ActionTypes.TOGGLE_CODE_EDITOR_SIDEBAR;
}

export interface ToggleTestSidebarAction {
    type: ActionTypes.TOGGLE_TEST_SIDEBAR;
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

export interface SetPortalTagsAction {
    type: ActionTypes.SET_PORTAL_TAGS;
    payload: PortalTag[];
}

export interface SetPortalTagsEnabledAction {
    type: ActionTypes.SET_PORTAL_TAGS_ENABLED;
    payload: boolean;
}

export interface SetSiteThemeAction {
    type: ActionTypes.SET_SITE_THEME;
    payload: { themeName: string; themeUrl: string };
}

export interface SetPortalIconsAction {
    type: ActionTypes.SET_PORTAL_ICONS;
    payload: Record<string, string>;
}

export interface SetReferenceOverlayAction {
    type: ActionTypes.SET_REFERENCE_OVERLAY;
    payload: ReferenceOverlayState | null;
}

export type AppAction =
    | SetPagesAction
    | SetCurrentPageAction
    | SetComponentSchemaAction
    | UpdateStyleTabValuesAction
    | UpdateControlsTabValuesAction
    | SetServerResponsesMocksAction
    | UpdateStyleTabValuesWithDefaultAction
    | SetStylingTabUIStateAction
    | UpdateStyleTabToDefaultValuesAction
    | UpdateStyleTabToPreviousValuesAction
    | UpdateStyleTabDefaultValuesAction
    | saveStylingThemeAction
    | SetCustomCssAction
    | SetCustomJsAction
    | SetCustomHtmlAction
    | SetZoomAction
    | SetViewportAction
    | SetViewportRotatedAction
    | SetDirectionAction
    | SetPanelDockAction
    | ToggleCodeEditorSidebarAction
    | ToggleTestSidebarAction
    | SetSearchQueryAction
    | SetLoadingAction
    | SetErrorAction
    | SetPortalTagsAction
    | SetPortalTagsEnabledAction
    | SetPreviewBackgroundColorAction
    | SetSiteThemeAction
    | SetPortalIconsAction
    | SetReferenceOverlayAction;
